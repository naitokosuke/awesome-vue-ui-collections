import { describe, expect, test } from "vite-plus/test";
import { githubRepository } from "./npm-stats.ts";

describe("githubRepository", () => {
  test.each([
    ["git+https://github.com/vuejs/core.git", "vuejs/core"],
    ["https://github.com/element-plus/element-plus", "element-plus/element-plus"],
    ["git@github.com:tusen-ai/naive-ui.git", "tusen-ai/naive-ui"],
    ["https://github.com/unovue/reka-ui/tree/main/packages/core", "unovue/reka-ui"],
    ["https://github.com/vuetifyjs/vuetify#readme", "vuetifyjs/vuetify"],
    ["github:quasarframework/quasar", "quasarframework/quasar"],
    ["varletjs/varlet", "varletjs/varlet"],
    ["git+https://github.com/bootstrap-vue-next/bootstrap-vue-next.js.git", "bootstrap-vue-next/bootstrap-vue-next.js"],
  ])("%s → %s", (url, slug) => {
    expect(githubRepository({ type: "git", url })).toEqual({ slug, url: `https://github.com/${slug}` });
    expect(githubRepository(url)).toEqual({ slug, url: `https://github.com/${slug}` });
  });

  test("is null for anything that isn't a GitHub repository", () => {
    expect(githubRepository(undefined)).toBeNull();
    expect(githubRepository({})).toBeNull();
    expect(githubRepository("https://gitlab.com/owner/repo.git")).toBeNull();
    expect(githubRepository("not a url")).toBeNull();
  });
});
