import { type App, type Component, createApp, inject, type InjectionKey, onScopeDispose, watchEffect } from "vue";
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
 * The app is unmounted when the library's effect scope (see LibraryModule) stops, also when
 * mounting fails: an error while mounting is thrown from here, after anything already rendered.
 */
export function mountLibrary(context: MountContext, Demos: Component, install: (app: App) => void = () => {}) {
  const app = createApp(Demos);
  // Every app's useId() would otherwise start at `v-0`, so ids (label `for`, aria-*) collide across apps.
  app.config.idPrefix = `app${appCount++}`;
  app.provide(contextKey, context);
  // Without a handler, Vue only logs component errors in production (and throws them in dev), so a
  // library failing in setup or render would show empty cells and no error.
  let mounted = false;
  const mountErrors: unknown[] = [];
  app.config.errorHandler = (error) => {
    if (mounted) context.reportError(error);
    else mountErrors.push(error);
  };
  // The root itself renders only what isn't teleported (e.g. a provider's wrapper element), so it
  // lives in the overlay host: inside the library's CSS scope, and out of the table's layout.
  const host = document.createElement("div");
  context.overlay.append(host);
  onScopeDispose(() => {
    if (mounted) app.unmount();
    host.remove();
  });
  install(app);
  app.mount(host);
  mounted = true;
  if (mountErrors.length > 0) throw mountErrors[0];
}

/**
 * Something a library does to the page that one shared page can't take, and how it's undone.
 * Every change an adapter makes outside its own app goes through `workaround()`, so each one
 * states its reason, checks what it relies on, and is undone with the library.
 */
export interface Workaround {
  /** What the library does, and what's changed about it. Shown in the column header if `assumes` fails. */
  reason: string;
  /**
   * What the change relies on in the library's internals, checked before applying it. False means
   * the library changed under it (e.g. in an upgrade): mounting fails rather than the change quietly
   * missing. Leave it out where there's nothing to check up front.
   */
  assumes?: () => boolean;
  /** Makes the change and returns how to undo it. */
  apply: () => () => void;
}

/**
 * Applies a workaround inside the library's effect scope. The undo runs when the scope stops, or
 * earlier by calling the returned function (e.g. right after mounting); either way at most once.
 */
export function workaround({ reason, assumes, apply }: Workaround): () => void {
  if (assumes && !assumes()) throw new Error(`Workaround no longer holds: ${reason}`);
  let undo: (() => void) | null = apply();
  const undoOnce = () => {
    undo?.();
    undo = null;
  };
  onScopeDispose(undoOnce);
  return undoOnce;
}

/**
 * Reactively sets CSS custom properties on a library's scope elements (its demo cells and
 * overlay host), e.g. to push the selected primary color into a CSS-variable-themed library.
 * `vars` returning null removes them again, as does stopping the library's effect scope.
 */
export function bindScopeVars(context: MountContext, vars: () => Record<string, string> | null) {
  const elements = [...Object.values(context.cells), context.overlay];
  let applied: string[] = [];
  const clear = (keep: Record<string, string> = {}) => {
    for (const el of elements) for (const name of applied) if (!(name in keep)) el.style.removeProperty(name);
  };
  watchEffect(() => {
    const next = vars() ?? {};
    clear(next);
    for (const el of elements) for (const [name, value] of Object.entries(next)) el.style.setProperty(name, value);
    applied = Object.keys(next);
  });
  onScopeDispose(() => clear());
}
