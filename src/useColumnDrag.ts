import { useEventListener } from "@vueuse/core";
import { nextTick, ref } from "vue";
import type { Kind } from "./libs/types";

/** How far the pointer moves before a press on a grip becomes a drag (a plain press only focuses it). */
const DRAG_THRESHOLD = 4;
/** Within this distance of the table's scrollable edges, the table scrolls toward the pointer. */
const EDGE = 48;
/** How the other columns make way (react-beautiful-dnd's "out of the way" timing). */
const SLIDE_MS = 200;
const SLIDE_EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** A released column lands faster the nearer its slot is, braking hard (react-beautiful-dnd's drop). */
const DROP_MS = { min: 250, max: 450 };
const DROP_FULL_DISTANCE = 1500;
const DROP_EASING = "cubic-bezier(0.2, 1, 0.1, 1)";
/** A cancelled drag goes back quicker than a drop lands. */
const CANCEL_SPEED = 0.6;
/** The held column's animation spans this many px each way, a millisecond per px (see `hold`). */
const REACH = 100_000;

/** A column of the table: its header and cells, where its slot is (grid coordinates), and its offset now. */
interface Column {
  id: string;
  elements: HTMLElement[];
  left: number;
  width: number;
  /** How far it's slid from its slot, in px. */
  offset: number;
}

interface Drag {
  kind: Kind;
  id: string;
  table: HTMLElement;
  columns: Column[];
  /** The dragged column's index, and the one it takes if released now. */
  from: number;
  to: number;
  startX: number;
  startScroll: number;
  /** The animations that keep the dragged column under the pointer. */
  held: Animation[];
}

/** What the page draws around a dragged column: its shadow, and the slot it would land in. */
export interface Lifted {
  kind: Kind;
  left: number;
  width: number;
  height: number;
}

/**
 * Dragging a column by its grip, with any pointer (mouse, pen, touch).
 *
 * The column itself is picked up: it follows the pointer above the others, under a shadow, while a
 * slot shows where it would land and the other columns make way; on release it settles into the slot.
 *
 * The cells hold whole library apps, so they are never restyled while dragging: a class or an
 * inline style on one makes the browser restyle (and repaint) everything inside it. Instead:
 * - every move is a Web Animation of `translate`, which leaves nothing behind in the elements' style;
 * - the shadow and the slot are empty boxes the page draws (see `lifted`);
 * - positions are measured once, at the start.
 * On release the order is saved (the grid places the columns in their new slots, see Shell.vue)
 * and the column lands from under the pointer. Escape, or a cancelled pointer, puts everything back.
 *
 * Every element of a column (its header and cells) has `data-column-item` set to the library id.
 */
export function useColumnDrag(options: {
  /** The tab's column ids, in the order shown. */
  order: (kind: Kind) => string[];
  /** Keeps the order the drag ended with. */
  commit: (kind: Kind, ids: string[], id: string) => void;
}) {
  const lifted = ref<Lifted | null>(null);
  let press: { pointerId: number; startX: number; kind: Kind; id: string; table: HTMLElement } | null = null;
  let drag: Drag | null = null;
  let pointerX = 0;
  let frame = 0;

  function onPointerDown(event: PointerEvent, kind: Kind, id: string) {
    if (event.button !== 0 || press || drag) return;
    const grip = event.currentTarget as HTMLElement;
    press = {
      pointerId: event.pointerId,
      startX: event.clientX,
      kind,
      id,
      table: grip.closest<HTMLElement>(".table")!,
    };
    pointerX = event.clientX;
    // Moves and the release reach the grip even once the pointer has left it.
    grip.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!press || event.pointerId !== press.pointerId) return;
    pointerX = event.clientX;
    if (!drag) {
      if (Math.abs(pointerX - press.startX) < DRAG_THRESHOLD) return;
      start();
    }
    // At most once a frame, however often the pointer reports.
    frame ||= requestAnimationFrame(tick);
  }

  function onPointerUp(event: PointerEvent) {
    if (!press || event.pointerId !== press.pointerId) return;
    press = null;
    if (drag) drop();
  }

  function onPointerCancel() {
    press = null;
    if (drag) cancel();
  }

  // While dragging, Escape puts the columns back.
  useEventListener(window, "keydown", (event: KeyboardEvent) => {
    if (drag && event.key === "Escape") {
      event.preventDefault();
      press = null;
      cancel();
    }
  });

  function start() {
    const { kind, id, startX, table } = press!;
    // Layout positions, read once: nothing is measured again while dragging.
    const columns = options.order(kind).map((columnId): Column => {
      const elements = [...table.querySelectorAll<HTMLElement>(`[data-column-item="${columnId}"]`)];
      return { id: columnId, elements, left: elements[0]!.offsetLeft, width: elements[0]!.offsetWidth, offset: 0 };
    });
    const from = columns.findIndex((column) => column.id === id);
    const { left, width, elements } = columns[from]!;
    drag = { kind, id, table, columns, from, to: from, startX, startScroll: table.scrollLeft, held: hold(elements) };
    lifted.value = { kind, left, width, height: table.querySelector(".grid")!.scrollHeight };
  }

  /** The dragged column's distance from its slot to under the pointer (grid coordinates). */
  const pointerOffset = ({ startX, table, startScroll }: Drag) => pointerX - startX + (table.scrollLeft - startScroll);
  const liftElement = ({ table }: Drag) => table.querySelector<HTMLElement>(".column-lift");
  const slotElement = ({ table }: Drag) => table.querySelector<HTMLElement>(".column-slot");

  /** Once a frame while dragging: the column follows the pointer, the others make way, the table scrolls near an edge. */
  function tick() {
    frame = 0;
    if (!drag) return;
    autoScroll(drag);
    const { columns, from, held } = drag;
    const dragged = columns[from]!;
    const dx = pointerOffset(drag);
    for (const animation of held) animation.currentTime = REACH + dx;
    const lift = liftElement(drag);
    if (lift) lift.style.translate = `${dx}px 0`;

    // The slot under the dragged column's middle, and every other column's offset for that order.
    const middle = dragged.left + dx + dragged.width / 2;
    const index = columns.findIndex((column) => middle < column.left + column.width);
    const to = index === -1 ? columns.length - 1 : index;
    if (to !== drag.to) {
      drag.to = to;
      const slot = slotElement(drag);
      if (slot) slot.style.translate = `${slotOffset(drag)}px 0`;
      for (const [i, column] of columns.entries()) {
        if (i === from) continue;
        slideTo(column, from < i && i <= to ? -dragged.width : to <= i && i < from ? dragged.width : 0);
      }
    }
    frame = requestAnimationFrame(tick);
  }

  /** Near the left (just right of the sticky label column) or right edge, the table scrolls. */
  function autoScroll({ table }: Drag) {
    const box = table.getBoundingClientRect();
    const left = table.querySelector(".corner")?.getBoundingClientRect().right ?? box.left;
    const speed = (depth: number) => Math.ceil((Math.min(depth, EDGE) / EDGE) * 16);
    if (pointerX < left + EDGE) table.scrollLeft -= speed(left + EDGE - pointerX);
    else if (pointerX > box.right - EDGE) table.scrollLeft += speed(pointerX - (box.right - EDGE));
  }

  /** Saves the order (dropping the slides as the grid takes them over), then lands the column in its slot. */
  async function drop() {
    const current = end();
    const { columns, from, to } = current;
    for (const column of columns) stopSliding(column);
    if (to !== from) {
      const ids = columns.map((column) => column.id);
      ids.splice(to, 0, ...ids.splice(from, 1));
      options.commit(current.kind, ids, current.id);
      await nextTick();
    }
    await land(current, slotOffset(current));
  }

  /** Slides every column back to its slot, the dragged one from under the pointer. */
  async function cancel() {
    const current = end();
    const slot = slotElement(current);
    if (slot) slot.style.translate = "";
    for (const column of current.columns) slideTo(column, 0);
    await land(current, 0, CANCEL_SPEED);
    for (const column of current.columns) stopSliding(column);
  }

  /** Ends the drag (no more frames); the column stays lifted until it has landed. */
  function end() {
    cancelAnimationFrame(frame);
    frame = 0;
    const current = drag!;
    drag = null;
    return current;
  }

  /**
   * The dragged column comes down from under the pointer onto its slot, and its shadow goes with it.
   * `shift` is how far the layout has already moved the column toward the slot (a saved order has).
   */
  async function land(current: Drag, shift: number, speed = 1) {
    const dx = pointerOffset(current);
    for (const animation of current.held) animation.cancel();
    if (!reducedMotion()) {
      const distance = Math.abs(dx - shift);
      const timing = {
        duration: (DROP_MS.min + (DROP_MS.max - DROP_MS.min) * Math.min(distance / DROP_FULL_DISTANCE, 1)) * speed,
        easing: DROP_EASING,
      };
      const lift = liftElement(current);
      if (lift) {
        lift.style.translate = `${shift}px 0`;
        lift.animate([{ translate: `${dx}px 0` }, { translate: `${shift}px 0`, opacity: 0 }], timing);
      }
      const landings = current.columns[current.from]!.elements.map((el) =>
        el.animate(
          [
            { translate: `${dx - shift}px 0`, zIndex: raised(el) },
            { translate: "0 0", zIndex: raised(el) },
          ],
          timing,
        ),
      );
      await Promise.all(landings.map((animation) => animation.finished.catch(() => {})));
    }
    if (!drag) lifted.value = null;
  }

  return { lifted, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The slot the dragged column would take, as its offset from the slot it was picked up from. */
const slotOffset = ({ columns, from, to }: Drag) => columns[to]!.left - columns[from]!.left;

/** A lifted column's z-index: over the other headers (3) or cells, under the sticky labels (2) and corner (5). */
const raised = (el: HTMLElement) => (el.classList.contains("head") ? 4 : 1);

/**
 * Picks a column up: a paused animation on each of its elements, spanning `REACH` px each way at a
 * millisecond per px, so moving the column is setting `currentTime` (no style is written).
 */
function hold(elements: HTMLElement[]) {
  return elements.map((el) => {
    const animation = el.animate(
      [
        { translate: `${-REACH}px 0`, zIndex: raised(el) },
        { translate: `${REACH}px 0`, zIndex: raised(el) },
      ],
      { duration: REACH * 2, fill: "both" },
    );
    animation.pause();
    animation.currentTime = REACH;
    return animation;
  });
}

/** Slides a column from where it is to `offset` px off its slot, and keeps it there (fill: forwards). */
function slideTo(column: Column, offset: number) {
  if (offset === column.offset) return;
  const from = column.offset;
  column.offset = offset;
  for (const el of column.elements) {
    for (const animation of el.getAnimations()) if (animation.id === "column-slide") animation.cancel();
    const animation = el.animate([{ translate: `${from}px 0` }, { translate: `${offset}px 0` }], {
      duration: reducedMotion() ? 0 : SLIDE_MS,
      easing: SLIDE_EASING,
      fill: "forwards",
    });
    animation.id = "column-slide";
  }
}

/** Drops a column's slide at once: it's back on its slot (where the grid now puts what should be there). */
function stopSliding(column: Column) {
  column.offset = 0;
  for (const el of column.elements) {
    for (const animation of el.getAnimations()) if (animation.id === "column-slide") animation.cancel();
  }
}
