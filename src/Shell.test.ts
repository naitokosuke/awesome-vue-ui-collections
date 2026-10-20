/**
 * Every library lives on one page: these tests load all of them into the shell and check that
 * none of their CSS or DOM side effects reach outside their `[data-lib]` scope (see
 * build/scope-library-css.ts and libs/mount.ts), while their own styles still apply inside it.
 *
 * The baseline is taken right after the shell mounts, before any library module has loaded
 * (they're dynamic imports), so it is the page as the shell alone styles it.
 */
import "./tokens.css";
import { afterAll, beforeAll, describe, expect, test, vi } from "vite-plus/test";
import { type App, createApp, nextTick } from "vue";
import { libraries } from "./libs";
import { type DemoKey, DEMOS, type Kind, KINDS, type Library } from "./libs/types";
import Shell from "./Shell.vue";
import { COLORS, controls } from "./store";

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

/** Every computed property (custom properties included), minus the layout-dependent ones. */
function computedStyle(el: Element, pseudo?: string): Style {
  const style = getComputedStyle(el, pseudo);
  const out: Style = {};
  for (let i = 0; i < style.length; i++) {
    const name = style.item(i);
    if (!LAYOUT_PROPERTIES.has(name)) out[name] = style.getPropertyValue(name);
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

/** Every stylesheet rule on the page, nested rules included. */
function allRules(): CSSRule[] {
  const rules: CSSRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of list) {
      rules.push(rule);
      if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  return rules;
}

/**
 * Custom properties registered with `@property`. Registration is global by spec (it can't be
 * scoped), and a registered property shows up, at its initial value, on every element.
 */
function registeredProperties(): Set<string> {
  return new Set(allRules().flatMap((rule) => (rule instanceof CSSPropertyRule ? [rule.name] : [])));
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
  ".grid > .label",
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
  "astryx-vue": {
    attributes: { style: "overflow: hidden;" },
    reason:
      "Dialog locks scroll in showModal() unconditionally; the shell's page never scrolls itself (its table does)",
  },
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

function libraryReady(lib: Library) {
  const frames = document.querySelectorAll(`.cell[data-lib="${lib.id}"] > .demo`).length;
  return frames === DEMO_ORDER.length || document.querySelector(".head .error") !== null;
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

let app: App;
let probe: HTMLElement;
let before: {
  document: ReturnType<typeof documentSnapshot>;
  shell: ReturnType<typeof shellSnapshot>;
  probe: ReturnType<typeof probeSnapshot>;
  styles: Set<Element>;
  bodyChildren: Set<Element>;
};

beforeAll(async () => {
  Object.assign(controls, { kind: "styled", dark: false, color: null, size: "medium", stats: true, label: "Click me" });

  probe = document.createElement("div");
  probe.innerHTML = PROBE_HTML;
  document.body.append(probe);

  const host = document.createElement("div");
  document.body.append(host);
  app = createApp(Shell);
  app.mount(host);

  // Synchronously after mounting: libraries are dynamic imports, so none of their code or CSS has run yet.
  before = {
    document: documentSnapshot(),
    shell: shellSnapshot(),
    probe: probeSnapshot(probe),
    styles: new Set(document.querySelectorAll("style, link[rel=stylesheet]")),
    bodyChildren: new Set(document.body.children),
  };

  for (const kind of KINDS) await showKind(kind);
  await showKind("styled");
});

afterAll(() => {
  app.unmount();
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

  test("the shell's own styles are unaffected", () => {
    expect(withoutRegistered(shellSnapshot())).toEqual(before.shell);
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

  test("styles injected at runtime never target the document itself", () => {
    const root = /^(?:html|body|:root|:host|\*)(?![\w-])/;
    const offending = [...document.querySelectorAll<HTMLStyleElement>("style:not([data-vite-dev-id])")]
      .filter((style) => !before.styles.has(style))
      .flatMap((style) =>
        topLevelSelectors(style.sheet!)
          .filter((selector) => root.test(selector) && !selector.includes("[data-lib="))
          .map((selector) => `${style.id || style.outerHTML.slice(0, 60)} → ${selector}`),
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

  test("dialogs open inside their library's scope and leave <html> / <body> alone", async () => {
    for (const kind of KINDS) {
      await showKind(kind);
      for (const lib of mounted.filter((lib) => lib.kind === kind)) {
        const trigger = [...cellOf(lib, "dialog").querySelectorAll<HTMLElement>("button, [role=button]")].find((el) =>
          el.textContent?.includes("Open dialog"),
        );
        // Vue Bits has no dialog.
        if (!trigger) continue;
        trigger.click();
        const text = await vi.waitFor(
          () => {
            const scopes = [
              document.getElementById(`overlay-${lib.id}`)!,
              ...document.querySelectorAll(`.cell[data-lib="${lib.id}"]`),
            ];
            const shown = scopes
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
    // Libraries may still park invisible helpers on <body> (measuring nodes, empty containers).
    const visibleStrays = [...document.body.children]
      .filter(
        (el) => !before.bodyChildren.has(el) && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      )
      .filter((el) => el.getBoundingClientRect().width * el.getBoundingClientRect().height > 0)
      .map((el) => el.outerHTML.slice(0, 120));
    expect(visibleStrays).toEqual([]);
  });
});
