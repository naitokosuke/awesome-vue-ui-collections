import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'bootstrap-vue-next',
  name: 'BootstrapVue Next',
  package: 'bootstrap-vue-next',
  kind: 'styled',
  components: {
    button: { name: 'BButton', docs: 'https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/button' },
    input: { name: 'BFormInput', docs: 'https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-input' },
    select: { name: 'BFormSelect', docs: 'https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-select' },
    // A checkbox in switch style; there is no separate switch component.
    switch: { name: 'BFormCheckbox', docs: 'https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-checkbox' },
    dialog: { name: 'BModal', docs: 'https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/modal' },
  },
  cssMatch: ['/node_modules/bootstrap/', '/node_modules/bootstrap-vue-next/'],
  // No darkAttrs: Bootstrap's `[data-bs-theme=dark]` becomes a descendant selector
  // after scoping, so Demos.vue puts `data-bs-theme` on its own wrapper and on the modal.
}
