import type { LibraryMeta } from '../types.ts'

// Styles are injected at runtime by css-render, so there is no CSS file to scope.
export const meta: LibraryMeta = {
  id: 'naive-ui',
  name: 'Naive UI',
  package: 'naive-ui',
  kind: 'styled',
  components: {
    button: { name: 'NButton', docs: 'https://www.naiveui.com/en-US/os-theme/components/button' },
    input: { name: 'NInput', docs: 'https://www.naiveui.com/en-US/os-theme/components/input' },
    select: { name: 'NSelect', docs: 'https://www.naiveui.com/en-US/os-theme/components/select' },
    switch: { name: 'NSwitch', docs: 'https://www.naiveui.com/en-US/os-theme/components/switch' },
    dialog: { name: 'NModal', docs: 'https://www.naiveui.com/en-US/os-theme/components/modal' },
  },
  cssMatch: [],
}
