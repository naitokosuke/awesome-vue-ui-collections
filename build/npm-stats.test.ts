import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { getJson, githubRepository, mapLimit } from "./npm-stats.ts";

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
    ["https://GitHub.com/vuejs/core", "vuejs/core"],
    ["git+ssh://git@github.com/vuejs/core.git", "vuejs/core"],
    ["github:vuejs/core#main", "vuejs/core"],
    ["vuejs/core#v3.5.0", "vuejs/core"],
  ])("%s → %s", (url, slug) => {
    expect(githubRepository({ type: "git", url })).toEqual({ slug, url: `https://github.com/${slug}` });
    expect(githubRepository(url)).toEqual({ slug, url: `https://github.com/${slug}` });
  });

  test("is null for anything that isn't a GitHub repository", () => {
    expect(githubRepository(undefined)).toBeNull();
    expect(githubRepository({})).toBeNull();
    expect(githubRepository("https://gitlab.com/owner/repo.git")).toBeNull();
    expect(githubRepository("not a url")).toBeNull();
    expect(githubRepository("https://notgithub.com/owner/repo")).toBeNull();
    expect(githubRepository("https://github.com.evil.example/owner/repo")).toBeNull();
    expect(githubRepository("gitlab:owner/repo")).toBeNull();
  });
});

describe("getJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const respond = (...responses: (Response | Error)[]) => {
    const fetch = vi.fn(async () => {
      const next = responses.shift()!;
      if (next instanceof Error) throw next;
      return next;
    });
    vi.stubGlobal("fetch", fetch);
    return fetch;
  };

  test("retries network errors, 429 and 5xx, then succeeds", async () => {
    const fetch = respond(new TypeError("fetch failed"), new Response(null, { status: 503 }), Response.json({ ok: 1 }));
    await expect(getJson("https://example.test/a", 0)).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test("gives up after two retries", async () => {
    const fetch = respond(...[1, 2, 3].map(() => new Response(null, { status: 429 })));
    await expect(getJson("https://example.test/a", 0)).rejects.toThrow("429");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test("doesn't retry a 404", async () => {
    const fetch = respond(new Response(null, { status: 404 }));
    await expect(getJson("https://example.test/a", 0)).rejects.toThrow("404");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("mapLimit", () => {
  test("keeps at most `limit` calls in flight and the input order", async () => {
    let inFlight = 0;
    let peak = 0;
    const result = await mapLimit([5, 1, 4, 2, 3, 0, 6], 3, async (n) => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, n));
      inFlight--;
      return n * 10;
    });
    expect(result).toEqual([50, 10, 40, 20, 30, 0, 60]);
    expect(peak).toBe(3);
  });
});
