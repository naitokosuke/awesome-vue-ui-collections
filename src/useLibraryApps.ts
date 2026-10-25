import { type EffectScope, effectScope, onBeforeUnmount, onMounted, reactive, readonly, watch } from "vue";
import { libraries } from "./libs";
import type { DemoKey, Kind, Library, LibraryModule } from "./libs/types";
import { controls } from "./store";

/**
 * Loads and mounts each library's app into the cells and overlay host the shell renders for
 * it, the first time its tab is shown, and unmounts them all with the calling component.
 * Bind `setCell` / `setOverlay` as function refs on those elements.
 */
export function useLibraryApps(activeKind: () => Kind) {
  /** Why a library failed to load or mount, or its first error after mounting, by id. */
  const errors = reactive<Record<string, string>>({});

  const cells: Record<string, Partial<Record<DemoKey, HTMLElement>>> = {};
  const overlays: Record<string, HTMLElement> = {};
  const started = new Set<string>();
  /** One per mounted library; stopping it unmounts the library. */
  const scopes: EffectScope[] = [];
  let disposed = false;

  function setCell(libId: string, demo: DemoKey, el: unknown) {
    if (el instanceof HTMLElement) (cells[libId] ??= {})[demo] = el;
  }

  function setOverlay(libId: string, el: unknown) {
    if (el instanceof HTMLElement) overlays[libId] = el;
  }

  function fail(lib: Library, error: unknown) {
    errors[lib.id] ??= String(error);
    console.error(`[${lib.id}]`, error);
  }

  async function start(lib: Library, load: () => Promise<LibraryModule>) {
    started.add(lib.id);
    try {
      const mod = await load();
      // The shell went away while the module was loading (e.g. hot reload): its cells are gone too.
      if (disposed) return;
      // Detached: the library's watchers belong to it, not to whatever scope is active.
      const scope = effectScope(true);
      try {
        scope.run(() =>
          mod.mount({
            cells: cells[lib.id] as Record<DemoKey, HTMLElement>,
            overlay: overlays[lib.id]!,
            controls: readonly(controls),
            reportError: (error) => fail(lib, error),
          }),
        );
      } catch (error) {
        // Undo whatever it got through before failing.
        scope.stop();
        throw error;
      }
      scopes.push(scope);
    } catch (error) {
      fail(lib, error);
    }
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
