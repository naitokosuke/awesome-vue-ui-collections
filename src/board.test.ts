import { Temporal } from "temporal-polyfill-lite";
import { describe, expect, test } from "vite-plus/test";
import { ago, formatDownloads, isStale, orderColumns } from "./board";

const today = Temporal.PlainDate.from("2026-10-23");
const date = (iso: string) => Temporal.PlainDate.from(iso);

describe("ago", () => {
  test.each([
    ["2026-10-23", "today"],
    ["2026-10-22", "yesterday"],
    ["2026-09-23", "30 days ago"],
    // 31 days and more: calendar months.
    ["2026-09-22", "1 month ago"],
    ["2025-11-23", "11 months ago"],
    ["2024-10-24", "23 months ago"],
    // Two years and more: calendar years.
    ["2024-10-23", "2 years ago"],
    ["2020-01-01", "6 years ago"],
  ])("%s → %s", (released, expected) => {
    expect(ago(date(released), today)).toBe(expected);
  });
});

describe("isStale", () => {
  test("is true once a year has passed without a release", () => {
    expect(isStale(date("2025-10-23"), today)).toBe(false);
    expect(isStale(date("2025-10-22"), today)).toBe(true);
  });
});

describe("formatDownloads", () => {
  test.each([
    [950, "950"],
    [830_000, "830k"],
    [1_234_567, "1.2M"],
  ])("%d → %s", (count, expected) => {
    expect(formatDownloads(count)).toBe(expected);
  });
});

describe("orderColumns", () => {
  const columns = ["a", "b", "c", "d"].map((id) => ({ id }));
  const ids = (order?: string[]) => orderColumns(columns, order).map((column) => column.id);

  test("keeps the default order without a saved one", () => {
    expect(ids()).toEqual(["a", "b", "c", "d"]);
  });

  test("puts the saved ids first, then the rest in default order, skipping unknown ones", () => {
    expect(ids(["c", "gone", "a"])).toEqual(["c", "a", "b", "d"]);
  });
});
