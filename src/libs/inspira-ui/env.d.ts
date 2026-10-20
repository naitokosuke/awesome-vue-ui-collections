// Nuxt's `import.meta.client`, which the copied components (animated-modal) read.
// Plain Vite doesn't define it, so at runtime it is `undefined` and those code paths are skipped.
interface ImportMeta {
  readonly client?: boolean;
}
