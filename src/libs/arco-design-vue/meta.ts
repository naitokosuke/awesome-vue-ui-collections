import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'arco-design-vue',
  name: 'Arco Design Vue',
  package: '@arco-design/web-vue',
  kind: 'styled',
  components: {
    button: { name: 'AButton', docs: 'https://arco.design/vue/en-US/component/button' },
    input: { name: 'AInput', docs: 'https://arco.design/vue/en-US/component/input' },
    select: { name: 'ASelect', docs: 'https://arco.design/vue/en-US/component/select' },
    switch: { name: 'ASwitch', docs: 'https://arco.design/vue/en-US/component/switch' },
    dialog: { name: 'AModal', docs: 'https://arco.design/vue/en-US/component/modal' },
  },
  cssMatch: ['/node_modules/@arco-design/web-vue/'],
  // dist/arco.css switches its tokens on `body[arco-theme='dark']`
  darkAttrs: { 'arco-theme': 'dark' },
}
