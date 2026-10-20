import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'arco-design-vue',
  name: 'Arco Design Vue',
  package: '@arco-design/web-vue',
  kind: 'styled',
  cssMatch: ['/node_modules/@arco-design/web-vue/'],
  // dist/arco.css switches its tokens on `body[arco-theme='dark']`
  darkAttrs: { 'arco-theme': 'dark' },
}
