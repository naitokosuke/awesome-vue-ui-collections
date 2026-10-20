import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'bootstrap-vue-next',
  name: 'BootstrapVue Next',
  package: 'bootstrap-vue-next',
  kind: 'styled',
  cssMatch: ['/node_modules/bootstrap/', '/node_modules/bootstrap-vue-next/'],
  // No darkAttrs: Bootstrap's `[data-bs-theme=dark]` becomes a descendant selector
  // after scoping, so Demos.vue puts `data-bs-theme` on its own wrapper and on the modal.
}
