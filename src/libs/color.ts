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
