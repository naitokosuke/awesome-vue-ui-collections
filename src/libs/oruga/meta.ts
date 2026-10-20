import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'oruga',
  name: 'Oruga',
  package: '@oruga-ui/oruga-next',
  kind: 'styled',
  // oruga-next ships no CSS; the look comes from @oruga-ui/theme-oruga
  cssMatch: ['/node_modules/@oruga-ui/'],
  // theme-oruga has no dark mode; ./dark.css remaps its tokens on this attribute
  darkAttrs: { 'data-theme': 'dark' },
}
