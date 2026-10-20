import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'nuxt-ui',
  name: 'Nuxt UI',
  package: '@nuxt/ui',
  kind: 'styled',
  // The Tailwind entry compiled by @tailwindcss/vite
  cssMatch: ['/src/libs/nuxt-ui/style.css'],
  // Nuxt UI's `.dark { --ui-* }` tokens and Tailwind's `dark:` variant
  darkAttrs: { class: 'dark' },
}
