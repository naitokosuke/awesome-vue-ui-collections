import "quasar/dist/quasar.css";
import "@quasar/extras/material-icons/material-icons.css";
import { Quasar } from "quasar";
import { bindScopeVars, mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  const { controls } = context;

  const restoreBodyClass = workaround({
    reason:
      "Quasar's Platform and Dark plugins add classes to <body> (`desktop`, `no-touch`, `body--light`, ...) on install: " +
      "they're undone right after mounting, as no demo depends on them (dark mode comes from `darkAttrs` and the `dark` prop)",
    apply: () => {
      const bodyClass = document.body.getAttribute("class");
      // Restored exactly: no `class=""` left behind on a <body> that had no class attribute.
      return () => {
        if (bodyClass === null) document.body.removeAttribute("class");
        else document.body.setAttribute("class", bodyClass);
      };
    },
  });
  try {
    mountLibrary(context, Demos, (app) => {
      app.use(Quasar, {
        config: {
          dark: false,
          // don't set `lang`/`dir` on <html>
          lang: { noHtmlAttrs: true },
        },
      });
    });
  } finally {
    restoreBodyClass();
  }

  workaround({
    reason:
      "Quasar has no option for where portals (QMenu, QDialog, ...) go and appends `#q-portal--<type>--<n>` to <body>: " +
      "they're moved into the overlay host, inside the CSS scope, where Vue's Teleport keeps targeting them",
    apply: () => {
      const adopt = (node: Node) => {
        if (node instanceof HTMLElement && node.id.startsWith("q-portal--")) context.overlay.append(node);
      };
      const observer = new MutationObserver((records) => {
        for (const record of records) record.addedNodes.forEach(adopt);
      });
      observer.observe(document.body, { childList: true });
      return () => observer.disconnect();
    },
  });

  // quasar.css reads `--q-primary` everywhere (bg/text-primary, toggle, focused field,
  // active item); its `:root` default is scoped onto these same elements.
  bindScopeVars(context, () => (controls.color ? { "--q-primary": controls.color } : null));
}
