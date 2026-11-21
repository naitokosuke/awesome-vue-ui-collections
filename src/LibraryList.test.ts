/** The libraries page: every library under its kind, with the links from its metadata. */
import "./tokens.css";
import { expect, onTestFinished, test } from "vite-plus/test";
import { createApp } from "vue";
import { groups, KIND_LABELS } from "./board";
import LibraryList from "./LibraryList.vue";

function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp(LibraryList);
  app.mount(host);
  onTestFinished(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

test("lists every library under its kind, in the compare page's order", () => {
  const host = mount();
  const sections = [...host.querySelectorAll("section")];
  expect(sections.map((section) => section.querySelector("h2")!.firstChild!.textContent!.trim())).toEqual(
    groups.map((group) => KIND_LABELS[group.kind].name),
  );
  for (const [i, group] of groups.entries()) {
    const names = [...sections[i]!.querySelectorAll("tbody th")].map((th) => th.textContent!.trim());
    expect(names, group.kind).toEqual(group.columns.map((lib) => lib.name));
  }
});

test("links each library's docs, and GitHub where it's known", () => {
  const host = mount();
  const rows = [...host.querySelectorAll("tbody tr")];
  const libs = groups.flatMap((group) => group.columns);
  expect(rows).toHaveLength(libs.length);
  for (const [i, lib] of libs.entries()) {
    const hrefs = [...rows[i]!.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs, lib.id).toContain(lib.docs);
    if (lib.github) expect(hrefs, lib.id).toContain(lib.github.url);
  }
});

test("links each library's name to its column on the compare page", () => {
  const host = mount();
  const hrefs = [...host.querySelectorAll("tbody th a")].map((a) => a.getAttribute("href"));
  expect(hrefs).toEqual(groups.flatMap((group) => group.columns).map((lib) => `/?lib=${lib.id}`));
});

test("shows every library's logo (src/libs/<id>/logo.svg, .png or .ico)", () => {
  const host = mount();
  const libs = groups.flatMap((group) => group.columns);
  expect(
    libs.filter((lib) => !lib.logo).map((lib) => lib.id),
    "libraries without a logo file",
  ).toEqual([]);
  const srcs = [...host.querySelectorAll("tbody tr")].map((row) => row.querySelector(".logo img")?.getAttribute("src"));
  expect(srcs).toEqual(libs.map((lib) => lib.logo));
});

test("marks itself current in the top bar's navigation", () => {
  const host = mount();
  expect(host.querySelector("nav [aria-current=page]")!.textContent!.trim()).toBe("libraries");
});
