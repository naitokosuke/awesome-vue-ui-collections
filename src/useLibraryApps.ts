import {
  computed,
  type EffectScope,
  effectScope,
  getCurrentScope,
  onBeforeUnmount,
  onMounted,
  reactive,
  readonly,
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
      controls.color && controls.dark ? (DARK_COLORS[controls.color] ?? controls.color) : controls.color,
    ),
  }),
);

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
  /** Why a library failed to load or mount, or its first error after mounting, by id. */
  const errors = reactive<Record<string, string>>({});

  const cells: Record<string, Partial<Record<DemoKey, HTMLElement>>> = {};
  const overlays: Record<string, HTMLElement> = {};
  const started = new Set<string>();
  const mounted = new Set<string>();
  /** One per mounted library; stopping it unmounts the library. */
  const scopes: EffectScope[] = [];
  /** The calling component's scope, so watchers made later still stop with it. */
  const ownScope = getCurrentScope();
  let disposed = false;

  function setCell(lib: Library, demo: DemoKey, el: unknown) {
    if (!(el instanceof HTMLElement)) return;
    const libCells = (cells[lib.id] ??= {});
    if (mounted.has(lib.id) && libCells[demo] !== el) {
      fail(lib, new Error(`The shell replaced the ${demo} cell after the library mounted into it`));
    }
    libCells[demo] = el;
  }

  function setOverlay(lib: Library, el: unknown) {
    if (!(el instanceof HTMLElement)) return;
    if (mounted.has(lib.id) && overlays[lib.id] !== el) {
      fail(lib, new Error("The shell replaced the overlay host after the library mounted into it"));
    }
    overlays[lib.id] = el;
  }

  function fail(lib: Library, error: unknown) {
    errors[lib.id] ??= String(error);
    console.error(`[${lib.id}]`, error);
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
    started.add(lib.id);
    delete errors[lib.id];
    let mod: LibraryModule;
    try {
      mod = await load();
    } catch (error) {
      // E.g. a chunk gone after a deploy: tried again the next time its tab is shown.
      started.delete(lib.id);
      fail(lib, error);
      return;
    }
    // Its tab may have been switched away from while the module was loading.
    await shown(lib.kind);
    // The shell went away meanwhile (e.g. hot reload): its cells are gone too.
    if (disposed) return;
    // Detached: the library's watchers belong to it, not to whatever scope is active.
    const scope = effectScope(true);
    try {
      scope.run(() => mod.mount({ ...targetOf(lib), controls: libraryControls, reportError: (e) => fail(lib, e) }));
    } catch (error) {
      // Undo whatever it got through before failing.
      scope.stop();
      fail(lib, error);
      return;
    }
    scopes.push(scope);
    mounted.add(lib.id);
  }

  onMounted(() => {
    // `post`: the tab's table is shown (v-show) before its libraries mount into it.
    watch(
      activeKind,
      (kind) => {
        for (const lib of libraries) {
          if (lib.kind === kind && lib.load && !started.has(lib.id)) start(lib, lib.load);
        }
      },
      { immediate: true, flush: "post" },
    );
  });

  onBeforeUnmount(() => {
    disposed = true;
    scopes.forEach((scope) => scope.stop());
  });

  return { errors: readonly(errors), setCell, setOverlay };
}
