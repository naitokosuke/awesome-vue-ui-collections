import 'vant/lib/index.css'
import Vant, { Popup } from 'vant'
import { controls } from '../../store'
import { bindScopeVars, mountLibrary } from '../mount'
import type { MountTargets } from '../types'
import Demos from './Demos.vue'

export { version } from 'vant'

// Workaround: DropdownItem renders a Popup without forwarding `lock-scroll`, and the
// lock adds `van-overflow-hidden` to <body>. Flip Popup's default before any app
// normalizes its props; Dialog still receives `:lock-scroll="false"` explicitly.
;(Popup.props as Record<string, unknown>).lockScroll = { type: Boolean, default: false }

export function mount(targets: MountTargets) {
  const unmount = mountLibrary(targets, Demos, (app) => {
    app.use(Vant)
  })
  // Vant has no shades: button, switch, dropdown and dialog all derive from this one
  // variable (also in dark mode), and pressed states are an opacity overlay.
  const unbind = bindScopeVars(targets, () => (controls.color ? { '--van-primary-color': controls.color } : null))
  return () => {
    unbind()
    unmount()
  }
}
