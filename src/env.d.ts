declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

declare module "virtual:npm-stats" {
  import type { NpmStats } from "../build/npm-stats.ts";
  const stats: NpmStats;
  export default stats;
}

declare module "virtual:installed-versions" {
  /** Installed version by package name; packages that aren't installed are missing. */
  const versions: Record<string, string>;
  export default versions;
}

declare module "virtual:naive-ui-preflight.css";
