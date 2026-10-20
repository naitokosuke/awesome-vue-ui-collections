import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'quasar',
  name: 'Quasar',
  package: 'quasar',
  kind: 'styled',
  cssMatch: ['/node_modules/quasar/', '/node_modules/@quasar/extras/'],
  // quasar.css styles dark mode via `body.body--dark ...`
  darkAttrs: { class: 'body--dark' },
}
