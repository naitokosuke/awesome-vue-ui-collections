<script setup lang="ts">
import { computed } from "vue";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconGithub from "~icons/lucide/github";
import IconPackage from "~icons/lucide/package";
import { DEMO_LABELS, groups, KIND_LABELS, npmFetchedAt } from "./board";
import { libraries } from "./libs";
import { readableOn } from "./libs/color";
import { type Color, COLORS, DEMOS, type DemoKey, type Library, SIZES } from "./libs/types";
import RadioGroup from "./RadioGroup.vue";
import { controls } from "./store";
import { useLibraryApps } from "./useLibraryApps";

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
 * Minimum height of each demo row: the tallest any library gets at any size (measured at
 * sm/md/lg in both tables), so switching size never changes row heights. Re-measure when
 * adding a library or changing a demo.
 */
const ROW_HEIGHTS: Record<DemoKey, number> = {
  button: 88,
  input: 100,
  select: 88,
  switch: 88,
  dialog: 88,
};

const { errors, setCell, setOverlay } = useLibraryApps(() => controls.kind);

/** Libraries with an app of their own (not stats-only), each of which gets an overlay host. */
const mountedLibraries = libraries.filter((lib) => lib.load);

function scopeAttrs(lib: Library) {
  return { "data-lib": lib.id, ...(controls.dark ? lib.darkAttrs : lib.lightAttrs) };
}
</script>

<template>
  <div class="shell" :class="{ 'is-dark': controls.dark }">
    <header class="topbar">
      <span class="brand">awesome-vue-ui-collections</span>
      <!-- Theme is a page setting, not part of what is compared, so it lives up here. -->
      <label class="switch">
        <input v-model="controls.dark" role="switch" type="checkbox">
        dark
      </label>
    </header>

    <main class="page">
      <!-- Which libraries to show: a tab row of its own, separate from the demo options below. -->
      <div aria-label="Library kind" class="tabs" role="radiogroup">
        <label v-for="group in groups" :key="group.kind" class="tab">
          <input v-model="controls.kind" name="kind" type="radio" :value="group.kind">
          {{ KIND_LABELS[group.kind].name.toLowerCase() }}
          <span class="muted">{{ group.columns.length }}</span>
        </label>
      </div>
      <p class="kind-description">{{ KIND_LABELS[controls.kind].description }}</p>

      <!-- Options for the demos, right above the table they affect. -->
      <!-- Label column + options column; each row is a subgrid, so every row starts at the same x. -->
      <section aria-label="Demo options" class="facets">
        <div class="facet">
          <span aria-hidden="true" class="facet-label">size</span>
          <div class="options">
            <RadioGroup v-model="controls.size" :options="SIZES" legend="Size" name="size">
              <template #option="{ option }">{{ SIZE_LABELS[option] }}</template>
            </RadioGroup>
          </div>
        </div>
        <!-- Headless libraries already share one neutral look (libs/headless-theme.css); fancy ones have no primary color to set. -->
        <div v-if="controls.kind === 'styled' || controls.kind === 'copy-paste'" class="facet">
          <span aria-hidden="true" class="facet-label">color</span>
          <div class="options">
            <RadioGroup v-model="colorChoice" :options="COLOR_OPTIONS" legend="Primary color" name="color">
              <template #option="{ option }">
                <template v-if="option === 'default'">default</template>
                <!-- The color fills the chip, labeled with its code. -->
                <template v-else>
                  <span class="swatch" :style="{ background: option }" :title="COLOR_NAMES[option]" />
                  <span class="swatch-code" :style="{ color: readableOn(option) }">{{ option }}</span>
                </template>
              </template>
            </RadioGroup>
          </div>
        </div>
      </section>

      <!-- One table per kind; all stay mounted (v-show), so a library mounted once keeps its cells. -->
      <section v-for="group in groups" v-show="controls.kind === group.kind" :key="group.kind" class="table">
        <!-- A table to assistive tech: each row wrapper is `display: contents`, so the grid lays out its cells. -->
        <div
          class="grid"
          role="table"
          :aria-label="KIND_LABELS[group.kind].name"
          :style="{ '--libs': group.columns.length }"
        >
          <div class="table-row" role="row">
            <!-- The stats live in the column headers, so their switch sits at the start of that row. -->
            <div class="head sticky corner" role="columnheader">
              <label class="switch">
                <input
                  v-model="controls.stats"
                  role="switch"
                  type="checkbox"
                  :aria-describedby="`stats-date-${group.kind}`"
                >
                stats
              </label>
              <span
                :id="`stats-date-${group.kind}`"
                class="stats-date"
                title="npm data; downloads cover the last 7 days"
              >
                {{ npmFetchedAt ? `(as of ${npmFetchedAt})` : "(npm data unavailable)" }}
              </span>
            </div>
            <!-- Two lines per column: name and downloads, then version, release age and links. -->
            <div v-for="lib in group.columns" :key="lib.id" class="head" role="columnheader">
              <div class="line">
                <span class="name">{{ lib.name }}</span>
                <span
                  v-if="controls.stats"
                  class="muted"
                  :title="`npm downloads, last 7 days as of ${npmFetchedAt ?? '—'}`"
                >
                  {{ lib.downloads ?? "—" }} / week
                </span>
              </div>

              <div class="line meta">
                <span>
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
                <!-- Links leave the page: the icons say where to, the tooltip says it opens a new tab. -->
                <span v-if="controls.stats" class="links">
                  <a
                    v-if="lib.package"
                    :href="`https://npmx.dev/package/${lib.package}`"
                    rel="noopener"
                    target="_blank"
                    :title="`${lib.package} on npmx.dev (opens in a new tab)`"
                    :aria-label="`${lib.package} on npmx.dev (opens in a new tab)`"
                  >
                    <IconPackage aria-hidden="true" />
                  </a>
                  <a
                    v-if="lib.github"
                    :href="lib.github.url"
                    rel="noopener"
                    target="_blank"
                    :title="`${lib.github.slug} on GitHub (opens in a new tab)`"
                    :aria-label="`${lib.github.slug} on GitHub (opens in a new tab)`"
                  >
                    <IconGithub aria-hidden="true" />
                  </a>
                </span>
              </div>
            </div>
          </div>

          <div v-for="demo in DEMOS" :key="demo" class="table-row" role="row">
            <!-- Row header: the component's name, then the options that only affect this row. -->
            <div class="label sticky demo" role="rowheader">
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
                <label class="switch">
                  <input
                    v-model="controls.disabled[demo]"
                    role="switch"
                    type="checkbox"
                    :aria-label="`${DEMO_LABELS[demo]} disabled`"
                  >
                  disabled
                </label>
              </div>
            </div>
            <template v-for="lib in group.columns" :key="lib.id">
              <div
                v-if="lib.withoutDemos"
                class="cell empty"
                role="cell"
                :style="{ minBlockSize: `${ROW_HEIGHTS[demo]}px` }"
              >
                {{ demo === DEMOS[0] ? `— ${lib.withoutDemos}` : "—" }}
              </div>
              <div
                v-else
                :ref="(el) => setCell(lib.id, demo, el)"
                class="cell"
                role="cell"
                :style="{ minBlockSize: `${ROW_HEIGHTS[demo]}px` }"
                v-bind="scopeAttrs(lib)"
              >
                <!-- Which of the library's components this is, by its own name (it often isn't the row's). -->
                <template v-if="lib.components?.[demo]">
                  <a
                    v-if="lib.components[demo].docs"
                    class="component-ref"
                    :href="lib.components[demo].docs"
                    rel="noopener"
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
      </section>
    </main>

    <div class="overlays">
      <div
        v-for="lib in mountedLibraries"
        :key="lib.id"
        :id="`overlay-${lib.id}`"
        :ref="(el) => setOverlay(lib.id, el)"
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

/* ---- top bar ---- */

.topbar {
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  block-size: var(--avc-topbar-size);
  padding: 0 var(--avc-space-6);
  border-block-end: 1px solid var(--avc-color-border);
  background: var(--avc-color-bg);
}

.brand {
  font-weight: var(--avc-weight-bold);
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
    border-color: var(--avc-color-text);
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
}

.kind-description {
  margin: var(--avc-space-3) 0 0;
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);
}

/* ---- demo options ---- */

/* Label column + options column; each .facet row inherits both tracks via subgrid. */
.facets {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--avc-space-3) var(--avc-space-4);
  align-items: center;
  margin-block: var(--avc-space-5) var(--avc-space-3);
  font-size: var(--avc-text-sm);
}

.facet {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
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

/* A color option: fills its RadioGroup chip edge to edge (the chip clips it to its shape). */
.swatch {
  position: absolute;
  inset: 0;
}

/* Its color (black or white, whichever has more contrast on the swatch) is set inline. */
.swatch-code {
  position: relative;
}

/* A native checkbox drawn as a monochrome switch; the whole label is the target. */
.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--avc-space-2);
  min-block-size: var(--avc-target-min);
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);
  cursor: pointer;
  user-select: none;

  &:has(:checked) {
    color: var(--avc-color-text);
  }

  & input {
    --track-inline: 2rem;
    --track-block: 1.125rem;
    --thumb: 0.75rem;
    /* Thumb inset from the track's inner edge (inside the 1px border). */
    --inset: calc((var(--track-block) - 2px - var(--thumb)) / 2);

    appearance: none;
    position: relative;
    flex: none;
    inline-size: var(--track-inline);
    block-size: var(--track-block);
    margin: 0;
    border: 1px solid var(--avc-color-border-control);
    border-radius: var(--avc-radius-full);
    background: var(--avc-color-subtle);
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;

    &::after {
      content: '';
      position: absolute;
      inset-block-start: var(--inset);
      inset-inline-start: var(--inset);
      inline-size: var(--thumb);
      block-size: var(--thumb);
      border-radius: 50%;
      background: var(--avc-color-text-muted);
      transition: translate 0.15s, background-color 0.15s;
    }

    &:checked {
      border-color: var(--avc-color-text);
      background: var(--avc-color-text);

      &::after {
        translate: calc(var(--track-inline) - 2px - var(--thumb) - var(--inset) * 2) 0;
        background: var(--avc-color-bg);
      }
    }

    &:focus-visible {
      outline: var(--avc-focus-ring);
      outline-offset: 2px;
    }
  }
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
  display: grid;
  grid-template-columns: 12rem repeat(var(--libs), minmax(15rem, 1fr));
  min-inline-size: max-content;
}

.sticky {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  border-inline-end: 1px solid var(--avc-color-border);
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

  & + .head {
    border-inline-start: 1px solid var(--avc-color-border-soft);
  }

  /* Top-left corner: sticks both ways, above everything else. */
  &.corner {
    z-index: 4;
    background: var(--avc-color-subtle);
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

.links {
  display: flex;
  gap: var(--avc-space-1);

  /* Icon-only links still get a full-size target. */
  & a {
    display: grid;
    place-items: center;
    inline-size: var(--avc-target-min);
    block-size: var(--avc-target-min);
    border-radius: var(--avc-radius-sm);
    color: var(--avc-color-text-muted);

    &:hover {
      background: var(--avc-color-subtle);
      color: var(--avc-color-text);
    }

    &:focus-visible {
      outline: var(--avc-focus-ring);
      outline-offset: 0;
    }
  }

  & svg {
    inline-size: 1rem;
    block-size: 1rem;
  }
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
</style>
