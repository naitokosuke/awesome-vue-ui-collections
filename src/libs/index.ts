import { KINDS, type Library, type LibraryMeta, type LibraryModule } from "./types";

const metas = import.meta.glob<LibraryMeta>("./*/meta.ts", { eager: true, import: "meta" });
const loaders = import.meta.glob<LibraryModule>("./*/index.ts");
const logos = import.meta.glob<string>("./*/logo.{svg,png,ico}", { eager: true, import: "default", query: "?url" });

/** Grouped by kind (in KINDS order), then by each meta's `order`. */
export const libraries: Library[] = Object.values(metas)
  .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.order - b.order || a.id.localeCompare(b.id))
  .map((meta) => {
    const logo = Object.entries(logos).find(([path]) => path.startsWith(`./${meta.id}/logo.`))?.[1] ?? null;
    if (meta.withoutDemos) return { ...meta, load: null, logo };
    // A library has demos unless its meta says why not: a missing index.ts is a mistake, not a stats-only entry.
    const load = loaders[`./${meta.id}/index.ts`];
    if (!load) throw new Error(`src/libs/${meta.id}/index.ts is missing (or give its meta a withoutDemos reason)`);
    return { ...meta, load, logo };
  });
