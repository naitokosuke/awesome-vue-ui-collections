import { describe, expect, test } from "vite-plus/test";
import { scopeLibraryCss } from "./scope-library-css.ts";

const plugin = scopeLibraryCss([{ id: "x", match: ["/node_modules/lib/"] }]);

function transform(code: string, id = "/root/node_modules/lib/style.css") {
  return (plugin.transform as (code: string, id: string) => { code: string } | undefined).call({}, code, id);
}

/** The selector `selector` is rewritten to (the text before the rule's block). */
function scoped(selector: string) {
  return transform(`${selector} { color: red }`)!.code.split(" {")[0];
}

const SCOPE = ':where([data-lib="x"])';

describe("scopeLibraryCss", () => {
  test("only touches CSS files that match a library", () => {
    expect(transform(".a { color: red }", "/root/node_modules/other/style.css")).toBeUndefined();
    expect(transform("export default 1", "/root/node_modules/lib/index.js")).toBeUndefined();
    // Query strings (`?inline`, `?direct`) don't hide the extension.
    expect(transform(".a .b { color: red }", "/root/node_modules/lib/style.css?inline")!.code).toContain(SCOPE);
  });

  test("puts ordinary selectors under the scope", () => {
    expect(scoped(".a .b")).toBe(`${SCOPE} .a .b`);
    expect(scoped("div")).toBe(`${SCOPE} div`);
    expect(scoped("*")).toBe(`${SCOPE} *`);
    expect(scoped("::backdrop")).toBe(`${SCOPE} ::backdrop`);
  });

  test("lets a lone class or attribute also match on the scope element (theme roots)", () => {
    expect(scoped(".van-theme-dark")).toBe(`:is(${SCOPE} .van-theme-dark, ${SCOPE}.van-theme-dark)`);
    expect(scoped("[data-theme]")).toBe(`:is(${SCOPE} [data-theme], ${SCOPE}[data-theme])`);
  });

  test("replaces bare :root, html and body with the scope", () => {
    expect(scoped(":root")).toBe(SCOPE);
    expect(scoped("html")).toBe(SCOPE);
    expect(scoped("body")).toBe(SCOPE);
    expect(scoped("html body .x")).toBe(`${SCOPE} .x`);
  });

  test("matches qualified roots on the scope element or on an ancestor of it", () => {
    expect(scoped("html.dark .x")).toBe(`:is(${SCOPE}.dark, :where(html.dark) ${SCOPE}) .x`);
    expect(scoped("body[arco-theme=dark] .x")).toBe(
      `:is(${SCOPE}[arco-theme="dark"], :where(body[arco-theme="dark"]) ${SCOPE}) .x`,
    );
    expect(scoped(":root[theme-mode=dark]")).toBe(
      `:is(${SCOPE}[theme-mode="dark"], :where(:root[theme-mode="dark"]) ${SCOPE})`,
    );
  });

  test("keeps pseudo-elements of a root out of :is() / :where(), where they'd be invalid", () => {
    expect(scoped("body::before")).toBe(`${SCOPE}:before`);
  });

  test("decides a root's :not() on the scope element alone, never on an ancestor", () => {
    // Quasar's platform rules: an ancestor branch would hold on any <body> and never switch off.
    expect(scoped("body:not(.desktop) .desktop-only")).toBe(`${SCOPE}:not(.desktop) .desktop-only`);
    expect(scoped("body.mobile:not(.native-mobile) .q-select__dialog")).toBe(
      `${SCOPE}.mobile:not(.native-mobile) .q-select__dialog`,
    );
    expect(scoped("html body:not(.q-body--layout-animate) .x")).toBe(`${SCOPE}:not(.q-body--layout-animate) .x`);
  });

  test("keeps a root's siblings under the scope, away from the neighbouring libraries", () => {
    expect(scoped("body ~ .a")).toBe(`${SCOPE} body ~ .a`);
    expect(scoped("body + .a")).toBe(`${SCOPE} body + .a`);
    expect(scoped("html.dark ~ .a")).toBe(`${SCOPE} html.dark ~ .a`);
    expect(scoped(":where(:root, .x) ~ .a")).toBe(`${SCOPE} :where(:root, .x) ~ .a`);
    // Only right after the root: siblings further in are ordinary descendants.
    expect(scoped("body .a ~ .b")).toBe(`${SCOPE} .a ~ .b`);
  });

  test("treats :host(<selector>) as a root qualified by that selector", () => {
    expect(scoped(":host(.dark) .x")).toBe(`:is(${SCOPE}.dark, :where(:root.dark) ${SCOPE}) .x`);
  });

  test("rewrites roots listed inside a leading :where() / :is()", () => {
    expect(scoped(":where(:root, :host, [data-theme])")).toBe(`:where(${SCOPE}, ${SCOPE}, ${SCOPE} [data-theme])`);
    // Vize UI's theme presets: the :host() alternative must keep its condition.
    expect(scoped(":where([data-theme~=paper], :host([data-theme~=paper]))")).toBe(
      `:where(${SCOPE} [data-theme~="paper"], :is(${SCOPE}[data-theme~="paper"], :where(:root[data-theme~="paper"]) ${SCOPE}))`,
    );
    expect(scoped(":is(html.dark, .x) .a")).toBe(`:is(:is(${SCOPE}.dark, :where(html.dark) ${SCOPE}), ${SCOPE} .x) .a`);
  });

  test("scopes each selector of a list, and rules inside at-rules", () => {
    expect(scoped(".a, .b .c")).toBe(`:is(${SCOPE} .a, ${SCOPE}.a), ${SCOPE} .b .c`);
    expect(transform("@media (min-width: 1px) { :root { color: red } }")!.code).toContain(`  ${SCOPE} {`);
  });

  test("leaves nested rules alone: their parent is already scoped", () => {
    const { code } = transform(".a { &:hover { color: red } }")!;
    expect(code).toContain(`:is(${SCOPE} .a, ${SCOPE}.a) {`);
    expect(code).toContain("&:hover {");
  });
});
