import { type Selector, type SelectorComponent, transform } from "lightningcss";
import type { Plugin } from "vite-plus";

export interface ScopeRule {
  /** Value of the `data-lib` attribute the CSS is scoped to. */
  id: string;
  /** Path fragments identifying the library's CSS files. */
  match: string[];
}

/**
 * Scopes each UI library's global CSS under `:where([data-lib="<id>"])`,
 * so several libraries can live on one page without their resets colliding.
 *
 * - bare `:root` / `html` / `body` are replaced by the scope itself
 * - qualified ones (`html.dark`, `body[arco-theme=dark]`) match either on the
 *   scope element or as an ancestor of it, so theme switches work both ways
 * - a lone class/attribute (`.van-theme-dark`) also matches on the scope element
 * - every other selector becomes a descendant of the scope
 * - `:where()` keeps the original specificity untouched
 *
 * Runs after Vite's own CSS transform (imports inlined, Tailwind generated),
 * rewriting selectors with Lightning CSS's AST visitor.
 */
export function scopeLibraryCss(rules: ScopeRule[]): Plugin {
  return {
    name: "scope-library-css",
    transform(code, id) {
      const file = id.split("?")[0]!;
      if (!file.endsWith(".css")) return;
      const rule = rules.find(({ match }) => match.some((fragment) => file.includes(fragment)));
      if (!rule) return;

      const scope = scopeComponent(rule.id);
      const result = transform({
        filename: file,
        code: Buffer.from(code),
        errorRecovery: true,
        // A `Selector` visitor (not `Rule`): returning whole rules makes Lightning CSS
        // re-deserialize every declaration, which fails on some library CSS.
        visitor: { Selector: (selector) => scopeSelector(selector, scope) },
      });
      return { code: result.code.toString(), map: null };
    },
  };
}

/** `:where([data-lib="<id>"])` */
function scopeComponent(id: string): SelectorComponent {
  return {
    type: "pseudo-class",
    kind: "where",
    selectors: [
      [
        {
          type: "attribute",
          namespace: null,
          name: "data-lib",
          operation: { operator: "equal", value: id, caseSensitivity: "case-sensitive" },
        },
      ],
    ],
  };
}

const DESCENDANT: SelectorComponent = { type: "combinator", value: "descendant" };

function isGlobalElement(component: SelectorComponent | undefined) {
  if (!component) return false;
  if (component.type === "type") return component.name === "html" || component.name === "body";
  return component.type === "pseudo-class" && (component.kind === "root" || component.kind === "host");
}

function isBody(component: SelectorComponent | undefined) {
  return component?.type === "type" && component.name === "body";
}

/** Index of the first combinator, i.e. the end of the leading compound selector. */
function compoundEnd(selector: Selector, from = 0) {
  const index = selector.findIndex((component, i) => i >= from && component.type === "combinator");
  return index === -1 ? selector.length : index;
}

/** `:is(a, b)`: matches either variant; its specificity is the larger of the two. */
function either(...selectors: Selector[]): SelectorComponent {
  return { type: "pseudo-class", kind: "is", selectors };
}

/** Returns one selector per input; alternatives are combined with `:is()`. */
function scopeSelector(selector: Selector, scope: SelectorComponent): Selector {
  // Nested rules (`&`) are already inside a scoped parent.
  if (selector.some((component) => component.type === "nesting")) return selector;

  const [first] = selector;

  // `:where(:root, :host, [data-theme])` -> `:where(<scope>, <scope> [data-theme])`
  if (
    first?.type === "pseudo-class" &&
    (first.kind === "where" || first.kind === "is") &&
    first.selectors.some((inner) => inner.length === 1 && isGlobalElement(inner[0]))
  ) {
    const selectors = first.selectors.map((inner) =>
      inner.length === 1 && isGlobalElement(inner[0]) ? [scope] : [scope, DESCENDANT, ...inner],
    );
    return [{ ...first, selectors }, ...selector.slice(1)];
  }

  if (!isGlobalElement(first)) {
    const themeRoot =
      compoundEnd(selector) === selector.length &&
      selector.every((component) => component.type === "class" || component.type === "attribute");
    const descendant = [scope, DESCENDANT, ...selector];
    return themeRoot ? [either(descendant, [scope, ...selector])] : descendant;
  }

  // `html.dark body > .x`: collect the qualifiers of the leading html/body/:root and a following body.
  let end = compoundEnd(selector);
  const qualifiers = selector.slice(1, end);
  const next = selector[end + 1];
  if (end < selector.length && isBody(next)) {
    const bodyEnd = compoundEnd(selector, end + 1);
    qualifiers.push(...selector.slice(end + 2, bodyEnd));
    end = bodyEnd;
  }
  const rest = selector.slice(end);

  if (qualifiers.length === 0) return [scope, ...rest];
  // Pseudo-elements are invalid inside :where()/:is() and would drop the whole rule.
  if (qualifiers.some((component) => component.type === "pseudo-element")) return [scope, ...qualifiers, ...rest];
  const global: SelectorComponent = { type: "pseudo-class", kind: "where", selectors: [selector.slice(0, end)] };
  // `:is(<scope>.dark, :where(html.dark) <scope>) .x`
  return [either([scope, ...qualifiers], [global, DESCENDANT, scope]), ...rest];
}
