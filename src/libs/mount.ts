import { type App, type Component, createApp, inject, type InjectionKey, watchEffect } from "vue";
import type { MountContext } from "./types";

const contextKey: InjectionKey<MountContext> = Symbol("mount-context");

/** The shell's mount context, inside a library's app: its cells, overlay host and controls. */
export function useMountContext(): MountContext {
  const context = inject(contextKey);
  if (!context) throw new Error("useMountContext() called outside an app created by mountLibrary()");
  return context;
}

let appCount = 0;

/**
 * Creates the Vue app of one UI library, so plugins installed via `install` stay inside it.
 * `Demos` renders every row at once through DemoCells.vue, which teleports each one into its
 * grid cell after the shell's own content, so all libraries line up row by row.
 */
export function mountLibrary(context: MountContext, Demos: Component, install: (app: App) => void = () => {}) {
  const app = createApp(Demos);
  // Every app's useId() would otherwise start at `v-0`, so ids (label `for`, aria-*) collide across apps.
  app.config.idPrefix = `app${appCount++}`;
  app.provide(contextKey, context);
  install(app);
  // The root itself renders only what isn't teleported (e.g. a provider's wrapper element), so it
  // lives in the overlay host: inside the library's CSS scope, and out of the table's layout.
  const host = document.createElement("div");
  context.overlay.append(host);
  app.mount(host);
  return () => {
    app.unmount();
    host.remove();
  };
}

/**
 * Reactively sets CSS custom properties on a library's scope elements (its demo cells and
 * overlay host), e.g. to push the selected primary color into a CSS-variable-themed library.
 * `vars` returning null removes them again. Returns a function that stops and cleans up.
 */
export function bindScopeVars(context: MountContext, vars: () => Record<string, string> | null) {
  const elements = [...Object.values(context.cells), context.overlay];
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
