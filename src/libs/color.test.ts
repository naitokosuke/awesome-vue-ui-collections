import { describe, expect, test } from "vite-plus/test";
import {
  contrast,
  hexToRgb,
  luminance,
  mix,
  readableOn,
  rgbChannels,
  rgbToHex,
  shade,
  tint,
  wantsDarkText,
} from "./color";
import { COLORS, DARK_COLORS } from "./types";

describe("color", () => {
  test("converts between hex and rgb", () => {
    expect(hexToRgb("#2563eb")).toEqual([37, 99, 235]);
    expect(rgbToHex([37, 99, 235])).toBe("#2563eb");
    expect(rgbToHex([0.4, 254.6, 16])).toBe("#00ff10");
    expect(rgbChannels("#2563eb")).toBe("37, 99, 235");
  });

  test("mixes like color-mix(in srgb)", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(tint("#2563eb", 0)).toBe("#2563eb");
    expect(tint("#2563eb", 1)).toBe("#ffffff");
    expect(shade("#2563eb", 1)).toBe("#000000");
  });

  test("computes WCAG luminance and contrast", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBe(1);
    expect(contrast("#000000", "#ffffff")).toBe(21);
    expect(contrast("#ffffff", "#000000")).toBe(21);
    expect(contrast("#2563eb", "#2563eb")).toBe(1);
  });

  test("picks the more readable text color", () => {
    expect(wantsDarkText("#ffffff")).toBe(true);
    expect(wantsDarkText("#ffff00")).toBe(true);
    expect(wantsDarkText(COLORS.black)).toBe(false);
    // Green and orange read slightly better with dark text, but keep white like the styled libraries.
    expect(wantsDarkText(COLORS.green)).toBe(false);
    expect(wantsDarkText(COLORS.orange)).toBe(false);
    expect(readableOn("#ffffff")).toBe("#18181b");
    expect(readableOn(COLORS.black)).toBe("#ffffff");
  });

  test("gives white text on every shared primary color", () => {
    // The styled adapters put white on the primary (Astryx, Oruga); keep it at least 3:1 (large text / UI).
    for (const hex of [...Object.values(COLORS), ...Object.values(DARK_COLORS)]) {
      expect(contrast(hex, "#ffffff"), hex).toBeGreaterThanOrEqual(3);
    }
  });

  test("keeps every primary color visible on a dark background", () => {
    // Element Plus's dark background; the other libraries' are as dark or darker.
    for (const hex of Object.values(COLORS)) {
      const shown = DARK_COLORS[hex] ?? hex;
      expect(contrast(shown, "#141414"), `${hex} shown as ${shown}`).toBeGreaterThanOrEqual(3);
    }
  });
});
