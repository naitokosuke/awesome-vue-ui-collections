import 'vuetify/styles'
import { watchEffect } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { controls } from '../../store'
import { shade } from '../color'
import { mountLibrary } from '../mount'
import type { MountTargets } from '../types'
import Demos from './Demos.vue'

export { version } from 'vuetify'

export function mount(targets: MountTargets) {
  const vuetify = createVuetify({
    components,
    directives,
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
    // The runtime theme stylesheet targets `:root` unless scoped.
    theme: { defaultTheme: 'light', scope: '[data-lib="vuetify"]' },
  })
  const unmount = mountLibrary(targets, Demos, (app) => {
    app.use(vuetify)
  })

  // Push the shared primary color into both themes; `on-primary` is derived by Vuetify.
  const themes = vuetify.theme.themes.value
  const defaults = Object.fromEntries(
    Object.entries(themes).map(([name, { colors }]) => [name, { ...colors }]),
  )
  const stop = watchEffect(() => {
    for (const [name, { colors }] of Object.entries(themes)) {
      const original = defaults[name]!
      colors.primary = controls.color ?? original.primary!
      colors['primary-darken-1'] = controls.color ? shade(controls.color, 0.2) : original['primary-darken-1']!
    }
  })

  return () => {
    stop()
    unmount()
  }
}
