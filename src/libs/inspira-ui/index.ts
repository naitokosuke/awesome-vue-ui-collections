import './style.css'
import { controls } from '../../store'
import { hexToRgb } from '../color'
import { bindScopeVars, mountLibrary } from '../mount'
import type { MountTargets } from '../types'
import Demos from './Demos.vue'

// Inspira UI itself isn't versioned on npm; this is the `@inspira-ui/plugins` runtime the components import.
export { version } from '@inspira-ui/plugins/package.json'

/** Black or white, whichever reads better on `hex` (WCAG relative luminance). */
function foreground(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.179 ? 'oklch(0.141 0.005 285.823)' : 'oklch(0.985 0 0)'
}

export function mount(targets: MountTargets) {
  const unmount = mountLibrary(targets, Demos, () => {})
  // Inline vars on the scope elements win over both the `:root` and `.dark` token rules.
  const unbind = bindScopeVars(targets, () => {
    const hex = controls.color
    if (!hex) return null
    return {
      '--primary': hex,
      '--primary-foreground': foreground(hex),
      '--ring': hex,
      // IInput's hover glow (see style.css)
      '--blue-500': hex,
    }
  })
  return () => {
    unbind()
    unmount()
  }
}
