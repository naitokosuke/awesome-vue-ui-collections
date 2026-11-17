/**
 * Every library lives on one page: these tests load all of them into the shell and check that
 * none of their CSS or DOM side effects reach outside their `[data-lib]` scope (see
 * build/scope-library-css.ts and libs/mount.ts), while their own styles still apply inside it.
 *
 * The baseline is taken right after the shell mounts, before any library module has loaded
 * (they're dynamic imports), so it is the page as the shell alone styles it.
 */
import "./tokens.css";
import { afterAll, beforeAll, describe, expect, onTestFinished, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { type App, createApp, nextTick } from "vue";
import { KIND_LABELS } from "./board";
import { libraries } from "./libs";
import { COLORS, type DemoKey, DEMOS, type Kind, KINDS, type Library, SIZES } from "./libs/types";
import Shell from "./Shell.vue";
import { controls } from "./store";

// ---- snapshots -------------------------------------------------------------------

/** Resolved from the element's box, so they change whenever the table's columns do. */
const LAYOUT_PROPERTIES = new Set([
  "width",
  "height",
  "inline-size",
  "block-size",
  "transform-origin",
  "perspective-origin",
]);

type Style = Record<string, string>;

/**
 * Chromium on macOS sometimes reports the default (unstyled) font as `"Times New Roman"` instead
 * of `Times` partway through a run, with no stylesheet setting either: the same font, so one name.
 */
const normalizeFontFamily = (value: string) => (value === '"Times New Roman"' ? "Times" : value);

/** Every computed property (custom properties included), minus the layout-dependent ones. */
function computedStyle(el: Element, pseudo?: string): Style {
  const style = getComputedStyle(el, pseudo);
  const out: Style = {};
  for (let i = 0; i < style.length; i++) {
    const name = style.item(i);
    if (LAYOUT_PROPERTIES.has(name)) continue;
    const value = style.getPropertyValue(name);
    out[name] = name === "font-family" ? normalizeFontFamily(value) : value;
  }
  return out;
}

function pick(style: Style, names: readonly string[]): Style {
  return Object.fromEntries(names.map((name) => [name, style[name]!]));
}

/**
 * An empty `class` / `style` counts as none: Oruga's dialog calls `document.body.classList.add()`
 * with its scroll class transformed away (oruga/index.ts), which per the DOM spec alone writes
 * `class=""`, and a scroll lock that restores `overflow` to "" leaves `style=""`.
 */
function attributes(el: Element): Record<string, string> {
  return Object.fromEntries(
    [...el.attributes]
      .filter((attr) => !((attr.name === "class" || attr.name === "style") && attr.value === ""))
      .map((attr) => [attr.name, attr.value]),
  );
}

/** Every stylesheet on the page: <style> / <link> ones and constructed ones adopted by the document. */
function allSheets(): CSSStyleSheet[] {
  return [...document.styleSheets, ...document.adoptedStyleSheets];
}

/** Every stylesheet rule on the page, nested rules included. */
function allRules(): CSSRule[] {
  const rules: CSSRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of list) {
      rules.push(rule);
      if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of allSheets()) walk(sheet.cssRules);
  return rules;
}

/** Where a rule comes from, for failure messages: the module Vite injected it from, or its <style> id. */
function sourceOf(rule: CSSRule): string {
  let sheet = rule.parentStyleSheet;
  while (sheet?.ownerRule) sheet = sheet.ownerRule.parentStyleSheet;
  const owner = sheet?.ownerNode as HTMLElement | null;
  return owner?.dataset.viteDevId?.replace(/^.*\/node_modules\//, "") ?? (owner?.id || "runtime <style>");
}

/**
 * Custom properties the libraries register with `@property`. Registration is global by spec (it
 * can't be scoped), and a registered property shows up, at its initial value, on every element.
 * The shell's own (`--avc-`, tokens.css) are in the baseline already, so they aren't counted.
 */
function registeredProperties(): Set<string> {
  return new Set(
    allRules().flatMap((rule) =>
      rule instanceof CSSPropertyRule && !rule.name.startsWith("--avc-") ? [rule.name] : [],
    ),
  );
}

/** `snapshot` without the registered custom properties, which are checked on their own. */
function withoutRegistered<T extends Record<string, Style>>(snapshot: T): T {
  const registered = registeredProperties();
  return Object.fromEntries(
    Object.entries(snapshot).map(([key, style]) => [
      key,
      Object.fromEntries(Object.entries(style).filter(([name]) => !registered.has(name))),
    ]),
  ) as T;
}

/** Plain elements outside every library scope, as a page would have them. */
const PROBE_HTML = `
  <h1>Heading</h1><h2>Subheading</h2><p>Text <a href="#">link</a> <code>code</code> <strong>bold</strong></p>
  <ul><li>item</li></ul><ol><li>item</li></ol>
  <button type="button">Button</button>
  <input type="text" placeholder="Text"><input type="checkbox"><select><option>Option</option></select>
  <textarea></textarea><label>Label</label><hr><img alt=""><table><tr><td>Cell</td></tr></table>
  <div>Block</div><span>Inline</span>
`;

/** Each probe element and its pseudo-elements, keyed for readable diffs. */
function probeSnapshot(probe: HTMLElement): Record<string, Style> {
  const snapshot: Record<string, Style> = {};
  probe.querySelectorAll("*").forEach((el, i) => {
    const type = el.getAttribute("type");
    const key = `${i}:${el.tagName.toLowerCase()}${type ? `[${type}]` : ""}`;
    const pseudos = ["", "::before", "::after"];
    if (el.matches("input, textarea")) pseudos.push("::placeholder");
    if (el.matches("li")) pseudos.push("::marker");
    for (const pseudo of pseudos) snapshot[key + pseudo] = computedStyle(el, pseudo || undefined);
  });
  return snapshot;
}

function documentSnapshot() {
  return {
    attributes: { html: attributes(document.documentElement), body: attributes(document.body) },
    style: { html: computedStyle(document.documentElement), body: computedStyle(document.body) },
  };
}

/** The shell's own elements outside every scope, one of each kind. */
const SHELL_SELECTORS = [
  ".shell",
  ".topbar",
  ".brand",
  ".topbar .switch input",
  ".tab",
  ".kind-description",
  ".facet-label",
  ".radio-group label",
  ".head.corner",
  ".head:not(.corner)",
  ".head .name",
  ".table-row > .label",
  ".row-name",
  ".text-input",
  ".overlays",
];

/**
 * What the shell declares on `.cell`, which is the scope element itself: a library's `body` /
 * `:root` rules land on it (by design, see scope-library-css.ts) but must not win over these.
 */
const CELL_PROPERTIES = [
  "display",
  "position",
  "isolation",
  "align-items",
  "padding-top",
  "border-bottom-width",
  "border-bottom-style",
  "border-bottom-color",
  "background-color",
  "background-image",
  "font-family",
] as const;

/**
 * What `.component-ref` pins: it sits inside a library's scope, so it inherits whatever the
 * library sets there, except these.
 */
const CHIP_PROPERTIES = [
  "position",
  "top",
  "left",
  "z-index",
  "display",
  "align-items",
  "column-gap",
  "box-sizing",
  "margin-top",
  "margin-left",
  "padding-top",
  "padding-left",
  "border-top-width",
  "border-top-style",
  "border-top-color",
  "border-top-left-radius",
  "background-color",
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-decoration-line",
  "text-decoration-color",
  "text-underline-offset",
  "text-wrap-mode",
] as const;

/** The shown table's elements: shell-only ones in full, scope elements by what the shell sets on them. */
function shellSnapshot(): Record<string, Style> {
  const table = [...document.querySelectorAll(".table")].find((el) => el.checkVisibility())!;
  const snapshot: Record<string, Style> = {};
  for (const selector of SHELL_SELECTORS) {
    const el = table.querySelector(selector) ?? document.querySelector(selector);
    if (!el) throw new Error(`No element for ${selector}`);
    snapshot[selector] = computedStyle(el);
  }
  for (const cell of table.querySelectorAll<HTMLElement>(".cell[data-lib]")) {
    snapshot[`cell ${cell.dataset.lib}`] = pick(computedStyle(cell), CELL_PROPERTIES);
  }
  for (const chip of table.querySelectorAll<HTMLElement>(".component-ref")) {
    const lib = chip.closest<HTMLElement>("[data-lib]")!.dataset.lib;
    snapshot[`chip ${lib} ${chip.textContent!.trim()}`] = pick(computedStyle(chip), CHIP_PROPERTIES);
  }
  return snapshot;
}

// ---- stylesheets -------------------------------------------------------------------

/** `a, :is(b, c) d` → `["a", ":is(b, c) d"]` */
function splitSelectorList(selectorText: string): string[] {
  const selectors: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selectorText.length; i++) {
    const char = selectorText[i];
    if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;
    else if (char === "," && depth === 0) {
      selectors.push(selectorText.slice(start, i).trim());
      start = i + 1;
    }
  }
  selectors.push(selectorText.slice(start).trim());
  return selectors;
}

/** Selectors of a sheet's style rules, except nested ones (relative to an already checked parent). */
function topLevelSelectors(sheet: CSSStyleSheet): string[] {
  const selectors: string[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of list) {
      if (rule instanceof CSSStyleRule) selectors.push(...splitSelectorList(rule.selectorText));
      // Grouping at-rules (@media, @supports, @layer, @container) hold more top-level rules; style rules hold nested ones.
      else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  walk(sheet.cssRules);
  return selectors;
}

/** Vite's dev server tags each injected stylesheet with the module it came from. */
function viteStyles(): { id: string; sheet: CSSStyleSheet }[] {
  return [...document.querySelectorAll<HTMLStyleElement>("style[data-vite-dev-id]")].map((style) => ({
    id: style.dataset.viteDevId!,
    sheet: style.sheet!,
  }));
}

/** Library CSS that is deliberately global, and why. */
const GLOBAL_LIBRARY_CSS: Record<string, string> = {
  "/src/libs/varlet/measure.css": "hides the measuring span Varlet always teleports to <body> (see the file)",
};

/**
 * <body> attributes a library's dialog sets while it's open, with no option to stop it, and why
 * that's tolerated. These dialogs are closed again in the test, and must undo it.
 */
const OPEN_DIALOG_BODY_ATTRIBUTES: Record<string, { attributes: Record<string, string>; reason: string }> = {
  "akaza-ui": {
    attributes: { style: "overflow: hidden;" },
    reason: "Dialog is always modal and locks scroll with no option to opt out; the shell's page never scrolls itself",
  },
  "astryx-vue": {
    attributes: { style: "overflow: hidden;" },
    reason:
      "Dialog locks scroll in showModal() unconditionally; the shell's page never scrolls itself (its table does)",
  },
};

/**
 * Class prefixes of libraries that inject their component styles at runtime, unscoped, and why
 * that's tolerated: every rule starts at one of the library's own prefixed classes.
 */
const RUNTIME_CLASS_PREFIXES: Record<string, string> = {
  "n-": "Naive UI's components inject their styles with css-render as they mount, with no way to scope them",
  "v-binder-": "vueuc (Naive UI's popup positioning) injects its follower styles the same way",
};

/**
 * Ids of `<style>` elements a library injects into <head> at runtime, unscoped, and why that's
 * tolerated.
 */
const RUNTIME_STYLE_IDS: Record<string, string> = {
  "ui-sdk-popover-reset":
    "UI SDK resets the UA [popover] styles of its own parts (`[data-slot=dialog-content][popover]`, …), " +
    "in `@layer ui-sdk` under :where()",
  "ui-sdk-hidden":
    "UI SDK keeps `hidden` parts hidden over `display` rules: `[data-slot][hidden]` is display:none anyway, " +
    "in `@layer ui-sdk` under :where()",
};

/** `.n-button .x` starts with prefix `n-`. */
function startsWithClassPrefix(selector: string, prefix: string) {
  return selector.startsWith(`.${prefix}`);
}

/** Libraries whose dialog row has no "Open dialog" trigger, and why. */
const DIALOGS_WITHOUT_TRIGGER: Record<string, string> = {
  "vue-bits": "no dialog component",
};

/** Libraries whose select row opens no popup of its own to check, and why. */
const SELECTS_WITHOUT_POPUP: Record<string, string> = {
  "bootstrap-vue-next": "BFormSelect is a native <select>: its picker is drawn by the browser",
  "oruga": "OSelect is a native <select>",
  "vize-ui": "NativeSelect is a native <select>",
  "inspira-ui": "no select component",
  "vue-bits": "OptionWheel scrolls in place",
};

/** What to press to open a library's select, where it marks no element `role=combobox` or `aria-haspopup`. */
const SELECT_TRIGGERS: Record<string, string> = {
  "arco-design-vue": ".arco-select-view",
  "naive-ui": ".n-base-selection",
  "tdesign": ".t-select-input",
  "vant": ".van-dropdown-menu__item",
  "varlet": ".var-select",
};

/** Libraries whose select popup doesn't close on Escape, and why; the test presses the trigger again instead. */
const SELECTS_NOT_CLOSED_BY_ESCAPE: Record<string, string> = {
  vant: "touch-first: DropdownItem's Popup only emits keydown, and the menu closes on another press of its title",
};

/** `@keyframes` / `@font-face` that two libraries define differently, and why that's tolerated. */
const KNOWN_CLASHES: Record<string, string> = {
  "@keyframes fadeOut":
    "TDesign's ends with `display: none`, Oruga's doesn't; only TDesign's Anchor (not demoed) animates with it, no Oruga component does",
};

/** Prefixes of custom properties libraries register with `@property`, which can't be scoped. */
const REGISTERED_PREFIXES: Record<string, string> = {
  "--tw-": "Tailwind CSS (Nuxt UI, shadcn-vue, Inspira UI)",
  "--v-": "Vuetify",
};

// ---- mounting ----------------------------------------------------------------------

const mounted = libraries.filter((lib) => lib.load !== null);

/** A library's cells, in row order. */
const DEMO_ORDER: readonly DemoKey[] = DEMOS;

function cellOf(lib: Library, demo: DemoKey) {
  return document.querySelectorAll<HTMLElement>(`.cell[data-lib="${lib.id}"]`)[DEMO_ORDER.indexOf(demo)]!;
}

/**
 * A library's column header, which shows why it failed to load. Headers carry no `data-lib` (it
 * would scope library CSS onto them), so it's found by position.
 */
function headOf(lib: Library) {
  const table = document.querySelector(`[role=table][aria-label="${KIND_LABELS[lib.kind].name}"]`)!;
  const column = libraries.filter((other) => other.kind === lib.kind).indexOf(lib);
  return table.querySelectorAll(".head:not(.corner)")[column]!;
}

/** Where a library's demos and popups may render: its cells and its overlay host. */
function libraryScopes(lib: Library): Element[] {
  return [document.getElementById(`overlay-${lib.id}`)!, ...document.querySelectorAll(`.cell[data-lib="${lib.id}"]`)];
}

/** Visible elements added to <body> since the baseline; libraries may still park invisible helpers there. */
function visibleBodyStrays() {
  return [...document.body.children]
    .filter(
      (el) => !before.bodyChildren.has(el) && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
    )
    .filter((el) => el.getBoundingClientRect().width * el.getBoundingClientRect().height > 0)
    .map((el) => el.outerHTML.slice(0, 120));
}

/**
 * The error a library's column header shows: from loading or mounting it, or the first one its app
 * raised since (a popup's component failing in setup, say). Null when there's none.
 */
function libraryError(lib: Library) {
  return headOf(lib).querySelector(".error")?.getAttribute("title") ?? null;
}

/** The shown tab's table. */
const visibleTable = () => [...document.querySelectorAll<HTMLElement>(".table")].find((el) => el.checkVisibility())!;

/** Headers or cells in the order on screen: the grid places columns by their saved order, not the DOM's. */
function onScreen<T extends Element>(elements: Iterable<T>): T[] {
  return [...elements].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
}

/** Mounted, or failed to: waiting on another library's failure would cut this one's wait short. */
function libraryReady(lib: Library) {
  const frames = document.querySelectorAll(`.cell[data-lib="${lib.id}"] > .demo`).length;
  return frames === DEMO_ORDER.length || headOf(lib).querySelector(".error") !== null;
}

/** Shows a kind's tab and waits until its libraries have mounted (or reported why they couldn't). */
async function showKind(kind: Kind) {
  controls.kind = kind;
  await nextTick();
  await vi.waitFor(
    () => {
      const pending = mounted.filter((lib) => lib.kind === kind && !libraryReady(lib)).map((lib) => lib.id);
      if (pending.length > 0) throw new Error(`Still loading: ${pending.join(", ")}`);
    },
    { timeout: 90_000, interval: 200 },
  );
  await settle();
}

/** Lets libraries finish what they do after a change (transitions, measured layouts, runtime styles). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 500));

/** Each demo row's height in the shown table, in px. */
function rowHeights(): Record<DemoKey, number> {
  const table = [...document.querySelectorAll(".table")].find((el) => el.checkVisibility())!;
  const headers = table.querySelectorAll(".table-row > .label");
  return Object.fromEntries(
    DEMO_ORDER.map((demo, i) => [demo, Math.round(headers[i]!.getBoundingClientRect().height)]),
  ) as Record<DemoKey, number>;
}

let app: App | null;
let host: HTMLElement;
let probe: HTMLElement;
let before: {
  document: ReturnType<typeof documentSnapshot>;
  /** Per tab, since each table has its own cells and chips. */
  shell: Record<Kind, ReturnType<typeof shellSnapshot>>;
  probe: ReturnType<typeof probeSnapshot>;
  styles: Set<Element>;
  adoptedSheets: Set<CSSStyleSheet>;
  bodyChildren: Set<Element>;
  headChildren: Set<Element>;
};

beforeAll(async () => {
  // The table layout, wide enough for a column beside the sticky label column (so a press lands on
  // the demo); phones get a layout of their own, with a test of its own.
  await page.viewport(1280, 900);
  Object.assign(controls, { kind: "styled", dark: false, color: null, size: "medium", stats: true, label: "Click me" });

  probe = document.createElement("div");
  probe.innerHTML = PROBE_HTML;
  document.body.append(probe);

  host = document.createElement("div");
  document.body.append(host);
  app = createApp(Shell);
  app.mount(host);

  // Synchronously after mounting: libraries are dynamic imports, so none of their code or CSS has run yet.
  before = {
    document: documentSnapshot(),
    shell: {} as Record<Kind, ReturnType<typeof shellSnapshot>>,
    probe: probeSnapshot(probe),
    styles: new Set(document.querySelectorAll("style, link[rel=stylesheet]")),
    adoptedSheets: new Set(document.adoptedStyleSheets),
    bodyChildren: new Set(document.body.children),
    headChildren: new Set(document.head.children),
  };
  // Each tab as soon as it's shown: its libraries' modules have only started loading (and mount
  // only once their tab is shown again), so this is still the shell alone.
  for (const kind of KINDS) {
    controls.kind = kind;
    await nextTick();
    before.shell[kind] = shellSnapshot();
  }
  controls.kind = "styled";
  await nextTick();

  for (const kind of KINDS) await showKind(kind);
  await showKind("styled");
});

afterAll(() => {
  // The last test unmounts it; this is for a run that stopped before.
  app?.unmount();
  host.remove();
  probe.remove();
});

// ---- tests -------------------------------------------------------------------------

describe("Shell with every library loaded", () => {
  test("every library mounts its demo rows", () => {
    expect([...document.querySelectorAll(".head .error")].map((el) => el.getAttribute("title"))).toEqual([]);
    for (const lib of mounted) {
      expect(document.querySelectorAll(`.cell[data-lib="${lib.id}"] > .demo`), lib.id).toHaveLength(DEMO_ORDER.length);
    }
  });

  test("library CSS doesn't reach elements outside every scope", () => {
    expect(withoutRegistered(probeSnapshot(probe))).toEqual(before.probe);
  });

  test("<html> and <body> keep their attributes and styles", () => {
    const now = documentSnapshot();
    expect(now.attributes).toEqual(before.document.attributes);
    expect(withoutRegistered(now.style)).toEqual(before.document.style);
  });

  test("the shell's own styles are unaffected, in every tab", async () => {
    try {
      for (const kind of KINDS) {
        await showKind(kind);
        expect(withoutRegistered(shellSnapshot()), kind).toEqual(before.shell[kind]);
      }
    } finally {
      await showKind("styled");
    }
  });

  test("only known, prefixed custom properties are registered globally", () => {
    const unexpected = [...registeredProperties()].filter(
      (name) => !Object.keys(REGISTERED_PREFIXES).some((prefix) => name.startsWith(prefix)),
    );
    expect(unexpected).toEqual([]);
  });

  test("every rule in a library's CSS is scoped to that library", () => {
    const owner = (id: string) =>
      libraries.find(
        (lib) => lib.cssMatch.some((fragment) => id.includes(fragment)) || id.includes(`/src/libs/${lib.id}/`),
      );
    const unscoped: string[] = [];
    let checked = 0;
    for (const { id, sheet } of viteStyles()) {
      if (Object.keys(GLOBAL_LIBRARY_CSS).some((file) => id.includes(file))) continue;
      const lib = owner(id);
      // The shell's own CSS: tokens.css, Shell.vue, RadioGroup.vue.
      if (!lib && !id.includes("/src/libs/") && !id.includes("/node_modules/") && !id.includes("virtual:")) continue;
      checked++;
      // Library CSS must carry its own scope; shared CSS under src/libs any library's (or a Vue scope id).
      const scope = lib ? `[data-lib="${lib.id}"]` : "[data-lib=";
      for (const selector of topLevelSelectors(sheet)) {
        if (!selector.includes(scope) && !selector.includes("[data-v-")) unscoped.push(`${id} → ${selector}`);
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(unscoped).toEqual([]);
  });

  test("styles injected at runtime stay inside a library's scope", () => {
    const runtime = [
      ...[...document.querySelectorAll<HTMLStyleElement>("style:not([data-vite-dev-id])")]
        .filter((style) => !before.styles.has(style) && !(style.id in RUNTIME_STYLE_IDS))
        .map((style) => ({ source: style.id || style.outerHTML.slice(0, 60), sheet: style.sheet! })),
      ...[...document.adoptedStyleSheets]
        .filter((sheet) => !before.adoptedSheets.has(sheet))
        .map((sheet) => ({ source: "adopted stylesheet", sheet })),
    ];
    const offending = runtime.flatMap(({ source, sheet }) =>
      topLevelSelectors(sheet)
        .filter(
          (selector) =>
            !selector.includes("[data-lib=") &&
            !Object.keys(RUNTIME_CLASS_PREFIXES).some((prefix) => startsWithClassPrefix(selector, prefix)),
        )
        .map((selector) => `${source} → ${selector}`),
    );
    expect(offending).toEqual([]);
  });

  test("library styles still apply inside their scope", () => {
    // Otherwise everything above would pass with no library CSS at all.
    const plain = probe.querySelector("button")!;
    const looks = [
      "background-color",
      "color",
      "border-top-width",
      "border-top-left-radius",
      "padding-left",
      "font-size",
    ];
    const plainLook = pick(computedStyle(plain), looks);
    for (const lib of mounted) {
      const button = cellOf(lib, "button").querySelector(".demo button, .demo [role=button]");
      expect(button, lib.id).not.toBeNull();
      expect(pick(computedStyle(button!), looks), lib.id).not.toEqual(plainLook);
    }
  });

  test("dark mode, a primary color and another size keep everything outside the scopes as is", async () => {
    Object.assign(controls, { dark: true, color: COLORS.blue, size: "large" });
    await settle();
    try {
      for (const kind of KINDS) await showKind(kind);
      expect(withoutRegistered(probeSnapshot(probe))).toEqual(before.probe);
      expect(documentSnapshot().attributes).toEqual(before.document.attributes);
      expect(withoutRegistered(documentSnapshot().style)).toEqual(before.document.style);
    } finally {
      Object.assign(controls, { kind: "styled", dark: false, color: null, size: "medium" });
      await settle();
    }
  });

  // Before the dialog test, which leaves non-modal dialogs open over the table.
  test("selects open inside their library's scope and leave <html> / <body> alone", async () => {
    for (const kind of KINDS) {
      await showKind(kind);
      for (const lib of mounted.filter((lib) => lib.kind === kind && !(lib.id in SELECTS_WITHOUT_POPUP))) {
        const cell = cellOf(lib, "select");
        const trigger = cell.querySelector<HTMLElement>(
          SELECT_TRIGGERS[lib.id] ?? ".demo [role=combobox], .demo [aria-haspopup]:not([aria-haspopup=false])",
        );
        expect(
          trigger,
          `${lib.id}: no select trigger (role=combobox / aria-haspopup, or SELECT_TRIGGERS)`,
        ).not.toBeNull();
        // Clear of the sticky header row and label column, which would take the press.
        cell.scrollIntoView({ block: "nearest", inline: "end" });
        // A real pointer press: Reka-based selects open on pointerdown, which click() doesn't fire.
        // Forced: a select's own placeholder or value often sits on top of its trigger and takes it, as it would for a user.
        await userEvent.click(trigger!, { force: true });
        const option = await vi.waitFor(
          () => {
            const option = libraryScopes(lib)
              .flatMap((scope) => [...scope.querySelectorAll("*")])
              .find((el) => el.childElementCount === 0 && el.textContent?.trim() === "Cherry" && el.checkVisibility());
            if (!option) throw new Error(`${lib.id}: no select options shown inside its scope`);
            return option;
          },
          { timeout: 5_000 },
        );
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(libraryError(lib), `after opening ${lib.id}'s select`).toBeNull();
        expect(documentSnapshot().attributes, `after opening ${lib.id}'s select`).toEqual(before.document.attributes);
        if (lib.id in SELECTS_NOT_CLOSED_BY_ESCAPE) await userEvent.click(trigger!, { force: true });
        else await userEvent.keyboard("{Escape}");
        await vi.waitFor(() => expect(option.checkVisibility(), `${lib.id}'s select closes`).toBe(false));
      }
    }
    await settle();
    expect(documentSnapshot().attributes).toEqual(before.document.attributes);
    expect(visibleBodyStrays()).toEqual([]);
  });

  test("dragging a grip: a ghost follows, the columns make way, release saves the order, Escape undoes", async () => {
    await showKind("styled");
    const table = visibleTable();
    // Scrolled back (an earlier test scrolls it): near the table's edges a drag scrolls it on its own.
    table.scrollLeft = 0;
    const names = () =>
      onScreen(table.querySelectorAll(".head:not(.corner)")).map((el) =>
        el.querySelector(".name")!.textContent!.trim(),
      );
    const [first, second, third] = libraries.filter((lib) => lib.kind === "styled");
    const grip = onScreen(table.querySelectorAll(".head:not(.corner)"))[0]!.querySelector<HTMLElement>(".grip")!;
    const y = grip.getBoundingClientRect().top + 4;
    const pointer = (type: string, x: number) =>
      grip.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, buttons: 1, clientX: x, clientY: y }),
      );
    const width = grip.closest(".head")!.getBoundingClientRect().width;
    const start = grip.getBoundingClientRect().left + 4;
    /** Frames run (the drag follows the pointer once a frame) and every slide or landing ends. */
    const settled = async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      // A slide cut short by the next one rejects; a library's own endless animations never finish.
      const finite = table
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
      await Promise.all(finite.map((animation) => animation.finished.catch(() => {})));
      await nextTick();
    };
    try {
      pointer("pointerdown", start);
      pointer("pointermove", start + 10);
      pointer("pointermove", start + width);
      await settled();
      expect(table.querySelector(".column-ghost")?.textContent?.trim(), "the ghost").toBe(first!.name);
      expect(names().slice(0, 2), "the columns made way").toEqual([second!.name, first!.name]);
      expect(controls.order.styled, "not saved yet").toBeUndefined();

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await settled();
      expect(names().slice(0, 2)).toEqual([first!.name, second!.name]);
      expect(table.querySelector(".column-ghost")).toBeNull();

      pointer("pointerdown", start);
      pointer("pointermove", start + 10);
      pointer("pointermove", start + width * 2);
      await settled();
      pointer("pointerup", start + width * 2);
      await settled();
      expect(names().slice(0, 3)).toEqual([second!.name, third!.name, first!.name]);
      expect(controls.order.styled?.slice(0, 3)).toEqual([second!.id, third!.id, first!.id]);
      expect(table.querySelector(".column-ghost")).toBeNull();
      // Nothing is left on the columns: no running slide, no inline translate.
      const items = [...table.querySelectorAll<HTMLElement>("[data-column-item]")];
      expect(items.filter((el) => el.getAnimations().length > 0 || el.style.translate)).toEqual([]);
    } finally {
      controls.order = {};
      await nextTick();
    }
  });

  // Before the dialog test, which leaves dialogs open (one traps focus).
  test("a column moves with its grip's arrow keys, its cells along with it, without moving in the DOM", async () => {
    await showKind("styled");
    const table = visibleTable();
    const names = () =>
      onScreen(table.querySelectorAll(".head:not(.corner)")).map((el) =>
        el.querySelector(".name")!.textContent!.trim(),
      );
    const cells = () =>
      onScreen(table.querySelectorAll<HTMLElement>(".table-row")[1]!.querySelectorAll<HTMLElement>(".cell"));
    const [first, second] = libraries.filter((lib) => lib.kind === "styled");
    const domOrder = cells().map((el) => el.dataset.lib);
    try {
      const grip = onScreen(table.querySelectorAll(".head:not(.corner)"))[0]!.querySelector<HTMLButtonElement>(
        ".grip",
      )!;
      // Dispatched on the grip, which doesn't need the page to have the window's focus.
      grip.focus();
      grip.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      await nextTick();
      expect(names().slice(0, 2)).toEqual([second!.name, first!.name]);
      expect(
        cells()
          .slice(0, 2)
          .map((el) => el.dataset.lib),
      ).toEqual([second!.id, first!.id]);
      expect(controls.order.styled?.slice(0, 2)).toEqual([second!.id, first!.id]);
      // Placed by the grid: the DOM keeps its order, so the library mounted in a cell isn't touched.
      expect(
        [...table.querySelectorAll<HTMLElement>(".table-row")[1]!.querySelectorAll<HTMLElement>(".cell")].map(
          (el) => el.dataset.lib,
        ),
      ).toEqual(domOrder);
      expect(cellOf(first!, "button").getAttribute("aria-colindex"), "its column, for assistive tech").toBe("3");
      expect(
        getComputedStyle(table.querySelector(".grid")!).getPropertyValue("reading-flow"),
        "focus follows the grid",
      ).toBe("grid-rows");
      expect(document.activeElement, "the grip keeps focus").toBe(grip);
      expect([...document.querySelectorAll(".head .error")].map((el) => el.getAttribute("title"))).toEqual([]);

      table.querySelector<HTMLButtonElement>(".reset-order")!.click();
      await vi.waitFor(() => expect(names()[0]).toBe(first!.name));
      expect(controls.order).toEqual({});
      expect(table.querySelector(".reset-order")).toBeNull();
    } finally {
      controls.order = {};
      await nextTick();
    }
  });

  test("dialogs open inside their library's scope and leave <html> / <body> alone", async () => {
    for (const kind of KINDS) {
      await showKind(kind);
      for (const lib of mounted.filter((lib) => lib.kind === kind)) {
        const trigger = [...cellOf(lib, "dialog").querySelectorAll<HTMLElement>("button, [role=button]")].find((el) =>
          el.textContent?.includes("Open dialog"),
        );
        if (lib.id in DIALOGS_WITHOUT_TRIGGER) {
          expect(trigger, `${lib.id} has a dialog now: drop it from DIALOGS_WITHOUT_TRIGGER`).toBeUndefined();
          continue;
        }
        expect(trigger, `${lib.id}: no "Open dialog" trigger`).toBeDefined();
        trigger!.click();
        const text = await vi.waitFor(
          () => {
            const shown = libraryScopes(lib)
              .flatMap((scope) => [...scope.querySelectorAll("*")])
              .find(
                (el) =>
                  el.childElementCount === 0 && el.textContent?.includes("This dialog is") && el.checkVisibility(),
              );
            if (!shown) throw new Error(`${lib.id}: no dialog shown inside its scope`);
            return shown;
          },
          { timeout: 5_000 },
        );
        // Scroll locks and the like land right after opening; checked per library to name the culprit.
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(libraryError(lib), `after opening ${lib.id}'s dialog`).toBeNull();
        const tolerated = OPEN_DIALOG_BODY_ATTRIBUTES[lib.id];
        expect(documentSnapshot().attributes, `after opening ${lib.id}'s dialog`).toEqual({
          ...before.document.attributes,
          body: { ...before.document.attributes.body, ...tolerated?.attributes },
        });
        if (tolerated) {
          const dialog = text.closest("dialog, [role=dialog]")!;
          [...dialog.querySelectorAll<HTMLElement>("button")].find((el) => el.textContent?.trim() === "Close")!.click();
          await vi.waitFor(() =>
            expect(documentSnapshot().attributes, `after closing ${lib.id}'s dialog`).toEqual(
              before.document.attributes,
            ),
          );
        }
      }
    }
    await settle();

    expect(documentSnapshot().attributes).toEqual(before.document.attributes);
    expect(withoutRegistered(documentSnapshot().style)).toEqual(before.document.style);
    expect(visibleBodyStrays()).toEqual([]);
  });

  test("switching size never changes a row's height (ROW_HEIGHTS in Shell.vue covers every library)", async () => {
    try {
      for (const kind of KINDS) {
        await showKind(kind);
        const heights: Partial<Record<string, Record<DemoKey, number>>> = {};
        for (const size of SIZES) {
          controls.size = size;
          await settle();
          heights[size] = rowHeights();
        }
        // A row that grows at some size has a demo taller than its ROW_HEIGHTS entry: raise that.
        for (const size of SIZES) expect(heights[size], `${kind} at ${size}`).toEqual(heights.medium);
      }
    } finally {
      Object.assign(controls, { kind: "styled", size: "medium" });
      await settle();
    }
  });

  test("no two stylesheets define the same @keyframes or @font-face differently", () => {
    // Neither can be scoped: a later definition under the same name replaces the earlier one page-wide.
    const definitions = new Map<string, Map<string, string>>();
    const define = (key: string, text: string, rule: CSSRule) => {
      if (!definitions.has(key)) definitions.set(key, new Map());
      definitions.get(key)!.set(text, sourceOf(rule));
    };
    for (const rule of allRules()) {
      if (rule instanceof CSSKeyframesRule) define(`@keyframes ${rule.name}`, rule.cssText, rule);
      if (rule instanceof CSSFontFaceRule) {
        const { style } = rule;
        const face = ["font-family", "font-weight", "font-style"].map((name) => style.getPropertyValue(name));
        define(`@font-face ${face.join(" ")}`, style.getPropertyValue("src"), rule);
      }
    }
    // Redefinitions within one stylesheet behave as they do with the library on its own page.
    const clashing = [...definitions]
      .map(([key, texts]) => [key, [...new Set(texts.values())]] as const)
      .filter(([key, sources]) => sources.length > 1 && !(key in KNOWN_CLASHES))
      .map(([key, sources]) => `${key}: ${sources.join(" vs ")}`);
    expect(clashing).toEqual([]);
  });

  test("phones show one component at a time, each library's demo under its header", async () => {
    await page.viewport(375, 812);
    onTestFinished(() => page.viewport(1280, 900));
    const pick = async (demo: DemoKey) => {
      document.querySelector<HTMLInputElement>(`.demo-picker input[value="${demo}"]`)!.click();
      await nextTick();
    };
    try {
      for (const kind of KINDS) {
        await showKind(kind);
        const table = [...document.querySelectorAll<HTMLElement>(".table")].find((el) => el.checkVisibility())!;
        const heads = [...table.querySelectorAll(".head:not(.corner)")];
        const rows = [...table.querySelectorAll(".table-row")].slice(1);
        for (const [index, demo] of DEMO_ORDER.entries()) {
          await pick(demo);
          expect(table.scrollWidth, `${kind} ${demo}: scrolls sideways`).toBeLessThanOrEqual(table.clientWidth);
          for (const [rowIndex, row] of rows.entries()) {
            const shown = [...row.querySelectorAll(".cell")].map((cell) => cell.checkVisibility());
            expect(shown, `${kind}: ${DEMO_ORDER[rowIndex]} cells with ${demo} picked`).toEqual(
              shown.map(() => rowIndex === index),
            );
          }
          // Each cell right under its library's header, as wide.
          const cells = [...rows[index]!.querySelectorAll(".cell")];
          for (const [i, head] of heads.entries()) {
            const h = head.getBoundingClientRect();
            const c = cells[i]!.getBoundingClientRect();
            expect([c.top, c.left, c.width].map(Math.round), `${kind} ${demo}: cell ${i}`).toEqual(
              [h.bottom, h.left, h.width].map(Math.round),
            );
          }
        }
      }
    } finally {
      await pick("button");
      await showKind("styled");
    }
  });

  test("phones keep the settings in a dialog, which goes away on a wider screen", async () => {
    const dialog = document.querySelector<HTMLDialogElement>("#options-dialog")!;
    const facets = () => document.querySelector(".facets")!;
    await page.viewport(375, 812);
    onTestFinished(() => page.viewport(1280, 900));
    await vi.waitFor(() => expect(dialog.contains(facets()), "settings in the dialog").toBe(true));
    expect(facets().checkVisibility(), "closed, so hidden").toBe(false);

    document.querySelector<HTMLButtonElement>(".topbar .options-toggle")!.click();
    expect(dialog.matches(":modal")).toBe(true);
    await vi.waitFor(() => expect(facets().checkVisibility()).toBe(true));

    // Back on the page, and the dialog (now empty) closed.
    await page.viewport(1280, 900);
    await vi.waitFor(() =>
      expect(document.querySelector("main")!.contains(facets()), "settings on the page").toBe(true),
    );
    expect(dialog.open).toBe(false);
    expect(documentSnapshot().attributes).toEqual(before.document.attributes);
  });

  // Last: it takes the shell down.
  test("unmounting the shell undoes every library's mount", async () => {
    app!.unmount();
    app = null;
    await settle();

    expect(document.querySelectorAll("[data-lib]")).toHaveLength(0);
    expect(documentSnapshot().attributes).toEqual(before.document.attributes);
    const strays = [...document.body.children]
      .filter((el) => !before.bodyChildren.has(el))
      .map((el) => el.outerHTML.slice(0, 120));
    expect(strays).toEqual([]);
    // Stylesheets may stay (modules aren't unloaded, and every rule is checked to be scoped above); nothing else may.
    const headStrays = [...document.head.children]
      .filter((el) => !before.headChildren.has(el) && !el.matches("style, link[rel=stylesheet]"))
      .map((el) => el.outerHTML.slice(0, 120));
    expect(headStrays).toEqual([]);

    // The observers that adopt portals into an overlay host (Quasar, Astryx Vue) are disconnected.
    const portals = [
      Object.assign(document.createElement("div"), { id: "q-portal--dialog--99" }),
      Object.assign(document.createElement("div"), { className: "astryx-selector-listbox" }),
    ];
    document.body.append(...portals);
    await settle();
    expect(portals.map((el) => el.parentElement)).toEqual([document.body, document.body]);
    portals.forEach((el) => el.remove());

    // Component defaults changed for the demos are back to the libraries' own.
    const { Popup } = await import("vant");
    const { Dialog, Menu } = await import("@varlet/ui");
    const defaultOf = (component: unknown, prop: string) =>
      ((component as { props: Record<string, { default: unknown }> }).props[prop] as { default: unknown }).default;
    expect(defaultOf(Popup, "lockScroll")).toBe(true);
    expect(defaultOf(Menu, "teleport")).toBe("body");
    expect(defaultOf(Dialog.Component, "teleport")).toBe("body");
    expect(defaultOf(Dialog.Component, "lockScroll")).toBe(true);
  });
});
