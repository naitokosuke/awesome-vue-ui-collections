import type { Library, LibraryMeta, LibraryModule } from './types'

const metas = import.meta.glob<LibraryMeta>('./*/meta.ts', { eager: true, import: 'meta' })
const loaders = import.meta.glob<LibraryModule>('./*/index.ts')

/** Column order; libraries not listed here are appended alphabetically. */
const ORDER = [
  'vuetify',
  'element-plus',
  'naive-ui',
  'quasar',
  'arco-design-vue',
  'tdesign',
  'vant',
  'nuxt-ui',
  'shadcn-vue',
  'inspira-ui',
  'varlet',
  'bootstrap-vue-next',
  'oruga',
  'primevue',
  'vize-ui',
  'reka-ui',
  'vuetify0',
]

const KINDS: LibraryMeta['kind'][] = ['styled', 'headless']

const rank = (id: string) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length)

/** Grouped by kind (styled first), then in ORDER. */
export const libraries: Library[] = Object.values(metas)
  .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || rank(a.id) - rank(b.id) || a.id.localeCompare(b.id))
  .map((meta) => ({ ...meta, load: meta.withoutDemos ? null : loaders[`./${meta.id}/index.ts`]! }))
