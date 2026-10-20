import type { LibraryMeta } from '../types.ts'

// Headless: reka-ui ships no CSS. The plain look lives in Demos.vue.
export const meta: LibraryMeta = {
  id: 'reka-ui',
  name: 'Reka UI',
  package: 'reka-ui',
  kind: 'headless',
  components: {
    // Reka has no Button or Input primitive; the demos use plain elements.
    button: { name: 'native <button>' },
    input: { name: 'native <input>' },
    select: { name: 'Select', docs: 'https://reka-ui.com/docs/components/select' },
    switch: { name: 'Switch', docs: 'https://reka-ui.com/docs/components/switch' },
    dialog: { name: 'Dialog', docs: 'https://reka-ui.com/docs/components/dialog' },
  },
  cssMatch: [],
  // Demos.vue switches its own neutral tokens on this attribute
  darkAttrs: { 'data-theme': 'dark' },
}
