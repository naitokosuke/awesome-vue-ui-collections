// Same as @nuxt/ui's own `vue-plugin.d.ts`. `vize check` copies only the package's `dist/` into its
// virtual project (the package ships `.vue` sources), so that root-level file isn't found there.
declare module "@nuxt/ui/vue-plugin" {
  import type { Plugin } from "vue";
  const plugin: Plugin;
  export default plugin;
}
