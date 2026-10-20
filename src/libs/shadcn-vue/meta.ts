import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'shadcn-vue',
  name: 'shadcn-vue',
  // Components are copied into the project (./ui); `shadcn-vue` is the CLI that generates them,
  // so its npm stats stand in for the library's.
  package: 'shadcn-vue',
  kind: 'styled',
  // The Tailwind entry compiled by @tailwindcss/vite
  cssMatch: ['/src/libs/shadcn-vue/style.css'],
  // shadcn's `.dark { --* }` tokens and the `dark:` variant
  darkAttrs: { class: 'dark' },
}
