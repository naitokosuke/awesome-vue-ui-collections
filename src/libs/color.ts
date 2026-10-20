/** Small helpers for deriving a library's primary palette from one `#rrggbb` color. */

export type Rgb = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

/** `amount` of `other` mixed into `hex` (0 = hex, 1 = other), like `color-mix(in srgb, ...)`. */
export function mix(hex: string, other: string, amount: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(other)
  return rgbToHex(a.map((channel, i) => channel + (b[i]! - channel) * amount) as Rgb)
}

/** Lighter shade: `amount` of white mixed in. */
export const tint = (hex: string, amount: number) => mix(hex, '#ffffff', amount)

/** Darker shade: `amount` of black mixed in. */
export const shade = (hex: string, amount: number) => mix(hex, '#000000', amount)

/** `"r, g, b"`, for libraries whose CSS variables hold channel triplets. */
export const rgbChannels = (hex: string) => hexToRgb(hex).join(', ')

/** WCAG relative luminance of `hex` (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

/** Whichever of `light` / `dark` reads better on `hex`. */
export const readableOn = (hex: string, light = '#ffffff', dark = '#18181b') =>
  contrast(hex, light) >= contrast(hex, dark) ? light : dark
