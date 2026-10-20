import { globSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import { npmStats } from './build/npm-stats.ts'
import { scopeLibraryCss } from './build/scope-library-css.ts'
import type { LibraryMeta } from './src/libs/types.ts'

const metas: LibraryMeta[] = await Promise.all(
  globSync('src/libs/*/meta.ts').map(async (file) => (await import(pathToFileURL(file).href)).meta),
)

export default defineConfig({
  plugins: [
    vue(),
    // Iconify icons as Vue components (`~icons/<set>/<name>`), inlined at build time.
    Icons({ compiler: 'vue3' }),
    // Nuxt UI (Tailwind CSS v4 + auto-imported `U*` components). Its CSS is scoped like any other library.
    ui({ colorMode: false, router: false, dts: false, autoImport: false }),
    scopeLibraryCss(metas.map(({ id, cssMatch }) => ({ id, match: cssMatch }))),
    npmStats(metas.flatMap((meta) => meta.package ?? [])),
    {
      // `metas` is read once at startup (CSS scoping, npm stats), so adding, editing or
      // removing a library's meta.ts needs a dev-server restart to take effect.
      name: 'restart-on-library-meta-change',
      configureServer(server) {
        server.watcher.add('src/libs/*/meta.ts')
        server.watcher.on('all', (event, file) => {
          if (event !== 'addDir' && event !== 'unlinkDir' && /[/\\]src[/\\]libs[/\\][^/\\]+[/\\]meta\.ts$/.test(file)) {
            server.restart()
          }
        })
      },
    },
  ],
  define: {
    // Inspira UI's components are written for Nuxt and gate browser-only code on this flag.
    'import.meta.client': 'true',
  },
  optimizeDeps: {
    // Adapters are lazy-loaded; scan them up front so the dev server doesn't
    // re-optimize mid-load and end up with two copies of Vue.
    entries: ['index.html', 'src/libs/*/index.ts'],
  },
  css: {
    transformer: 'lightningcss',
  },
})
