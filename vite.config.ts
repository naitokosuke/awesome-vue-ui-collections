import { globSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ui from "@nuxt/ui/vite";
import { defineConfig } from "@vizejs/vite-plugin/vite-plus";
import Icons from "unplugin-icons/vite";
import { lazyPlugins } from "vite-plus";
import { npmStats } from "./build/npm-stats.ts";
import { scopeLibraryCss } from "./build/scope-library-css.ts";
import type { LibraryMeta } from "./src/libs/types.ts";

const metas: LibraryMeta[] = await Promise.all(
  globSync("src/libs/*/meta.ts").map(async (file) => (await import(pathToFileURL(file).href)).meta),
);

/** Components a library's CLI copied in (shadcn-vue, Inspira UI, …), kept as upstream wrote them. */
const vendored = "src/libs/*/ui/**";

/** Shared by Oxfmt (TS/JSON/CSS…) and Vize (`.vue`), so both write the same style. */
const style = {
  printWidth: 120,
  semi: true,
  singleQuote: false,
  quoteProps: "consistent",
  trailingComma: "all",
} as const;

// Vize's Vite+ helper adds its Vue compiler plugin and splits the work with Vite+'s own tools:
// `.vue` files are formatted by Vize (Oxfmt skips them) and linted by Vize's Patina alongside
// Oxlint, with Oxlint's overlapping `vue/*` rules turned off. `vp run check` runs all of it,
// plus `vize check` for types.
export default defineConfig({
  // Nuxt UI ships its components as `.vue` files, so node_modules isn't excluded.
  compiler: { exclude: [] },
  typecheck: true,
  lint: {
    vue: {
      preset: "happy-path",
      // Flags component props such as `<n-space align>` as deprecated HTML attributes.
      rules: { "html/deprecated-attr": "off" },
    },
    ignorePatterns: ["dist/**", vendored],
  },
  fmt: {
    ...style,
    vue: style,
    ignorePatterns: ["dist/**", "pnpm-lock.yaml", vendored],
  },
  run: {
    tasks: {
      build: { command: "vp run typecheck && vp build", cache: false },
    },
  },
  plugins: lazyPlugins(() => [
    // Iconify icons as Vue components (`~icons/<set>/<name>`), inlined at build time.
    Icons({ compiler: "vue3" }),
    // Nuxt UI (Tailwind CSS v4 + auto-imported `U*` components). Its CSS is scoped like any other library.
    ui({ colorMode: false, router: false, dts: false, autoImport: false }),
    scopeLibraryCss(metas.map(({ id, cssMatch }) => ({ id, match: cssMatch }))),
    npmStats(metas.flatMap((meta) => meta.package ?? [])),
    {
      // `metas` is read once at startup (CSS scoping, npm stats), so adding, editing or
      // removing a library's meta.ts needs a dev-server restart to take effect.
      name: "restart-on-library-meta-change",
      configureServer(server) {
        server.watcher.add("src/libs/*/meta.ts");
        server.watcher.on("all", (event, file) => {
          if (event !== "addDir" && event !== "unlinkDir" && /[/\\]src[/\\]libs[/\\][^/\\]+[/\\]meta\.ts$/.test(file)) {
            server.restart();
          }
        });
      },
    },
  ]),
  define: {
    // Inspira UI's components are written for Nuxt and gate browser-only code on this flag.
    "import.meta.client": "true",
  },
  optimizeDeps: {
    // Adapters are lazy-loaded; scan them up front so the dev server doesn't
    // re-optimize mid-load and end up with two copies of Vue.
    entries: ["index.html", "src/libs/*/index.ts"],
  },
  css: {
    transformer: "lightningcss",
  },
}).withVue({
  // Upstream markup such as Inspira UI's <div> inside <button>; Vize lints it but can't skip it entirely.
  entries: [{ files: [vendored], linter: { rules: { "vue/permitted-contents": "off" } } }],
});
