import {
  computed,
  type EffectScope,
  effectScope,
  getCurrentScope,
  onBeforeUnmount,
  onMounted,
  reactive,
  readonly,
  shallowReactive,
  toRefs,
  watch,
} from "vue";
import { libraries } from "./libs";
import {
  DARK_COLORS,
  DEMOS,
  type DemoKey,
  type Kind,
  type Library,
  type LibraryModule,
  type MountContext,
} from "./libs/types";
import { controls } from "./store";

/** The shell's controls as every library reads them: live, read-only, and the color as shown in the current mode. */
const libraryControls: MountContext["controls"] = readonly(
  reactive({
    ...toRefs(controls),
    color: computed(() =>
      controls.color && controls.isDark ? (DARK_COLORS[controls.color] ?? controls.color) : controls.color,
    ),
  }),
);

/** Where one library is in its lifecycle. */
type LibraryState =
  /** Its tab hasn't been shown yet. */
  | { status: "idle" }
  /** Its module is loading, or loaded and waiting for its tab to be shown again. */
  | { status: "loading" }
  /** Its module failed to load (e.g. a chunk gone after a deploy). */
  | { status: "load-failed"; error: string }
  /** Its `mount()` is running in `scope`; `error` is the first one it reported meanwhile. */
  | { status: "mounting"; scope: EffectScope; error?: string }
  /** Its app runs in `scope`; `error` is the first one it reported. */
  | { status: "mounted"; scope: EffectScope; error?: string }
  /** Its `mount()` threw; whatever it got through was undone. */
  | { status: "mount-failed"; error: string };

/** A failed load is tried again the next time its tab is shown; a failed mount isn't. */
function canStart(state: LibraryState) {
  return state.status === "idle" || state.status === "load-failed";
}

/**
 * Loads and mounts each library's app into the cells and overlay host the shell renders for
 * it, the first time its tab is shown, and unmounts them all with the calling component.
 * Bind `setCell` / `setOverlay` as function refs on those elements.
 *
 * The shell must keep those elements for as long as it's mounted (all tables stay rendered,
 * hidden with v-show): a library teleports into them once and never follows a replacement.
 * A replaced cell is reported as that library's error rather than leaving its demos detached.
 */
export function useLibraryApps(activeKind: () => Kind) {
  /** By library id. Shallow: each state is replaced on every transition, never changed in place. */
  const states = shallowReactive<Record<string, LibraryState>>(
    Object.fromEntries(libraries.filter((lib) => lib.load).map((lib) => [lib.id, { status: "idle" }])),
  );

  /** Why a library failed to load or mount, or its first error after mounting, by id. */
  const errors = computed<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(states).flatMap(([id, state]) =>
        "error" in state && state.error ? [[id, state.error] as const] : [],
      ),
    ),
  );

  function isLoading(lib: Library) {
    const { status } = states[lib.id];
    return status === "idle" || status === "loading" || status === "mounting";
  }

  const cells: Record<string, Partial<Record<DemoKey, HTMLElement>>> = {};
  const overlays: Record<string, HTMLElement> = {};
  /** The calling component's scope, so watchers made later still stop with it. */
  const ownScope = getCurrentScope();
  let disposed = false;

  const isMounted = (lib: Library) => states[lib.id].status === "mounted";

  function setCell(lib: Library, demo: DemoKey, el: unknown) {
    if (!(el instanceof HTMLElement)) return;
    const libCells = (cells[lib.id] ??= {});
    if (isMounted(lib) && libCells[demo] !== el) {
      reportError(lib, new Error(`The shell replaced the ${demo} cell after the library mounted into it`));
    }
    libCells[demo] = el;
  }

  function setOverlay(lib: Library, el: unknown) {
    if (!(el instanceof HTMLElement)) return;
    if (isMounted(lib) && overlays[lib.id] !== el) {
      reportError(lib, new Error("The shell replaced the overlay host after the library mounted into it"));
    }
    overlays[lib.id] = el;
  }

  function describe(lib: Library, error: unknown) {
    console.error(`[${lib.id}]`, error);
    return String(error);
  }

  /** Keeps the first error a library reports while (or after) mounting. */
  function reportError(lib: Library, error: unknown) {
    const message = describe(lib, error);
    const state = states[lib.id];
    if ((state.status === "mounting" || state.status === "mounted") && !state.error) {
      states[lib.id] = { ...state, error: message };
    }
  }

  /** The elements the shell rendered for `lib`; every demo row needs a cell. */
  function targetOf(lib: Library): Pick<MountContext, "cells" | "overlay"> {
    const libCells = cells[lib.id] ?? {};
    const missing = DEMOS.filter((demo) => !libCells[demo]);
    const overlay = overlays[lib.id];
    if (missing.length > 0 || !overlay) {
      throw new Error(`The shell rendered no ${[...missing, ...(overlay ? [] : ["overlay"])].join(", ")} for it`);
    }
    return { cells: libCells as Record<DemoKey, HTMLElement>, overlay };
  }

  /** Resolves once `kind`'s table is shown, so a library mounts (and measures itself) while visible. */
  function shown(kind: Kind) {
    if (activeKind() === kind) return Promise.resolve();
    return new Promise<void>((resolve) => {
      ownScope!.run(() => {
        const stop = watch(
          activeKind,
          (active) => {
            if (active !== kind) return;
            stop();
            resolve();
          },
          { flush: "post" },
        );
      });
    });
  }

  async function start(lib: Library, load: () => Promise<LibraryModule>) {
    states[lib.id] = { status: "loading" };
    let mod: LibraryModule;
    try {
      mod = await load();
    } catch (error) {
      states[lib.id] = { status: "load-failed", error: describe(lib, error) };
      return;
    }
    // Its tab may have been switched away from while the module was loading.
    await shown(lib.kind);
    // The shell went away meanwhile (e.g. hot reload): its cells are gone too.
    if (disposed) return;
    // Detached: the library's watchers belong to it, not to whatever scope is active.
    const scope = effectScope(true);
    states[lib.id] = { status: "mounting", scope };
    try {
      scope.run(() =>
        mod.mount({ ...targetOf(lib), controls: libraryControls, reportError: (error) => reportError(lib, error) }),
      );
    } catch (error) {
      // Undo whatever it got through before failing.
      scope.stop();
      states[lib.id] = { status: "mount-failed", error: describe(lib, error) };
      return;
    }
    const mounting = states[lib.id];
    if (mounting.status === "mounting") states[lib.id] = { ...mounting, status: "mounted" };
  }

  onMounted(() => {
    // `post`: the tab's table is shown (v-show) before its libraries mount into it.
    watch(
      activeKind,
      (kind) => {
        for (const lib of libraries) {
          if (lib.kind === kind && lib.load && canStart(states[lib.id])) start(lib, lib.load);
        }
      },
      { immediate: true, flush: "post" },
    );
  });

  onBeforeUnmount(() => {
    disposed = true;
    for (const state of Object.values(states)) if (state.status === "mounted") state.scope.stop();
  });

  return { isLoading, errors, setCell, setOverlay };
}
