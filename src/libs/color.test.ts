import { describe, expect, test } from "vite-plus/test";
import { contrast, hexToRgb, isLight, luminance, mix, readableOn, rgbChannels, rgbToHex, shade, tint } from "./color";
import { COLORS } from "./types";

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
    expect(isLight("#ffffff")).toBe(true);
    expect(isLight("#ffff00")).toBe(true);
    expect(isLight(COLORS.black)).toBe(false);
    expect(readableOn("#ffffff")).toBe("#18181b");
    expect(readableOn(COLORS.black)).toBe("#ffffff");
  });

  test("gives white text on every shared primary color", () => {
    // The styled adapters put white on the primary (Astryx, Oruga); keep it at least 3:1 (large text / UI).
    for (const hex of Object.values(COLORS)) expect(contrast(hex, "#ffffff"), hex).toBeGreaterThanOrEqual(3);
  });
});
