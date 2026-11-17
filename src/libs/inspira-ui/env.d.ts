// Nuxt's `import.meta.client`, which the copied components (animated-modal) read; vite.config.ts
// defines it as `true`. Vize's content mapper declares it in every .vue file as below, and
// declarations of one property must match exactly.
interface ImportMeta {
  client: boolean;
}
