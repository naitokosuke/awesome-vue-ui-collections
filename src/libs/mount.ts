import { type App, type Component, createApp, type InjectionKey, watchEffect } from "vue";
import { DEMOS, type MountTargets } from "./types";

export const overlayKey: InjectionKey<HTMLElement> = Symbol("overlay");

let appCount = 0;

/**
 * Creates one isolated Vue app per demo cell of a UI library.
 * Plugins installed via `install` stay inside these apps (`install` runs once per cell),
 * and each app mounts into a host element appended to its grid cell, after the shell's
 * own content, so all libraries line up row by row.
 */
export function mountLibrary(targets: MountTargets, Demos: Component, install: (app: App) => void) {
  const unmounts = DEMOS.map((demo) => {
    const app = createApp(Demos, { demo });
    // Every app's useId() would otherwise start at `v-0`, so ids (label `for`, aria-*) collide across apps.
    app.config.idPrefix = `app${appCount++}`;
    app.provide(overlayKey, targets.overlay);
    install(app);
    // `mount` replaces the container's content, so the shell's chip in the cell needs a host of its own.
    const host = document.createElement("div");
    host.className = "demo-host";
    // Layout-transparent, so the demo stays a flex item of the cell as before.
    host.style.display = "contents";
    targets.cells[demo].append(host);
    app.mount(host);
    return () => {
      app.unmount();
      host.remove();
    };
  });
  return () => unmounts.forEach((unmount) => unmount());
}

/**
 * Reactively sets CSS custom properties on a library's scope elements (its demo cells and
 * overlay host), e.g. to push the selected primary color into a CSS-variable-themed library.
 * `vars` returning null removes them again. Returns a function that stops and cleans up.
 */
export function bindScopeVars(targets: MountTargets, vars: () => Record<string, string> | null) {
  const elements = [...Object.values(targets.cells), targets.overlay];
  let applied: string[] = [];
  const clear = (keep: Record<string, string> = {}) => {
    for (const el of elements) for (const name of applied) if (!(name in keep)) el.style.removeProperty(name);
  };
  const stop = watchEffect(() => {
    const next = vars() ?? {};
    clear(next);
    for (const el of elements) for (const [name, value] of Object.entries(next)) el.style.setProperty(name, value);
    applied = Object.keys(next);
  });
  return () => {
    stop();
    clear();
  };
}
