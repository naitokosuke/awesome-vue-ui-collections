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
/**
 * The held column hangs from the pointer: it swings behind a move (degrees per px/s, up to
 * `MAX_TILT`) on a loose spring, so it sways back upright when the pointer stops.
 */
const TILT_PER_SPEED = 0.0012;
const MAX_TILT = 1.2;
const TILT_SPRING = { stiffness: 180, damping: 16 };
/** A released column is pulled onto its slot by a stiff spring, keeping the speed it was let go at. */
const LAND_SPRING = { stiffness: 320, damping: 34 };
const MAX_RELEASE_SPEED = 4000;
/** The held column's animations span this far each way, a millisecond per px or per `TILT_STEP` degrees (see `hold`). */
const REACH = 100_000;
const TILT_REACH = 10;
const TILT_STEP = 0.001;

/** A column of the table: its header and cells, where its slot is (grid coordinates), and its offset now. */
interface Column {
  id: string;
  elements: HTMLElement[];
  left: number;
  width: number;
  /** How far it's slid from its slot, in px. */
  offset: number;
}

/** An element of the held column: scrubbing `move` and `tilt` places it (see `hold`). */
interface Held {
  el: HTMLElement;
  /** Where the pointer took hold, as the element's transform-origin: the whole column turns about it. */
  origin: string;
  move: Animation;
  tilt: Animation;
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
  held: Held[];
  /** The pointer scrolls the table when it's left of `left` or right of `right` (client coordinates). */
  edges: { left: number; right: number };
  /** The boxes the page draws (see `Lifted`), once rendered. */
  lift: HTMLElement | null;
  slot: HTMLElement | null;
  /** The last frame: when it ran, and the column's offset (px), speed (px/s), tilt (deg) and spin (deg/s) then. */
  time: number;
  dx: number;
  velocity: number;
  tilt: number;
  spin: number;
}

/** What the page draws around a dragged column: its shadow, and the slot it would land in. */
export interface Lifted {
  kind: Kind;
  left: number;
  width: number;
  height: number;
  /** Where the pointer took hold, as the boxes' transform-origin. */
  origin: string;
}

/**
 * Dragging a column by its grip, with any pointer (mouse, pen, touch).
 *
 * The column itself is picked up: it follows the pointer above the others, under a shadow, swinging
 * a little behind fast moves, while a slot shows where it would land and the other columns make
 * way; on release a spring pulls it into the slot, from the speed it was let go at.
 *
 * The cells hold whole library apps, so they are never restyled while dragging: a class or an
 * inline style on one makes the browser restyle (and repaint) everything inside it. Instead:
 * - every move is a Web Animation of `translate` or `rotate`, which leaves nothing behind in the
 *   elements' style and lets the compositor move what's already painted;
 * - the shadow and the slot are empty boxes the page draws (see `lifted`);
 * - positions are measured once, at the start, and a frame that changes nothing writes nothing.
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
  let press: { pointerId: number; startX: number; startY: number; kind: Kind; id: string; table: HTMLElement } | null =
    null;
  let drag: Drag | null = null;
  let pointerX = 0;
  let frame = 0;

  function onPointerDown(event: PointerEvent, kind: Kind, id: string) {
    if (event.button !== 0 || press || drag) return;
    const grip = event.currentTarget as HTMLElement;
    press = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
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
    const { kind, id, startY, table } = press!;
    // Layout positions, read once: nothing is measured again while dragging.
    const columns = options.order(kind).map((columnId): Column => {
      const elements = [...table.querySelectorAll<HTMLElement>(`[data-column-item="${columnId}"]`)];
      return { id: columnId, elements, left: elements[0]!.offsetLeft, width: elements[0]!.offsetWidth, offset: 0 };
    });
    const from = columns.findIndex((column) => column.id === id);
    const { left, width, elements } = columns[from]!;
    const box = table.getBoundingClientRect();
    const head = elements[0]!.getBoundingClientRect();
    drag = {
      kind,
      id,
      table,
      columns,
      from,
      to: from,
      // From where the pointer is now, not where it pressed: the column doesn't jump by the threshold.
      startX: pointerX,
      startScroll: table.scrollLeft,
      held: hold(elements, pointerX, startY),
      edges: { left: table.querySelector(".corner")?.getBoundingClientRect().right ?? box.left, right: box.right },
      lift: null,
      slot: null,
      time: performance.now(),
      dx: Number.NaN,
      velocity: 0,
      tilt: 0,
      spin: 0,
    };
    lifted.value = {
      kind,
      left,
      width,
      height: table.querySelector(".grid")!.scrollHeight,
      origin: `${pointerX - head.left}px ${startY - (box.top + table.clientTop - table.scrollTop)}px`,
    };
  }

  /**
   * The dragged column's distance from its slot to under the pointer (grid coordinates), as far as
   * the table lets it go: it stops against the sticky label column (which it would slide under) and
   * at the end of the last column. A column picked up half under the labels just goes no further in.
   */
  function pointerOffset({ startX, table, startScroll, columns, from }: Drag) {
    const dragged = columns[from]!;
    const last = columns.at(-1)!;
    const labels = columns[0]!.left + table.scrollLeft;
    const min = Math.min(0, labels - dragged.left);
    const max = last.left + last.width - dragged.width - dragged.left;
    return Math.max(min, Math.min(max, pointerX - startX + (table.scrollLeft - startScroll)));
  }

  /** Once a frame while dragging: the column follows the pointer, the others make way, the table scrolls near an edge. */
  function tick(now: number) {
    frame = 0;
    if (!drag) return;
    autoScroll(drag);
    const { columns, from, held, table } = drag;
    const dragged = columns[from]!;
    drag.lift ??= table.querySelector<HTMLElement>(".column-lift");
    drag.slot ??= table.querySelector<HTMLElement>(".column-slot");

    const dx = pointerOffset(drag);
    const seconds = Math.min(Math.max(now - drag.time, 0) / 1000, 1 / 30);
    drag.time = now;
    if (dx !== drag.dx) {
      for (const { move } of held) move.currentTime = REACH + dx;
      if (drag.lift) drag.lift.style.translate = `${dx}px 0`;
    }
    if (seconds > 0 && !Number.isNaN(drag.dx)) {
      // Smoothed over a few frames: pointers report unevenly.
      drag.velocity += ((dx - drag.dx) / seconds - drag.velocity) * 0.25;
      swing(drag, seconds);
    }
    drag.dx = dx;

    // The slot under the dragged column's middle, and every other column's offset for that order.
    const middle = dragged.left + dx + dragged.width / 2;
    const index = columns.findIndex((column) => middle < column.left + column.width);
    const to = index === -1 ? columns.length - 1 : index;
    if (to !== drag.to) {
      drag.to = to;
      if (drag.slot) drag.slot.style.translate = `${slotOffset(drag)}px 0`;
      for (const [i, column] of columns.entries()) {
        if (i === from) continue;
        slideTo(column, from < i && i <= to ? -dragged.width : to <= i && i < from ? dragged.width : 0);
      }
    }
    frame = requestAnimationFrame(tick);
  }

  /** The held column's tilt follows its speed on a spring; at rest, upright, it's left alone. */
  function swing(current: Drag, seconds: number) {
    const target = reducedMotion() ? 0 : Math.max(-MAX_TILT, Math.min(MAX_TILT, current.velocity * TILT_PER_SPEED));
    if (target === 0 && current.tilt === 0) return;
    current.spin += (TILT_SPRING.stiffness * (target - current.tilt) - TILT_SPRING.damping * current.spin) * seconds;
    current.tilt += current.spin * seconds;
    if (Math.abs(target) < TILT_STEP && Math.abs(current.tilt) < TILT_STEP * 5 && Math.abs(current.spin) < 0.05) {
      current.tilt = 0;
      current.spin = 0;
    }
    for (const { tilt } of current.held) tilt.currentTime = (TILT_REACH + current.tilt) / TILT_STEP;
    if (current.lift) current.lift.style.rotate = `${current.tilt}deg`;
  }

  /** Near the left (just right of the sticky label column) or right edge, the table scrolls. */
  function autoScroll({ table, edges }: Drag) {
    const speed = (depth: number) => Math.ceil((Math.min(depth, EDGE) / EDGE) * 16);
    if (pointerX < edges.left + EDGE) table.scrollLeft -= speed(edges.left + EDGE - pointerX);
    else if (pointerX > edges.right - EDGE) table.scrollLeft += speed(pointerX - (edges.right - EDGE));
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
    if (current.slot) current.slot.style.translate = "";
    for (const column of current.columns) slideTo(column, 0);
    await land(current, 0);
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
   * The whole landing is worked out here and handed over as keyframes: no frame of it runs script.
   */
  async function land(current: Drag, shift: number) {
    const dx = pointerOffset(current);
    for (const { move, tilt } of current.held) {
      move.cancel();
      tilt.cancel();
    }
    if (!reducedMotion()) {
      const path = settle(dx - shift, current.velocity, current.tilt, current.spin);
      const timing = { duration: ((path.length - 1) * 1000) / 60 };
      const { lift } = current;
      if (lift) {
        lift.style.translate = `${shift}px 0`;
        lift.style.rotate = "";
        lift.animate(
          path.map(([x, tilt]) => ({ translate: `${x + shift}px 0`, rotate: `${tilt}deg` })),
          timing,
        );
        // The shadow closes up as the column comes down onto the table.
        lift.animate({ opacity: [1, 0] }, { ...timing, easing: "ease-in" });
      }
      const landings = current.held.map(({ el, origin }) =>
        el.animate(
          path.map(([x, tilt]) => ({
            translate: `${x}px 0`,
            rotate: `${tilt}deg`,
            transformOrigin: origin,
            zIndex: raised(el),
          })),
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
 * Picks a column up, by the point (client coordinates) the pointer holds it at: two paused
 * animations on each of its elements, one spanning `REACH` px each way and one `TILT_REACH` degrees
 * about that point, so moving and tilting the column is setting their `currentTime` (no style is written).
 */
function hold(elements: HTMLElement[], x: number, y: number): Held[] {
  return elements.map((el) => {
    const box = el.getBoundingClientRect();
    const origin = `${x - box.left}px ${y - box.top}px`;
    const move = el.animate(
      [
        { translate: `${-REACH}px 0`, zIndex: raised(el) },
        { translate: `${REACH}px 0`, zIndex: raised(el) },
      ],
      { duration: REACH * 2, fill: "both" },
    );
    move.pause();
    move.currentTime = REACH;
    const tilt = el.animate(
      [
        { rotate: `${-TILT_REACH}deg`, transformOrigin: origin },
        { rotate: `${TILT_REACH}deg`, transformOrigin: origin },
      ],
      { duration: (TILT_REACH * 2) / TILT_STEP, fill: "both" },
    );
    tilt.pause();
    tilt.currentTime = TILT_REACH / TILT_STEP;
    return { el, origin, move, tilt };
  });
}

/**
 * A landing, frame by frame (60 a second) as `[px from the slot, degrees of tilt]`: the column,
 * `x` px off its slot and moving at `velocity` px/s, is pulled in by the landing spring while its
 * tilt swings out, until both are at rest.
 */
function settle(x: number, velocity: number, tilt: number, spin: number) {
  let v = Math.max(-MAX_RELEASE_SPEED, Math.min(MAX_RELEASE_SPEED, velocity));
  const path: [number, number][] = [[x, tilt]];
  const step = 1 / 240;
  for (let i = 1; i <= 360; i++) {
    v += (-LAND_SPRING.stiffness * x - LAND_SPRING.damping * v) * step;
    x += v * step;
    spin += (-TILT_SPRING.stiffness * tilt - TILT_SPRING.damping * spin) * step;
    tilt += spin * step;
    if (i % 4 !== 0) continue;
    if (Math.abs(x) < 0.5 && Math.abs(v) < 20 && Math.abs(tilt) < 0.02 && Math.abs(spin) < 1) break;
    path.push([x, tilt]);
  }
  path.push([0, 0]);
  return path;
}

/** Slides a column from where it is now (mid-slide or not) to `offset` px off its slot, and keeps it there. */
function slideTo(column: Column, offset: number) {
  if (offset === column.offset) return;
  column.offset = offset;
  const from = Number.parseFloat(getComputedStyle(column.elements[0]!).translate) || 0;
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
