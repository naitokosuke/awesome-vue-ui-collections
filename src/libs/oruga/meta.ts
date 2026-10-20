import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'oruga',
  name: 'Oruga',
  package: '@oruga-ui/oruga-next',
  kind: 'styled',
  // oruga-next ships no CSS; the look comes from @oruga-ui/theme-oruga
  components: {
    button: { name: 'OButton', docs: 'https://oruga-ui.com/components/Button.html' },
    input: { name: 'OInput', docs: 'https://oruga-ui.com/components/Input.html' },
    select: { name: 'OSelect', docs: 'https://oruga-ui.com/components/Select.html' },
    switch: { name: 'OSwitch', docs: 'https://oruga-ui.com/components/Switch.html' },
    dialog: { name: 'ODialog', docs: 'https://oruga-ui.com/components/Dialog.html' },
  },
  cssMatch: ['/node_modules/@oruga-ui/'],
  // theme-oruga has no dark mode; ./dark.css remaps its tokens on this attribute
  darkAttrs: { 'data-theme': 'dark' },
}
