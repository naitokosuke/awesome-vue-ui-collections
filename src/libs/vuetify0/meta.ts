import type { LibraryMeta } from '../types.ts'

// Headless: @vuetify/v0 ships no CSS. The plain look lives in Demos.vue.
export const meta: LibraryMeta = {
  id: 'vuetify0',
  name: 'Vuetify0',
  package: '@vuetify/v0',
  kind: 'headless',
  cssMatch: [],
  // Demos.vue switches its own neutral tokens on this attribute
  darkAttrs: { 'data-theme': 'dark' },
}
