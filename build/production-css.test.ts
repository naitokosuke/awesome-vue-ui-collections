/**
 * The browser test (src/Shell.test.ts) runs on the dev server. This one builds the site for
 * production and checks the CSS that is actually shipped: bundled, split per library and
 * minified, it must still keep every rule inside a scope.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Selector, type SelectorComponent, transform } from "lightningcss";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { build } from "vite-plus";
import { libraries } from "../src/libs/index.ts";

/** Library CSS that is deliberately global, and why (see the file). */
const GLOBAL_SELECTORS: Record<string, string> = {
  "body>.var-field-decorator__placeholder-text": "src/libs/varlet/measure.css: Varlet's measuring span on <body>",
};

let outDir: string;
let sheets: { file: string; selectors: Selector[] }[];

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), "avc-build-"));
  await build({ logLevel: "error", build: { outDir, emptyOutDir: true } });
  const assets = join(outDir, "assets");
  sheets = readdirSync(assets)
    .filter((file) => file.endsWith(".css"))
    .map((file) => ({ file, selectors: selectorsOf(file, readFileSync(join(assets, file))) }));
});

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

/** Every style rule's selectors, except nested ones (relative to an already checked parent). */
function selectorsOf(filename: string, code: Buffer) {
  const selectors: Selector[] = [];
  transform({
    filename,
    code,
    errorRecovery: true,
    visitor: {
      Rule: {
        style(rule) {
          selectors.push(...rule.value.selectors.filter((selector) => !selector.some((c) => c.type === "nesting")));
        },
      },
    },
  });
  return selectors;
}

/**
 * Whether the selector is anchored on a matching compound: on or under it, never beside it.
 * Only ancestors may come before it (`:where(html.dark) <scope>`), `~` / `+` may not follow it,
 * and a `:where()` / `:is()` counts as the anchor only when every alternative is anchored itself.
 */
function anchored(selector: Selector, match: (component: SelectorComponent) => boolean): boolean {
  const isAnchor = (component: SelectorComponent) =>
    match(component) ||
    (component.type === "pseudo-class" &&
      (component.kind === "where" || component.kind === "is") &&
      component.selectors.every((inner) => anchored(inner, match)));
  const isAncestry = (component: SelectorComponent | undefined) =>
    component === undefined ||
    component.type !== "combinator" ||
    component.value === "descendant" ||
    component.value === "child";

  let start = 0;
  while (start < selector.length) {
    const end = selector.findIndex((component, i) => i >= start && component.type === "combinator");
    const compound = selector.slice(start, end === -1 ? selector.length : end);
    if (compound.some(isAnchor)) return isAncestry(selector[end]);
    if (end === -1 || !isAncestry(selector[end])) return false;
    start = end + 1;
  }
  return false;
}

/** Whether the selector, or a leading `:where()` / `:is()` alternative of it, has a matching component. */
function mentions(selector: Selector, match: (component: SelectorComponent) => boolean): boolean {
  return selector.some(
    (component) =>
      match(component) ||
      (component.type === "pseudo-class" &&
        (component.kind === "where" || component.kind === "is") &&
        component.selectors.some((inner) => mentions(inner, match))),
  );
}

const isScope = (id?: string) => (component: SelectorComponent) =>
  component.type === "attribute" &&
  component.name === "data-lib" &&
  (id === undefined || component.operation?.value === id);

/** Vue's scoped-style attribute, or the shell's root (src/tokens.css). */
const isShell = (component: SelectorComponent) =>
  (component.type === "attribute" && component.name.startsWith("data-v-")) ||
  (component.type === "class" && component.name === "shell");

/** The selector as text, close enough to read in a failure. */
function print(selector: Selector): string {
  return selector
    .map((c) => {
      switch (c.type) {
        case "combinator":
          return c.value === "descendant" ? " " : c.value === "child" ? ">" : ` ${c.value} `;
        case "type":
          return c.name;
        case "class":
          return `.${c.name}`;
        case "id":
          return `#${c.name}`;
        case "attribute":
          return `[${c.name}${c.operation ? `=${c.operation.value}` : ""}]`;
        case "pseudo-class":
          return c.kind === "where" || c.kind === "is" || c.kind === "not"
            ? `:${c.kind}(${c.selectors.map(print).join(",")})`
            : `:${c.kind}`;
        case "pseudo-element":
          return `::${c.kind}`;
        case "universal":
          return "*";
        default:
          return `<${c.type}>`;
      }
    })
    .join("");
}

describe("production build", () => {
  test("ships every library's CSS in a chunk of its own", () => {
    const withCss = libraries.filter((lib) => lib.load && lib.cssMatch.length > 0).map((lib) => lib.id);
    const missing = withCss.filter((id) => !sheets.some(({ file }) => file.startsWith(`${id}-`)));
    expect(missing).toEqual([]);
  });

  test("keeps every rule inside a library scope or the shell", () => {
    const unscoped: string[] = [];
    let checked = 0;
    for (const { file, selectors } of sheets) {
      // A library's chunk must carry that library's own scope; shared chunks any library's.
      const lib = libraries.find((lib) => file.startsWith(`${lib.id}-`));
      for (const selector of selectors) {
        checked++;
        const text = print(selector);
        if (text in GLOBAL_SELECTORS) continue;
        if (anchored(selector, isScope(lib?.id)) || mentions(selector, isShell)) continue;
        unscoped.push(`${file} → ${text}`);
      }
    }
    expect(checked).toBeGreaterThan(10_000);
    expect(unscoped).toEqual([]);
  });
});
