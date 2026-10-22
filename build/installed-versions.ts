import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite-plus";

const MODULE_ID = "virtual:installed-versions";

/**
 * Exposes the installed version of each given package as `virtual:installed-versions`, read from
 * its package.json on disk: many libraries neither export their version nor list package.json
 * in `exports`. A package that isn't installed (e.g. a stats-only library) is left out.
 */
export function installedVersions(packages: string[]): Plugin {
  let root = process.cwd();
  return {
    name: "installed-versions",
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === MODULE_ID) return `\0${MODULE_ID}`;
    },
    load(id) {
      if (id !== `\0${MODULE_ID}`) return;
      const versions: Record<string, string> = {};
      for (const name of packages) {
        const file = join(root, "node_modules", name, "package.json");
        if (!existsSync(file)) continue;
        // Reinstalling a package reloads the module in dev.
        this.addWatchFile(file);
        versions[name] = JSON.parse(readFileSync(file, "utf8")).version;
      }
      return `export default ${JSON.stringify(versions)}`;
    },
  };
}
