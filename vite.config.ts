import { globSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ui from "@nuxt/ui/vite";
import { defineConfig } from "@vizejs/vite-plugin/vite-plus";
import Icons from "unplugin-icons/vite";
import { lazyPlugins } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";
import { installedVersions } from "./build/installed-versions.ts";
import { naiveUiPreflight } from "./build/naive-ui-preflight.ts";
import { npmStats } from "./build/npm-stats.ts";
import { scopeLibraryCss } from "./build/scope-library-css.ts";
import type { LibraryMeta } from "./src/libs/types.ts";

// Node's ESM cache never evicts a module, so the mtime query makes a dev-server restart
// re-import an edited meta.ts instead of reusing the copy loaded at first start.
const metas: LibraryMeta[] = await Promise.all(
  globSync("src/libs/*/meta.ts").map(
    async (file) => (await import(`${pathToFileURL(file).href}?t=${statSync(file).mtimeMs}`)).meta,
  ),
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
      // Also check how components relate: provide/inject, reactivity passed between files, races.
      crossFile: true,
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
    naiveUiPreflight(),
    scopeLibraryCss(metas.map(({ id, cssMatch }) => ({ id, match: cssMatch }))),
    // Tests don't hit the npm registry: every package's stats are missing, as if the fetch had failed.
    npmStats(process.env.VITEST ? [] : metas.flatMap((meta) => meta.package ?? [])),
    installedVersions(metas.flatMap((meta) => meta.package ?? [])),
    {
      // `metas` is read once at startup (CSS scoping, npm stats), so adding, editing or
      // removing a library's meta.ts needs a dev-server restart (which re-reads them) to take effect.
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
    // A pre-bundled copy of Vitest's API wouldn't share the browser runner's state.
    exclude: ["vite-plus/test"],
  },
  css: {
    transformer: "lightningcss",
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["{build,src}/**/*.test.ts"],
          exclude: ["src/Shell.test.ts", "build/production-css.test.ts"],
          // Without a backing file, Node's localStorage only warns; store.ts copes with none at all.
          execArgv: ["--no-experimental-webstorage"],
        },
      },
      {
        extends: true,
        test: {
          // Builds the site for production, so it checks what is actually shipped.
          name: "build",
          include: ["build/production-css.test.ts"],
          hookTimeout: 300_000,
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/Shell.test.ts"],
          // In a real browser: what's tested is how every library's CSS and DOM side effects play out on one page.
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
          // Loading every library on a cold dev server takes a while.
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
}).withVue({
  entries: [
    {
      // Vize lints vendored components but can't skip them entirely; what it flags there is upstream's
      // to fix (Inspira UI's <div> inside <button>, Vue Bits' mouse-only handlers, unscoped styles, …).
      files: [vendored],
      linter: {
        rules: {
          "vue/permitted-contents": "off",
          "vue/attribute-order": "off",
          "vue/require-scoped-style": "off",
          "a11y/click-events-have-key-events": "off",
          "a11y/form-control-has-label": "off",
          "a11y/interactive-supports-focus": "off",
          "a11y/mouse-events-have-key-events": "off",
          "a11y/no-static-element-interactions": "off",
          // Cross-file: props read once as initial values (`defaultValue`, `defaultSelected`) on
          // purpose, state set after an await, and browser APIs in components that never run on a server.
          "croquis/cf/value-extraction-breaks-reactivity": "off",
          "croquis/cf/async-boundary": "off",
          "croquis/cf/browser-api-ssr": "off",
        },
      },
    },
    {
      // Headless demos style elements that never get the scoped attribute (portalled roots, v0's
      // fragment roots); those rules are written under `[data-lib]` by hand instead (see each file).
      files: ["src/libs/reka-ui/Demos.vue", "src/libs/vuetify0/Demos.vue"],
      linter: { rules: { "vue/require-scoped-style": "off" } },
    },
    {
      // Every href is built from meta.ts or from a GitHub slug matched by build/npm-stats.ts; none is user input.
      files: ["src/Shell.vue"],
      linter: { rules: { "vue/no-unsafe-url": "off" } },
    },
  ],
});
