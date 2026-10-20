import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'element-plus',
  name: 'Element Plus',
  package: 'element-plus',
  kind: 'styled',
  cssMatch: ['/node_modules/element-plus/'],
  // theme-chalk/dark/css-vars.css targets `html.dark`
  darkAttrs: { class: 'dark' },
}
