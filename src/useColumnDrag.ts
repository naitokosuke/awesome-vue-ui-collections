import { useEventListener } from "@vueuse/core";
import { nextTick, ref } from "vue";
import type { Kind } from "./libs/types";

/** How far the pointer moves before a press on a grip becomes a drag (a plain press only focuses it). */
const DRAG_THRESHOLD = 4;
/** Within this distance of the table's scrollable edges, the table scrolls toward the pointer. */
const EDGE = 48;
/** How long a column takes to slide into a new slot, and the ghost to land on release. */
const SLIDE_MS = 150;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";

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
}

/** What the page draws while a column is dragged: a ghost of it, at its slot, that follows the pointer. */
export interface Ghost {
  kind: Kind;
  id: string;
  left: number;
  width: number;
  height: number;
}

/**
 * Dragging a column by its grip, with any pointer (mouse, pen, touch).
 *
 * The cells hold whole library apps, so they are never restyled while dragging: a class or an
 * inline style on one makes the browser restyle (and repaint) everything inside it. Instead:
 * - a ghost (an empty box the page draws, see `ghost`) follows the pointer, by `translate`;
 * - the real columns slide to the slots they'd end up in, with Web Animations of `translate`,
 *   which run on the compositor and leave nothing behind in the elements' style;
 * - positions are measured once, at the start.
 * On release the order is saved (the grid places the columns in their new slots, see Shell.vue),
 * the slides are dropped, and the ghost lands on the column's new slot. Escape, or a cancelled
 * pointer, slides everything back.
 *
 * Every element of a column (its header and cells) has `data-column-item` set to the library id.
 */
export function useColumnDrag(options: {
  /** The tab's column ids, in the order shown. */
  order: (kind: Kind) => string[];
  /** Keeps the order the drag ended with. */
  commit: (kind: Kind, ids: string[], id: string) => void;
}) {
  const ghost = ref<Ghost | null>(null);
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
    drag = { kind, id, table, columns, from, to: from, startX, startScroll: table.scrollLeft };
    const { left, width } = columns[from]!;
    ghost.value = { kind, id, left, width, height: table.firstElementChild!.scrollHeight };
  }

  /** The dragged column's distance from its slot to under the pointer (grid coordinates). */
  const pointerOffset = ({ startX, table, startScroll }: Drag) => pointerX - startX + (table.scrollLeft - startScroll);
  const ghostElement = ({ table }: Drag) => table.querySelector<HTMLElement>(".column-ghost");

  /** Once a frame while dragging: the ghost follows the pointer, columns make way, the table scrolls near an edge. */
  function tick() {
    frame = 0;
    if (!drag) return;
    autoScroll(drag);
    const { columns, from } = drag;
    const dragged = columns[from]!;
    const dx = pointerOffset(drag);
    const element = ghostElement(drag);
    if (element) element.style.translate = `${dx}px 0`;

    // The slot under the ghost's middle, and every column's offset for that order.
    const middle = dragged.left + dx + dragged.width / 2;
    const index = columns.findIndex((column) => middle < column.left + column.width);
    const to = index === -1 ? columns.length - 1 : index;
    if (to !== drag.to) {
      drag.to = to;
      for (const [i, column] of columns.entries()) {
        const offset =
          i === from
            ? columns[to]!.left - dragged.left
            : from < i && i <= to
              ? -dragged.width
              : to <= i && i < from
                ? dragged.width
                : 0;
        slideTo(column, offset);
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

  /** Saves the order (dropping the slides as the grid takes them over), then lands the ghost on its slot. */
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
    await land(current, columns[to]!.left - columns[from]!.left);
  }

  /** Slides every column back to its slot, and the ghost with them. */
  async function cancel() {
    const current = end();
    for (const column of current.columns) slideTo(column, 0);
    await land(current, 0);
    for (const column of current.columns) stopSliding(column);
  }

  /** Ends the drag (no more frames); the ghost stays until it has landed. */
  function end() {
    cancelAnimationFrame(frame);
    frame = 0;
    const current = drag!;
    drag = null;
    return current;
  }

  /** The ghost slides from under the pointer onto a slot (given as its offset from the dragged column's), then goes. */
  async function land(current: Drag, offset: number) {
    const element = ghostElement(current);
    if (element && !reducedMotion()) {
      const dx = pointerOffset(current);
      element.style.translate = `${offset}px 0`;
      await element
        .animate([{ translate: `${dx}px 0` }, { translate: `${offset}px 0` }], {
          duration: SLIDE_MS,
          easing: EASING,
        })
        .finished.catch(() => {});
    }
    if (!drag) ghost.value = null;
  }

  return { ghost, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Slides a column from where it is to `offset` px off its slot, and keeps it there (fill: forwards). */
function slideTo(column: Column, offset: number) {
  if (offset === column.offset) return;
  const from = column.offset;
  column.offset = offset;
  for (const el of column.elements) {
    for (const animation of el.getAnimations()) if (animation.id === "column-slide") animation.cancel();
    const animation = el.animate([{ translate: `${from}px 0` }, { translate: `${offset}px 0` }], {
      duration: reducedMotion() ? 0 : SLIDE_MS,
      easing: EASING,
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
