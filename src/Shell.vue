<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import IconExternalLink from '~icons/lucide/external-link'
import { DEMO_LABELS, downloads, github, groups, KIND_LABELS, npmFetchedAt, release, status } from './board'
import { libraries } from './libs'
import { DEMOS, type DemoKey, type Library } from './libs/types'
import RadioGroup from './RadioGroup.vue'
import { type Color, COLORS, controls, SIZES } from './store'

const SIZE_LABELS = { small: 'sm', medium: 'md', large: 'lg' } as const

/** "default" (each library's own color) followed by the shared palette. */
const COLOR_OPTIONS = [
  'default',
  COLORS.black,
  COLORS.blue,
  COLORS.violet,
  COLORS.green,
  COLORS.orange,
  COLORS.rose,
] as const

const COLOR_NAMES = Object.fromEntries(Object.entries(COLORS).map(([name, value]) => [value, name])) as Record<Color, string>

/** The store keeps `null` for "default"; the radio group needs a string value for it. */
const colorChoice = computed<(typeof COLOR_OPTIONS)[number]>({
  get: () => controls.color ?? 'default',
  set: (value) => {
    controls.color = value === 'default' ? null : value
  },
})

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
}

const cells: Record<string, Partial<Record<DemoKey, HTMLElement>>> = {}
const overlays: Record<string, HTMLElement> = {}
const unmounts: (() => void)[] = []

function scopeAttrs(lib: Library) {
  return { 'data-lib': lib.id, ...(controls.dark ? lib.darkAttrs : {}) }
}

function setCell(libId: string, demo: DemoKey, el: unknown) {
  if (el instanceof HTMLElement) (cells[libId] ??= {})[demo] = el
}

function setOverlay(libId: string, el: unknown) {
  if (el instanceof HTMLElement) overlays[libId] = el
}

onMounted(() => {
  if (!groups.some((group) => group.kind === controls.kind)) controls.kind = groups[0]!.kind

  for (const lib of libraries) {
    if (!lib.load) {
      // Stats only: the version shown is npm's latest.
      const latest = release(lib)?.latest
      if (latest) status.versions[lib.id] = latest
      continue
    }
    lib.load()
      .then((mod) => {
        status.versions[lib.id] = mod.version
        unmounts.push(mod.mount({
          cells: cells[lib.id] as Record<DemoKey, HTMLElement>,
          overlay: overlays[lib.id]!,
        }))
      })
      .catch((error: unknown) => {
        status.errors[lib.id] = String(error)
        console.error(`[${lib.id}]`, error)
      })
  }
})

onBeforeUnmount(() => unmounts.forEach((unmount) => unmount()))
</script>

<template>
  <div class="shell" :class="{ 'is-dark': controls.dark }">
    <header class="topbar">
      <span class="brand">awesome-vue-ui-collections</span>
      <!-- Page settings, not part of what is compared, so they live up here. -->
      <div class="settings">
        <label class="switch">
          <input v-model="controls.stats" type="checkbox" role="switch">
          stats
        </label>
        <label class="switch">
          <input v-model="controls.dark" type="checkbox" role="switch">
          dark
        </label>
      </div>
    </header>

    <main class="page">
      <!-- Which libraries to show: a tab row of its own, separate from the demo options below. -->
      <nav class="tabs" aria-label="Kind">
        <label v-for="group in groups" :key="group.kind" class="tab">
          <input v-model="controls.kind" type="radio" name="kind" :value="group.kind">
          {{ KIND_LABELS[group.kind].name.toLowerCase() }}
          <span class="muted">{{ group.libraries.length }}</span>
        </label>
      </nav>
      <p class="kind-description">{{ KIND_LABELS[controls.kind].description }}</p>

      <!-- Options for the demos, right above the table they affect. -->
      <!-- Label column + options column; each row is a subgrid, so every row starts at the same x. -->
      <section class="facets" aria-label="Demo options">
        <div class="facet">
          <span class="label" aria-hidden="true">size</span>
          <div class="options">
            <RadioGroup v-model="controls.size" :options="SIZES" name="size" legend="Size">
              <template #option="{ option }">{{ SIZE_LABELS[option] }}</template>
            </RadioGroup>
          </div>
        </div>
        <!-- Headless libraries already share one neutral look (libs/headless-theme.css). -->
        <div v-if="controls.kind === 'styled'" class="facet">
          <span class="label" aria-hidden="true">color</span>
          <div class="options">
            <RadioGroup v-model="colorChoice" :options="COLOR_OPTIONS" name="color" legend="Primary color">
              <template #option="{ option }">
                <template v-if="option === 'default'">default</template>
                <!-- A zero-width space keeps the text line, so the chip is exactly as tall as "default". -->
                <template v-else>
                  <span class="swatch" :style="{ background: option }" :title="COLOR_NAMES[option]" />
                  <span class="visually-hidden">{{ COLOR_NAMES[option] }}</span>&ZeroWidthSpace;
                </template>
              </template>
            </RadioGroup>
          </div>
        </div>
      </section>

      <!-- One table per kind; both stay mounted (v-show) so every library keeps its teleport targets. -->
      <section
        v-for="group in groups"
        v-show="controls.kind === group.kind"
        :key="group.kind"
        class="table"
        :aria-label="KIND_LABELS[group.kind].name"
      >
        <div class="grid" :style="{ '--libs': group.libraries.length }">
          <div class="head sticky" />
          <div v-for="lib in group.libraries" :key="lib.id" class="head">
            <span class="name">{{ lib.name }}</span>
            <span v-if="status.errors[lib.id]" class="error" :title="status.errors[lib.id]">failed to load</span>
            <span v-else class="muted">{{ status.versions[lib.id] ? `@${status.versions[lib.id]}` : '…' }}</span>
          </div>

          <template v-if="controls.stats">
            <div class="label sticky">package</div>
            <div v-for="lib in group.libraries" :key="lib.id" class="value">
              <a class="external" :href="`https://npmx.dev/package/${lib.package}`" target="_blank" rel="noopener">
                {{ lib.package }}
                <IconExternalLink class="external-icon" aria-hidden="true" />
                <span class="visually-hidden">(opens in a new tab)</span>
              </a>
            </div>
  
            <div class="label sticky">repository</div>
            <div v-for="lib in group.libraries" :key="lib.id" class="value">
              <a v-if="github(lib)" class="external" :href="github(lib)!.url" target="_blank" rel="noopener">
                {{ github(lib)!.slug }}
                <IconExternalLink class="external-icon" aria-hidden="true" />
                <span class="visually-hidden">(opens in a new tab)</span>
              </a>
              <span v-else class="muted">—</span>
            </div>
  
            <div class="label sticky" :title="`npm, as of ${npmFetchedAt}`">last release</div>
            <div v-for="lib in group.libraries" :key="lib.id" class="value">
              <template v-if="release(lib)">
                <span :class="{ stale: release(lib)!.stale }" :title="release(lib)!.date">{{ release(lib)!.ago }}</span>
                <span v-if="release(lib)!.stale" class="stale"> · stale</span>
              </template>
              <span v-else class="muted">—</span>
            </div>
  
            <div class="label sticky" :title="`npm, last 7 days as of ${npmFetchedAt}`">downloads/week</div>
            <div v-for="lib in group.libraries" :key="lib.id" class="value">
              {{ downloads(lib)?.label ?? '—' }}
            </div>
          </template>

          <template v-for="demo in DEMOS" :key="demo">
            <div class="label sticky demo">
              {{ DEMO_LABELS[demo].toLowerCase() }}
              <!-- The label and disabled state only affect this row, so they're edited here. -->
              <input
                v-if="demo === 'button'"
                v-model="controls.label"
                class="text-input"
                type="text"
                placeholder="label"
                aria-label="Button label"
              >
              <label class="switch">
                <input
                  v-model="controls.disabled[demo]"
                  type="checkbox"
                  role="switch"
                  :aria-label="`${DEMO_LABELS[demo]} disabled`"
                >
                disabled
              </label>
            </div>
            <template v-for="lib in group.libraries" :key="lib.id">
              <div v-if="lib.withoutDemos" class="value muted" :style="{ minBlockSize: `${ROW_HEIGHTS[demo]}px` }">
                {{ demo === DEMOS[0] ? `— ${lib.withoutDemos}` : '—' }}
              </div>
              <div
                v-else
                :ref="(el) => setCell(lib.id, demo, el)"
                class="cell"
                :style="{ minBlockSize: `${ROW_HEIGHTS[demo]}px` }"
                v-bind="scopeAttrs(lib)"
              />
            </template>
          </template>
        </div>
      </section>

      <footer class="footer">
        npm data as of {{ npmFetchedAt }} · downloads over the last 7 days
      </footer>
    </main>

    <div class="overlays">
      <div
        v-for="lib in libraries.filter((lib) => lib.load)"
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
.shell {
  --bg: oklch(98.5% 0 0);
  --surface: oklch(100% 0 0);
  --subtle: oklch(96.5% 0 0);
  --text: oklch(20% 0 0);
  --muted: oklch(52% 0 0);
  --border: oklch(90% 0 0);
  --warning: oklch(62% 0.14 65);
  --danger: oklch(56% 0.2 25);
  --font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --topbar-size: 40px;

  /* App layout: exactly one screen tall, and the table (not the page) scrolls, in both directions,
     so its sticky header row and label column stay in view. */
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  -webkit-font-smoothing: antialiased;

  &.is-dark {
    --bg: oklch(14% 0 0);
    --surface: oklch(17% 0 0);
    --subtle: oklch(21% 0 0);
    --text: oklch(93% 0 0);
    --muted: oklch(64% 0 0);
    --border: oklch(27% 0 0);
  }
}

.muted {
  color: var(--muted);
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
  block-size: var(--topbar-size);
  padding: 0 24px;
  border-block-end: 1px solid var(--border);
  background: var(--bg);
}

.brand {
  font-weight: 700;
}

.settings {
  display: flex;
  gap: 16px;
}

/* ---- page ---- */

.page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
  /* Only when the window is too short for the controls plus a usable table. */
  overflow-y: auto;
  padding: 16px 24px 24px;
}

/* ---- kind tabs ---- */

.tabs {
  display: flex;
  gap: 24px;
  border-block-end: 1px solid var(--border);
}

.tab {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  margin-block-end: -1px;
  padding-block: 8px;
  border-block-end: 2px solid transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: var(--text);
  }

  &:has(:checked) {
    border-color: var(--text);
    color: var(--text);
    font-weight: 700;
  }

  &:has(:focus-visible) {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }

  & input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}

.kind-description {
  margin: 12px 0 0;
  color: var(--muted);
}

/* ---- demo options ---- */

/* Label column + options column; each .facet row inherits both tracks via subgrid. */
.facets {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 10px 16px;
  align-items: center;
  margin-block: 20px 12px;
}

.facet {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
}

.options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* A color option: fills its RadioGroup chip edge to edge (the chip clips it to its shape). */
.swatch {
  position: absolute;
  inset: 0;
}

/* A native checkbox drawn as a monochrome switch. */
.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  cursor: pointer;
  user-select: none;

  &:has(:checked) {
    color: var(--text);
  }

  & input {
    appearance: none;
    position: relative;
    flex: none;
    inline-size: 28px;
    block-size: 16px;
    margin: 0;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--subtle);
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;

    &::after {
      content: '';
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 10px;
      block-size: 10px;
      border-radius: 50%;
      background: var(--muted);
      transition: translate 0.15s, background-color 0.15s;
    }

    &:checked {
      border-color: var(--text);
      background: var(--text);

      &::after {
        translate: 12px 0;
        background: var(--bg);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--text);
      outline-offset: 2px;
    }
  }
}

.label {
  color: var(--muted);
  font-size: 12px;
}

/* ---- table ---- */

.table {
  /* Containing block for absolutely positioned content (visually hidden text, library popups),
     so it scrolls with the table instead of widening the page. */
  position: relative;
  /* Takes the height left under the controls and scrolls both ways; the header row and label
     column stick to it. Never shorter than a few rows. */
  flex: 0 1 auto;
  min-block-size: 240px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.grid {
  display: grid;
  grid-template-columns: 10rem repeat(var(--libs), minmax(240px, 1fr));
  gap: 1px;
  min-inline-size: max-content;
  background: var(--border);

  & > * {
    background: var(--surface);
  }
}

.sticky {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
}

.head {
  position: sticky;
  inset-block-start: 0;
  z-index: 3;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 14px;
  background: var(--subtle);
  /* The grid gap draws the line under it; this keeps it while rows scroll underneath. */
  box-shadow: 0 1px 0 var(--border);

  /* Top-left corner: sticks both ways, above everything else. */
  &.sticky {
    z-index: 4;
  }
}

.name {
  font-weight: 700;
}

.error {
  color: var(--danger);
}

.grid > .label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  /* Row headers share the column headers' background. */
  background: var(--subtle);
}

.value {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-variant-numeric: tabular-nums;

  & a {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: var(--border);
    text-underline-offset: 3px;

    &:hover {
      text-decoration-color: currentColor;
    }
  }
}

/* Links that leave the page (and open a new tab) end with an external-link icon. */
.external {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.external-icon {
  flex: none;
  inline-size: 12px;
  block-size: 12px;
  color: var(--muted);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.stale {
  color: var(--warning);
}

.text-input {
  box-sizing: border-box;
  inline-size: 100%;
  padding: 3px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font: inherit;

  &:focus-visible {
    border-color: var(--text);
  }
}

.cell {
  display: flex;
  align-items: center;
  /* keep library z-indexes from escaping the cell (e.g. over the sticky row labels) */
  isolation: isolate;
}

/* Library demos use a neutral system font, so the shell's monospace doesn't leak into them. */
.cell,
.overlay {
  font-family: system-ui, sans-serif;
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

.footer {
  margin-block-start: 16px;
  color: var(--muted);
  font-size: 12px;
}
</style>
