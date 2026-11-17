import { describe, expect, test } from "vite-plus/test";
import { COLORS, DEMOS } from "./libs/types";
import { parseControls } from "./store";

const noneDisabled = Object.fromEntries(DEMOS.map((demo) => [demo, false]));

describe("parseControls", () => {
  test("keeps every valid field", () => {
    const saved = {
      size: "large",
      disabled: { ...noneDisabled, select: true },
      dark: true,
      stats: false,
      label: "Save",
      kind: "headless",
      color: COLORS.rose,
    };
    expect(parseControls(saved)).toEqual(saved);
  });

  test("drops invalid fields, so they keep their defaults", () => {
    expect(
      parseControls({ size: "huge", dark: "yes", stats: 1, label: 42, kind: "fancy-ish", color: "#123456" }),
    ).toEqual({});
  });

  test("accepts null as the color (each library's own)", () => {
    expect(parseControls({ color: null })).toEqual({ color: null });
  });

  test("reads per-row `disabled`, and turns the old single boolean into all rows enabled", () => {
    expect(parseControls({ disabled: { button: true, input: "yes", unknown: true } }).disabled).toEqual({
      ...noneDisabled,
      button: true,
    });
    expect(parseControls({ disabled: true })).toEqual({});
  });

  test("reads the column order per tab, and drops a tab whose order isn't a list of ids", () => {
    expect(parseControls({ order: { styled: ["vuetify", "quasar"], headless: "reka-ui", nope: ["x"] } })).toEqual({
      order: { styled: ["vuetify", "quasar"] },
    });
    expect(parseControls({ order: { fancy: ["vue-bits", 1] } })).toEqual({ order: {} });
    expect(parseControls({ order: ["vuetify"] })).toEqual({});
  });

  test("ignores anything that isn't an object", () => {
    for (const saved of [null, undefined, 1, "x", []]) expect(parseControls(saved)).toEqual({});
  });
});
