<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconGripVertical from "~icons/lucide/grip-vertical";
import IconSlidersHorizontal from "~icons/lucide/sliders-horizontal";
import IconX from "~icons/lucide/x";
import { DEMO_LABELS, groups, KIND_LABELS, npmFetchedAt, orderColumns } from "./board";
import { libraries } from "./libs";
import { readableOn } from "./libs/color";
import { type Color, COLORS, DEMOS, type DemoKey, type Kind, type Library, SIZES } from "./libs/types";
import LibraryLinks from "./LibraryLinks.vue";
import LibraryLogo from "./LibraryLogo.vue";
import RadioGroup from "./RadioGroup.vue";
import { controls } from "./store";
import ToggleSwitch from "./ToggleSwitch.vue";
import TopBar from "./TopBar.vue";
import { useColumnDrag } from "./useColumnDrag";
import { useSelectionRect } from "./useSelectionRect";
import { useLibraryApps } from "./useLibraryApps";
import { useLibraryTravel } from "./useLibraryTravel";

const SIZE_LABELS = { small: "sm", medium: "md", large: "lg" } as const;

/** "default" (each library's own color) followed by the shared palette. */
const COLOR_OPTIONS = [
  "default",
  COLORS.black,
  COLORS.blue,
  COLORS.violet,
  COLORS.green,
  COLORS.orange,
  COLORS.rose,
] as const;

const COLOR_NAMES = Object.fromEntries(Object.entries(COLORS).map(([name, value]) => [value, name])) as Record<
  Color,
  string
>;

/** The store keeps `null` for "default"; the radio group needs a string value for it. */
const colorChoice = computed<(typeof COLOR_OPTIONS)[number]>({
  get: () => controls.color ?? "default",
  set: (value) => {
    controls.color = value === "default" ? null : value;
  },
});

/**
 * Minimum height of each demo row: the tallest any library gets at any size, so switching size
 * never changes row heights. Shell.test.ts fails when a demo outgrows its entry at some size.
 */
const ROW_HEIGHTS: Record<DemoKey, number> = {
  button: 88,
  // The headless inputs, label above the field, at lg.
  input: 101,
  select: 88,
  switch: 88,
  dialog: 88,
};

/** Phones show one component at a time, each library's demo of it stacked (see "phone layout"). */
const phoneDemo = ref<DemoKey>("button");
/**
 * On phones every setting (theme, size, color, stats, the picked component's options) is in a
 * dialog over the page, so opening it moves nothing: the settings section is teleported into it.
 */
const phone = useMediaQuery("(width < 40rem)");
const optionsDialog = useTemplateRef<HTMLDialogElement>("optionsDialog");

// Wider again: the section goes back onto the page, so the dialog would be empty.
watch(phone, (isPhone) => {
  if (!isPhone) optionsDialog.value?.close();
});

onMounted(async () => {
  const linked = libraries.find((lib) => lib.id === new URLSearchParams(location.search).get("lib"));
  if (!linked) return;
  controls.kind = linked.kind;
  history.replaceState(null, "", location.pathname);
  await nextTick();
  document.querySelector(`.head[data-column-item="${linked.id}"]`)?.scrollIntoView({ inline: "start" });
});

// Only from the part of the table that shows: not from under the label column, nor from a hidden tab.
useLibraryTravel(
  () =>
    [...document.querySelectorAll<HTMLElement>(".head[data-column-item]")].map((head) => ({
      id: head.dataset.columnItem!,
      logo: head.querySelector<HTMLElement>(".head-logo"),
      name: head.querySelector<HTMLElement>(".name"),
    })),
  (el) => {
    const rect = el.getBoundingClientRect();
    const table = el.closest(".table")!.getBoundingClientRect();
    const label = el.closest(".grid")!.querySelector(".corner")!.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.left >= label.right &&
      rect.right <= table.right &&
      rect.top >= table.top &&
      rect.bottom <= table.bottom
    );
  },
);

const { isLoading, errors, setCell, setOverlay } = useLibraryApps(() => controls.kind);

/** Libraries with an app of their own (not stats-only), each of which gets an overlay host. */
const mountedLibraries = libraries.filter((lib) => lib.load);

/**
 * The kind tabs' underline: one element under the checked tab, which slides to the next one
 * (see useSelectionRect).
 */
const tabs = useTemplateRef<HTMLElement>("tabs");
const indicator = useSelectionRect(tabs, ".tab:has(:checked)", () => controls.kind);

/**
 * Each tab's saved column order, as every column's position in it. The grid places a column's
 * header and cells by it (`--avc-column`) rather than by DOM order, so reordering moves no
 * element: moving a cell out and back in restyles everything its library rendered in it, which
 * made each move take a third of a second. `reading-flow` keeps focus (and reading) order in
 * step with the grid, and `aria-colindex` tells assistive tech each cell's column.
 */
const positions = computed(
  () =>
    Object.fromEntries(
      groups.map((group) => [
        group.kind,
        Object.fromEntries(orderColumns(group.columns, controls.order[group.kind]).map((lib, i) => [lib.id, i])),
      ]),
    ) as Record<Kind, Record<string, number>>,
);

/** Read out after each move, for screen readers. */
const announcement = ref("");

const columnIds = (kind: Kind) =>
  orderColumns(groups.find((group) => group.kind === kind)!.columns, controls.order[kind]).map((lib) => lib.id);

/** Saves a tab's new order, after `id` was moved. */
function saveOrder(kind: Kind, ids: string[], id: string) {
  controls.order = { ...controls.order, [kind]: ids };
  announcement.value = `${nameOf(id)} moved to column ${ids.indexOf(id) + 1} of ${ids.length}`;
}

function moveTo(kind: Kind, id: string, to: number) {
  const ids = columnIds(kind);
  const from = ids.indexOf(id);
  if (from === -1 || to < 0 || to >= ids.length || to === from) return;
  ids.splice(to, 0, ...ids.splice(from, 1));
  saveOrder(kind, ids, id);
}

/** Dragging a grip: the column follows the pointer, the others make way, the order is saved on release (see useColumnDrag). */
const { lifted, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useColumnDrag({
  order: columnIds,
  commit: saveOrder,
});

const liftedBox = computed(
  () =>
    lifted.value && {
      insetInlineStart: `${lifted.value.left}px`,
      inlineSize: `${lifted.value.width}px`,
      blockSize: `${lifted.value.height}px`,
      transformOrigin: lifted.value.origin,
    },
);

/** The reset button goes away with the saved order, so focus moves on to the first column's grip. */
async function resetOrder(event: MouseEvent, kind: Kind) {
  const table = (event.currentTarget as HTMLElement).closest(".table")!;
  const { [kind]: _, ...rest } = controls.order;
  controls.order = rest;
  announcement.value = "Columns back in their default order";
  await nextTick();
  table.querySelector<HTMLElement>(".grip")?.focus();
}

const nameOf = (id: string) => libraries.find((lib) => lib.id === id)!.name;

function scopeAttrs(lib: Library) {
  return { "data-lib": lib.id, ...(controls.isDark ? lib.darkAttrs : lib.lightAttrs) };
}
</script>

<template>
  <div class="shell" :class="{ 'is-dark': controls.isDark }">
    <TopBar page="compare" theme-in-settings>
      <!-- Phones only: opens the settings, which take the theme switch along. -->
      <button
        type="button"
        aria-controls="options-dialog"
        aria-haspopup="dialog"
        class="options-toggle"
        @click="optionsDialog?.showModal()"
      >
        <IconSlidersHorizontal aria-hidden="true" />
        options
      </button>
    </TopBar>

    <main class="page">
      <h1 class="visually-hidden">Compare</h1>
      <!-- Which libraries to show: a tab row of its own, separate from the demo options below. -->
      <div ref="tabs" aria-label="Library kind" class="tabs" role="radiogroup">
        <label v-for="group in groups" :key="group.kind" class="tab">
          <input v-model="controls.kind" name="kind" type="radio" :value="group.kind">
          {{ KIND_LABELS[group.kind].name.toLowerCase() }}
          <span class="muted">{{ group.columns.length }}</span>
        </label>
        <span
          v-if="indicator"
          aria-hidden="true"
          class="tab-indicator"
          :style="{ translate: `${indicator.x}px ${indicator.y + indicator.height}px`, width: `${indicator.width}px` }"
        />
      </div>
      <!-- Every kind's description in one cell, the others hidden: as tall as the longest at any width. -->
      <div class="kind-description">
        <p v-for="group in groups" :key="group.kind" :class="{ hidden: group.kind !== controls.kind }">
          {{ KIND_LABELS[group.kind].description }}
        </p>
      </div>

      <!-- Options for the demos, right above the table they affect. -->
      <!-- Label column + options column; each row is a subgrid, so every row starts at the same x. -->
      <Teleport defer to="#options-dialog-body" :disabled="!phone">
        <section aria-label="Demo options" class="facets">
          <!-- The phone-only rows stand in for what's elsewhere on wider screens: the top bar's theme
             switch, the table's stats switch and the row's options. -->
          <div class="facet phone-only">
            <span aria-hidden="true" class="facet-label">theme</span>
            <ToggleSwitch v-model="controls.isDark">dark</ToggleSwitch>
          </div>
          <div class="facet">
            <span aria-hidden="true" class="facet-label">size</span>
            <div class="options">
              <RadioGroup v-model="controls.size" :options="SIZES" legend="Size" name="size">
                <template #option="{ option }">{{ SIZE_LABELS[option] }}</template>
              </RadioGroup>
            </div>
          </div>
          <!-- Every kind takes it, so the row never comes and goes (which would move the table). -->
          <div class="facet">
            <span aria-hidden="true" class="facet-label">color</span>
            <div class="options">
              <RadioGroup
                v-model="colorChoice"
                appearance="swatches"
                :options="COLOR_OPTIONS"
                legend="Primary color"
                name="color"
              >
                <template #option="{ option }">
                  <template v-if="option === 'default'">default</template>
                  <template v-else>
                    <span class="swatch" :style="{ background: option }" :title="COLOR_NAMES[option]" />
                    <span class="visually-hidden">{{ COLOR_NAMES[option] }}</span>
                    <span class="swatch-code" :style="{ color: readableOn(option) }">{{ option }}</span>
                  </template>
                </template>
              </RadioGroup>
            </div>
          </div>
          <div class="facet phone-only">
            <span aria-hidden="true" class="facet-label">stats</span>
            <ToggleSwitch v-model="controls.stats">
              <span class="visually-hidden">stats</span>
              <span class="stats-date">{{ npmFetchedAt ? `as of ${npmFetchedAt}` : "npm data unavailable" }}</span>
            </ToggleSwitch>
          </div>
          <div class="facet phone-only">
            <span aria-hidden="true" class="facet-label">{{ DEMO_LABELS[phoneDemo].toLowerCase() }}</span>
            <div class="row-options">
              <input
                v-if="phoneDemo === 'button'"
                v-model="controls.label"
                aria-label="Button label"
                class="text-input"
                placeholder="label"
                type="text"
              >
              <ToggleSwitch v-model="controls.disabled[phoneDemo]" :aria-label="`${DEMO_LABELS[phoneDemo]} disabled`">
                disabled
              </ToggleSwitch>
            </div>
          </div>
        </section>
      </Teleport>

      <!-- Phones only: which component the stacked list shows. -->
      <RadioGroup v-model="phoneDemo" class="demo-picker" :options="DEMOS" legend="Component" name="phone-demo">
        <template #option="{ option }">{{ DEMO_LABELS[option] }}</template>
      </RadioGroup>

      <!-- One table per kind; all stay mounted (v-show), so a library mounted once keeps its cells. -->
      <section v-for="(group, index) in groups" v-show="controls.kind === group.kind" :key="group.kind" class="table">
        <!-- While a column is dragged: the slot it would land in, under the columns (see useColumnDrag). -->
        <div v-if="lifted?.kind === group.kind" aria-hidden="true" class="column-slot" :style="liftedBox" />
        <!-- A table to assistive tech: each row wrapper is `display: contents`, so the grid lays out its cells. -->
        <div
          class="grid"
          role="table"
          :aria-label="KIND_LABELS[group.kind].name"
          :style="{ '--libs': group.columns.length }"
        >
          <div class="table-row" role="row">
            <!-- The stats live in the column headers, so their switch sits at the start of that row. -->
            <div aria-colindex="1" class="head sticky corner" role="columnheader">
              <ToggleSwitch v-model="controls.stats" :aria-describedby="`stats-date-${index}`">stats</ToggleSwitch>
              <span :id="`stats-date-${index}`" class="stats-date" title="npm data; downloads cover the last 7 days">
                {{ npmFetchedAt ? `(as of ${npmFetchedAt})` : "(npm data unavailable)" }}
              </span>
              <button
                v-if="controls.order[group.kind]"
                type="button"
                class="reset-order"
                @click="resetOrder($event, group.kind)"
              >
                reset order
              </button>
            </div>
            <!-- Two lines per column: name and downloads, then version, release age and links. -->
            <div
              v-for="lib in group.columns"
              :key="lib.id"
              class="head"
              role="columnheader"
              :aria-colindex="positions[group.kind][lib.id]! + 2"
              :data-column-item="lib.id"
              :style="{ '--avc-column': positions[group.kind][lib.id] }"
            >
              <div class="line">
                <span class="title">
                  <!-- Reorders the columns: drag it, or focus it and press the left / right arrow keys. -->
                  <button
                    type="button"
                    aria-describedby="reorder-help"
                    class="grip"
                    :aria-label="`Move ${lib.name}`"
                    @pointercancel="onPointerCancel"
                    @pointerdown="onPointerDown($event, group.kind, lib.id)"
                    @pointermove="onPointerMove"
                    @pointerup="onPointerUp"
                    @keydown.left.prevent="moveTo(group.kind, lib.id, positions[group.kind][lib.id]! - 1)"
                    @keydown.right.prevent="moveTo(group.kind, lib.id, positions[group.kind][lib.id]! + 1)"
                  >
                    <IconGripVertical aria-hidden="true" />
                  </button>
                  <LibraryLogo class="head-logo" :lib />
                  <span class="name">{{ lib.name }}</span>
                </span>
                <span
                  v-if="controls.stats"
                  class="muted"
                  :title="`npm downloads, last 7 days as of ${npmFetchedAt ?? '—'}`"
                >
                  {{ lib.downloads ?? "—" }} / week
                </span>
              </div>

              <div class="line meta">
                <span class="version">
                  <!-- The reason is spelled out for screen readers; sighted users get it as a tooltip. -->
                  <span v-if="errors[lib.id]" class="error" :title="errors[lib.id]">
                    failed to load<span class="visually-hidden">: {{ errors[lib.id] }}</span>
                  </span>
                  <template v-else>{{ lib.version ?? "—" }}</template>
                  <span
                    v-if="controls.stats && lib.release"
                    :class="{ stale: lib.release.stale }"
                    :title="`latest release ${lib.release.date}${lib.release.stale ? ', over a year ago' : ''}`"
                  > · {{ lib.release.ago }}</span>
                </span>
                <LibraryLinks v-if="controls.stats" :lib />
              </div>
            </div>
          </div>

          <div
            v-for="(demo, row) in DEMOS"
            :key="demo"
            class="table-row"
            :class="{ current: demo === phoneDemo }"
            role="row"
          >
            <!-- Row header: the component's name, then the options that only affect this row. -->
            <div aria-colindex="1" class="label sticky demo" role="rowheader" :style="{ '--avc-row': row + 2 }">
              <span class="row-name">{{ DEMO_LABELS[demo] }}</span>
              <div class="row-options">
                <input
                  v-if="demo === 'button'"
                  v-model="controls.label"
                  aria-label="Button label"
                  class="text-input"
                  placeholder="label"
                  type="text"
                >
                <ToggleSwitch v-model="controls.disabled[demo]" :aria-label="`${DEMO_LABELS[demo]} disabled`">
                  disabled
                </ToggleSwitch>
              </div>
            </div>
            <template v-for="lib in group.columns" :key="lib.id">
              <div
                v-if="lib.withoutDemos"
                class="cell empty"
                role="cell"
                :aria-colindex="positions[group.kind][lib.id]! + 2"
                :data-column-item="lib.id"
                :style="{
                  'minBlockSize': `${ROW_HEIGHTS[demo]}px`,
                  '--avc-row': row + 2,
                  '--avc-column': positions[group.kind][lib.id],
                }"
              >
                {{ demo === DEMOS[0] ? `— ${lib.withoutDemos}` : "—" }}
              </div>
              <div
                v-else
                :ref="(el) => setCell(lib, demo, el)"
                class="cell"
                role="cell"
                :aria-busy="isLoading(lib) || undefined"
                :aria-colindex="positions[group.kind][lib.id]! + 2"
                :data-column-item="lib.id"
                :style="{
                  'minBlockSize': `${ROW_HEIGHTS[demo]}px`,
                  '--avc-row': row + 2,
                  '--avc-column': positions[group.kind][lib.id],
                }"
                v-bind="scopeAttrs(lib)"
              >
                <!-- Which of the library's components this is, by its own name (it often isn't the row's). -->
                <template v-if="lib.components?.[demo]">
                  <a
                    v-if="lib.components[demo].docs"
                    class="component-ref"
                    :href="lib.components[demo].docs"
                    rel="noopener noreferrer"
                    target="_blank"
                    :title="`${lib.name} ${lib.components[demo].name} docs (opens in a new tab)`"
                  >
                    {{ lib.components[demo].name }}
                    <IconArrowUpRight aria-hidden="true" class="component-ref-icon" />
                  </a>
                  <span v-else class="component-ref">{{ lib.components[demo].name }}</span>
                </template>
                <!-- The library's demo for this row is teleported in after this. -->
              </div>
            </template>
          </div>
        </div>
        <!-- And the shadow it's lifted under, over the columns; it follows the pointer with the column. -->
        <div v-if="lifted?.kind === group.kind" aria-hidden="true" class="column-lift" :style="liftedBox" />
      </section>
    </main>

    <!-- Phones only: the settings section, teleported in. closedby="any": a click outside closes it too. -->
    <dialog id="options-dialog" ref="optionsDialog" aria-label="Options" class="options-dialog" closedby="any">
      <div class="options-dialog-head">
        <span class="options-dialog-title">options</span>
        <button type="button" class="options-toggle" @click="optionsDialog?.close()">
          <IconX aria-hidden="true" />
          close
        </button>
      </div>
      <div id="options-dialog-body" class="options-dialog-body" />
    </dialog>

    <p id="reorder-help" class="visually-hidden">Drag, or press the left and right arrow keys, to move the column.</p>
    <p aria-live="polite" class="visually-hidden">{{ announcement }}</p>

    <div class="overlays">
      <div
        v-for="lib in mountedLibraries"
        :id="`overlay-${lib.id}`"
        :key="lib.id"
        :ref="(el) => setOverlay(lib, el)"
        class="overlay"
        v-bind="scopeAttrs(lib)"
      />
    </div>
  </div>
</template>

<style scoped>
/* Tokens (--avc-*) are defined in ../tokens.css. */

.shell {
  /* App layout: exactly one screen tall, and the table (not the page) scrolls, in both directions,
     so its sticky header row and label column stay in view. */
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
  background: var(--avc-color-bg);
  color: var(--avc-color-text);
  font-family: var(--avc-font-mono);
  font-size: var(--avc-text-md);
  line-height: var(--avc-leading-normal);
  -webkit-font-smoothing: antialiased;
}

.muted {
  color: var(--avc-color-text-muted);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ---- page ---- */

.page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
  /* Only when the window is too short for the controls plus a usable table. */
  overflow-y: auto;
  padding: var(--avc-space-4) var(--avc-space-6) var(--avc-space-6);
}

/* ---- kind tabs ---- */

.tabs {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--avc-space-6);
  border-block-end: 1px solid var(--avc-color-border);
}

.tab {
  display: inline-flex;
  align-items: baseline;
  gap: var(--avc-space-2);
  margin-block-end: -1px;
  padding-block: var(--avc-space-2);
  border-block-end: 2px solid transparent;
  color: var(--avc-color-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--avc-color-text);
  }

  &:has(:checked) {
    color: var(--avc-color-text);
    font-weight: var(--avc-weight-bold);
  }

  &:has(:focus-visible) {
    outline: var(--avc-focus-ring);
    outline-offset: 2px;
  }

  & input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  & .muted {
    min-inline-size: 1.5em;
    padding: 0 var(--avc-space-1);
    border-radius: var(--avc-radius-full);
    background: var(--avc-color-subtle);
    font-size: var(--avc-text-sm);
    font-weight: var(--avc-weight-regular);
    text-align: center;
  }
}

/* Covers the checked tab's transparent bottom border, which keeps the tab's height. */
.tab-indicator {
  position: absolute;
  inset: 0 auto auto 0;
  height: 2px;
  margin-block-start: -2px;
  background: var(--avc-color-text);
  pointer-events: none;

  @media (prefers-reduced-motion: no-preference) {
    transition:
      translate 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.kind-description {
  display: grid;
  margin-block-start: var(--avc-space-3);
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);

  & p {
    grid-area: 1 / 1;
    margin: 0;
  }

  & .hidden {
    visibility: hidden;
  }
}

/* ---- demo options ---- */

.facets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--avc-space-3) var(--avc-space-6);
  margin-block: var(--avc-space-4);
  font-size: var(--avc-text-sm);
}

.facet {
  display: flex;
  align-items: center;
  gap: var(--avc-space-3);
  min-inline-size: 0;
}

.facet-label {
  color: var(--avc-color-text-muted);
}

/* Options stay on one row and scroll sideways when the window is narrower. The padding (offset by
   the negative margin) keeps the selected ring and the focus outline from being clipped. */
.options {
  --ring-room: 6px;

  min-inline-size: 0;
  margin: calc(-1 * var(--ring-room));
  padding: var(--ring-room);
  overflow-x: auto;
}

.swatch {
  position: absolute;
  inset: 0;
}

.swatch-code {
  position: relative;
}

/* ---- table ---- */

.table {
  /* Containing block for absolutely positioned content (visually hidden text, library popups),
     so it scrolls with the table instead of widening the page. */
  position: relative;
  /* Takes the height left under the controls and scrolls both ways; the header row and label
     column stick to it. Never shorter than a few rows. */
  flex: 0 1 auto;
  min-block-size: 15rem;
  overflow: auto;
  border: 1px solid var(--avc-color-border);
  border-radius: var(--avc-radius-md);
}

/* No grid gap: rows are divided by lines, columns only by faint ones, so each column reads as one
   card (header) standing on one canvas strip per component. */
.grid {
  --label-column: 12rem;

  display: grid;
  grid-template-columns: var(--label-column) repeat(var(--libs), minmax(15rem, 1fr));
  min-inline-size: max-content;
  /* Tab and reading order follow the grid, not the DOM (columns are placed by their order). */
  reading-flow: grid-rows;
}

/* Every cell placed explicitly: a column by its position in the tab's order (--avc-column, see
   Shell's script), a row by its index (--avc-row; headers are row 1). Auto-placement would start a
   new row whenever a column came before the previous one. */
.head,
.cell,
.table-row > .label {
  grid-row: var(--avc-row);
}

.head:not(.corner),
.cell {
  grid-column: calc(var(--avc-column) + 2);
}

.corner,
.table-row > .label {
  grid-column: 1;
}

.sticky {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  border-inline-end: 1px solid var(--avc-color-border);

  @supports (animation-timeline: scroll()) {
    &::after {
      content: "";
      position: absolute;
      inset-block: 0;
      inset-inline-start: calc(100% + 1px);
      inline-size: var(--avc-space-3);
      background: linear-gradient(to right, var(--avc-color-shadow), transparent);
      opacity: 0;
      pointer-events: none;
      animation: avc-edge-shadow linear both;
      animation-timeline: scroll(nearest inline);
      animation-range: 0rem var(--avc-space-6);
    }
  }
}

@keyframes avc-edge-shadow {
  to {
    opacity: 1;
  }
}

.head {
  position: sticky;
  inset-block-start: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--avc-space-1);
  padding: var(--avc-space-3) var(--avc-space-4);
  border-block-end: 1px solid var(--avc-color-border);
  background: var(--avc-color-surface);
  font-variant-numeric: tabular-nums;
  scroll-margin-inline-start: var(--label-column);

  & + .head {
    border-inline-start: 1px solid var(--avc-color-border-soft);
  }

  /* Top-left corner: sticks both ways, above everything else (a dragged header included). */
  &.corner {
    z-index: 5;
    background: var(--avc-color-subtle);
  }
}

.reset-order {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--avc-color-text-muted);
  font: inherit;
  font-size: var(--avc-text-sm);
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: var(--avc-color-text);
  }

  &:focus-visible {
    outline: var(--avc-focus-ring);
    outline-offset: 2px;
  }
}

/* The name and, before it, the grip that reorders the column. */
.title {
  display: inline-flex;
  align-items: center;
  gap: var(--avc-space-0-5);
  margin-inline-start: calc(-1 * var(--avc-space-1));
}

.head-logo {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  margin-inline-end: var(--avc-space-1);
  padding: 0.1875rem;
}

.grip {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--avc-target-min);
  block-size: var(--avc-target-min);
  padding: 0;
  border: 0;
  border-radius: var(--avc-radius-sm);
  background: none;
  color: var(--avc-color-text-muted);
  cursor: grab;
  /* A drag on a touch screen moves the column, not the page; and it selects no text on the way.
     (Set here, not by a :has() on the page: that would restyle every library's DOM as a drag starts.) */
  touch-action: none;
  user-select: none;
  transition:
    background-color 0.15s,
    color 0.15s;

  &:hover {
    background: var(--avc-color-subtle);
    color: var(--avc-color-text);
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: var(--avc-focus-ring);
    outline-offset: 0;
  }

  & svg {
    inline-size: 1rem;
    block-size: 1rem;
  }
}

/* Around a dragged column, both sized to it: the slot it would land in, and the shadow it's lifted under. */
.column-slot,
.column-lift {
  position: absolute;
  inset-block-start: 0;
  pointer-events: none;
}

/* A well where the columns have made way: under them (it comes before the grid), sunk into the table. */
.column-slot {
  background: var(--avc-color-subtle);
  box-shadow:
    inset 0 0 0 1px var(--avc-color-border),
    inset 0 2px 10px var(--avc-color-shadow);

  @media (prefers-reduced-motion: no-preference) {
    transition: translate 0.2s cubic-bezier(0.2, 0, 0, 1);
  }
}

/* An empty box over the column, which follows the pointer with it (by `translate` and `rotate`):
   only the ring and shadow of its pseudo-element show. */
.column-lift {
  z-index: 4;
  will-change: translate, rotate;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow:
      0 0 0 1px var(--avc-color-border-control),
      0 2px 6px var(--avc-color-shadow),
      0 12px 28px var(--avc-color-shadow),
      0 24px 56px var(--avc-color-shadow);

    @media (prefers-reduced-motion: no-preference) {
      animation: avc-lift 0.2s cubic-bezier(0.18, 0.67, 0.6, 1.22);
    }
  }
}

/* Picked up: the shadow spreads out from under the column, a touch past its size and back.
   (Opacity and scale: the shadow is painted once, not once a frame.) */
@keyframes avc-lift {
  from {
    opacity: 0;
    scale: 0.97;
  }
}

/* Under the stats switch: when its numbers were fetched. */
.stats-date {
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);
  white-space: nowrap;
}

/* A header line: left part, then right-aligned extras; wraps rather than overflow a long name. */
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0 var(--avc-space-2);
  font-size: var(--avc-text-sm);
  line-height: var(--avc-leading-tight);
}

/* Headings: a library (column) and a component (row) name share one style, one step apart. */
.name,
.row-name {
  color: var(--avc-color-text);
  font-family: var(--avc-font-sans);
  font-weight: var(--avc-weight-semibold);
  line-height: var(--avc-leading-tight);
  letter-spacing: -0.01em;
}

.name {
  font-size: var(--avc-text-lg);
}

.row-name {
  font-size: var(--avc-text-md);
}

.meta {
  align-items: center;
  color: var(--avc-color-text-muted);
}

.error {
  color: var(--avc-color-danger);
}

.stale {
  color: var(--avc-color-warning);
}

/* Rows exist for assistive tech only: their cells are the grid's items. */
.table-row {
  display: contents;
}

.table-row > .label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Name and options are two groups: more room between them than within the options. */
  gap: var(--avc-space-3);
  padding: var(--avc-space-3) var(--avc-space-4);
  border-block-end: 1px solid var(--avc-color-border);
  background: var(--avc-color-subtle);
}

/* Secondary: under the name, packed together. */
.row-options {
  display: flex;
  flex-direction: column;
  gap: var(--avc-space-1);
}

.text-input {
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: var(--avc-target-min);
  padding: var(--avc-space-0-5) var(--avc-space-2);
  border: 1px solid var(--avc-color-border-control);
  border-radius: var(--avc-radius-sm);
  outline: 0;
  background: var(--avc-color-surface);
  color: var(--avc-color-text);
  font: inherit;
  font-size: var(--avc-text-sm);

  &:focus-visible {
    border-color: var(--avc-color-text);
    box-shadow: 0 0 0 1px var(--avc-color-text);
  }
}

.cell {
  /* The component-name chip (.component-ref): offset, height, and the gap under it. */
  --ref-offset: var(--avc-space-2);
  --ref-block: calc(var(--avc-text-sm) * var(--avc-leading-tight) + var(--avc-space-0-5) * 2 + 2px);

  position: relative;
  display: flex;
  align-items: center;
  /* A strip for the chip, so it never sits on the demo. */
  padding-block-start: calc(var(--ref-offset) * 2 + var(--ref-block));
  /* keep library z-indexes from escaping the cell (e.g. over the sticky row labels) */
  isolation: isolate;
  border-block-end: 1px solid var(--avc-color-border);
  background-color: var(--avc-color-canvas);
  background-image: radial-gradient(circle, var(--avc-color-canvas-dot) 1px, transparent 1.5px);
  background-size: var(--avc-space-4) var(--avc-space-4);
  background-position: var(--avc-space-2) var(--avc-space-2);
  /* Library demos use a neutral sans; the shell's monospace must not leak into them. */
  font-family: var(--avc-font-sans);
  color-scheme: normal;

  & + .cell {
    border-inline-start: 1px solid var(--avc-color-border-soft);
  }

  /* A library listed without demos (e.g. PrimeVue): no canvas, just a note. */
  &.empty {
    justify-content: center;
    padding: 0 var(--avc-space-4);
    background: var(--avc-color-surface);
    color: var(--avc-color-text-muted);
    font: var(--avc-text-sm) / var(--avc-leading-normal) var(--avc-font-mono);
  }
}

.cell[aria-busy="true"]::after {
  content: "loading…";
  margin: auto;
  color: var(--avc-color-text-muted);
  font: var(--avc-weight-regular) var(--avc-text-sm) / var(--avc-leading-tight) var(--avc-font-mono);
  letter-spacing: 0;
  animation: avc-loading-appear 0.3s step-end;
}

@keyframes avc-loading-appear {
  from {
    visibility: hidden;
  }
}

/*
 * The component's name, tucked into the cell's top-left corner, linking to its docs.
 * It sits inside the library's CSS scope, so every property a library might set on `a` / `span`
 * (color, font, decoration, …) is pinned here.
 */
.component-ref {
  position: absolute;
  inset-block-start: var(--ref-offset);
  inset-inline-start: var(--avc-space-2);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--avc-space-1);
  box-sizing: border-box;
  block-size: var(--ref-block);
  margin: 0;
  padding: var(--avc-space-0-5) var(--avc-space-2);
  /* A solid chip, so the canvas dots never run through the text. */
  border: 1px solid var(--avc-color-border);
  border-radius: var(--avc-radius-sm);
  background: var(--avc-color-surface);
  color: var(--avc-color-text-muted);
  font: var(--avc-weight-regular) var(--avc-text-sm) / var(--avc-leading-tight) var(--avc-font-mono);
  letter-spacing: 0;
  text-decoration: none;
  white-space: nowrap;
}

/* A link to the docs looks like one at a glance: body color, underline, arrow. */
a.component-ref {
  border-color: var(--avc-color-border-control);
  color: var(--avc-color-text);
  text-decoration: underline;
  text-decoration-color: color-mix(in oklch, currentColor 40%, transparent);
  text-underline-offset: 2px;

  &:hover {
    border-color: var(--avc-color-text);
    text-decoration-color: currentColor;
  }

  &:focus-visible {
    outline: var(--avc-focus-ring);
    outline-offset: 2px;
  }
}

.component-ref-icon {
  flex: none;
  inline-size: 1em;
  block-size: 1em;
  color: var(--avc-color-text-muted);
}

.overlay {
  font-family: var(--avc-font-sans);
  color-scheme: normal;
}

/* Overlay hosts take no space in the layout: libraries may size their scope like a page body
   (Quasar's `min-height: 100%`), and their dialogs are fixed-position anyway. */
.overlays {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 0;
  block-size: 0;
}

/* ---- phone layout ----
   Too narrow for the table: the tabs, a component picker, then each library's name with its demo
   of that component. Every setting folds behind the top bar's options button. Only CSS moves the
   table: the cells stay where the libraries mounted into them, other rows are hidden, not removed. */

/* (`fieldset.`: over RadioGroup's own `display`.) */
fieldset.demo-picker,
.options-toggle,
.facet.phone-only {
  display: none;
}

@media (width < 40rem) {
  .options-toggle {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--avc-space-1);
    min-block-size: var(--avc-target-min);
    padding: 0 var(--avc-space-2);
    border: 1px solid var(--avc-color-border-control);
    border-radius: var(--avc-radius-sm);
    background: var(--avc-color-surface);
    color: var(--avc-color-text);
    font: inherit;
    font-size: var(--avc-text-sm);
    cursor: pointer;

    &:focus-visible {
      outline: var(--avc-focus-ring);
      outline-offset: 2px;
    }

    & svg {
      inline-size: 1rem;
      block-size: 1rem;
    }
  }

  .page {
    padding-inline: var(--avc-space-4);
  }

  .kind-description {
    display: none;
  }

  /* The settings, in the options dialog: a sheet over the top of the page. Its head lines up with
     the top bar, the close button where the options button was. */
  .options-dialog {
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: none;
    margin: 0;
    inset: 0 0 auto;
    padding: 0;
    border: 0;
    border-block-end: 1px solid var(--avc-color-border);
    background: var(--avc-color-subtle);
    color: var(--avc-color-text);

    &::backdrop {
      background: rgb(0 0 0 / 0.4);
    }

    /* Slides down decelerating (ease-out) and back up accelerating (ease-in), a little faster. */
    @media (prefers-reduced-motion: no-preference) {
      &,
      &::backdrop {
        transition-behavior: allow-discrete;
        transition-property: display, overlay, translate, opacity;
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
      }

      &:not([open]) {
        translate: 0 -100%;
      }

      &:not([open])::backdrop {
        opacity: 0;
      }

      &[open],
      &[open]::backdrop {
        transition-duration: 0.25s;
        transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }

      @starting-style {
        &[open] {
          translate: 0 -100%;
        }

        &[open]::backdrop {
          opacity: 0;
        }
      }
    }
  }

  .options-dialog-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    block-size: var(--avc-topbar-size);
    padding-inline: var(--avc-space-4);
    border-block-end: 1px solid var(--avc-color-border);
    background: var(--avc-color-bg);
  }

  .options-dialog-title {
    font-weight: var(--avc-weight-bold);
  }

  .options-dialog-body {
    padding: var(--avc-space-4);
  }

  .facet.phone-only {
    display: grid;
  }

  .facets .row-options {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--avc-space-3);
    min-inline-size: 0;

    & .text-input {
      flex: 1;
      min-inline-size: 0;
    }
  }

  /* One line, scrolled sideways rather than wrapped. A scroll container may shrink below its
     content in the page's flex column, hence flex-shrink here and on the picker. */
  .tabs {
    flex-shrink: 0;
    flex-wrap: nowrap;
    gap: 0 var(--avc-space-4);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tab {
    flex-shrink: 0;
    margin-block-end: 0;
    white-space: nowrap;
  }

  fieldset.demo-picker {
    display: flex;
    flex-shrink: 0;
    margin: var(--avc-space-3) 0;

    & :deep(label) {
      min-inline-size: 0;
      min-block-size: 2rem;
      padding: 0;
    }
  }

  .facets {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--avc-space-3) var(--avc-space-4);
    margin: 0;
  }

  .facet {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
  }

  /* One column: per library its header (row 2i + 1) and its cell of the picked row (row 2i + 2).
     The stats switch and the row options are in the settings instead. */
  .grid {
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
  }

  .table-row:not(:first-child, .current),
  .head.corner,
  .table-row > .label {
    display: none;
  }

  /* The name, then its docs and GitHub links on the right; the version line only when it
     reports that the library failed to load. */
  .head {
    position: static;
    display: grid;
    grid-row: calc(var(--avc-column) * 2 + 1);
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    padding-block: var(--avc-space-2);
    border-inline-start: 0;

    & .line:first-child > .muted,
    & .grip,
    & .version:not(:has(.error)),
    & :deep(.npm) {
      display: none;
    }

    & .line.meta {
      display: contents;
    }

    & .links {
      grid-area: 1 / 2;
    }

    & .version {
      grid-column: 1 / -1;
    }
  }

  .cell {
    grid-row: calc(var(--avc-column) * 2 + 2);
    border-inline-start: 0;
  }

  .head:not(.corner),
  .cell {
    grid-column: 1;
  }
}
</style>
