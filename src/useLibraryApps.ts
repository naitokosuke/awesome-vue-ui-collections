import { onBeforeUnmount, onMounted, reactive, readonly, watch } from "vue";
import { libraries } from "./libs";
import type { DemoKey, Kind, Library, LibraryModule } from "./libs/types";
import { controls } from "./store";

/**
 * Loads and mounts each library's app into the cells and overlay host the shell renders for
 * it, the first time its tab is shown, and unmounts them all with the calling component.
 * Bind `setCell` / `setOverlay` as function refs on those elements.
 */
export function useLibraryApps(activeKind: () => Kind) {
  /** Version of each mounted library, by id. */
  const versions = reactive<Record<string, string>>({});
  /** Why a library failed to load or mount, by id. */
  const errors = reactive<Record<string, string>>({});

  const cells: Record<string, Partial<Record<DemoKey, HTMLElement>>> = {};
  const overlays: Record<string, HTMLElement> = {};
  const started = new Set<string>();
  const unmounts: (() => void)[] = [];
  let disposed = false;

  function setCell(libId: string, demo: DemoKey, el: unknown) {
    if (el instanceof HTMLElement) (cells[libId] ??= {})[demo] = el;
  }

  function setOverlay(libId: string, el: unknown) {
    if (el instanceof HTMLElement) overlays[libId] = el;
  }

  async function start(lib: Library, load: () => Promise<LibraryModule>) {
    started.add(lib.id);
    try {
      const mod = await load();
      // The shell went away while the module was loading (e.g. hot reload): its cells are gone too.
      if (disposed) return;
      unmounts.push(
        mod.mount({
          cells: cells[lib.id] as Record<DemoKey, HTMLElement>,
          overlay: overlays[lib.id]!,
          controls: readonly(controls),
        }),
      );
      versions[lib.id] = mod.version;
    } catch (error) {
      errors[lib.id] = String(error);
      console.error(`[${lib.id}]`, error);
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
    unmounts.forEach((unmount) => unmount());
  });

  return { versions: readonly(versions), errors: readonly(errors), setCell, setOverlay };
}
