import { type App, type Component, createApp, h, type InjectionKey, Teleport, watchEffect } from 'vue'
import { DEMOS, type MountTargets } from './types'

export const overlayKey: InjectionKey<HTMLElement> = Symbol('overlay')

let appCount = 0

/**
 * Creates an isolated Vue app for one UI library.
 * Plugins installed via `install` stay inside this app, and each demo is
 * teleported into its grid cell so all libraries line up row by row.
 */
export function mountLibrary(targets: MountTargets, Demos: Component, install: (app: App) => void) {
  const app = createApp({
    render: () => DEMOS.map((demo) => h(Teleport, { to: targets.cells[demo] }, h(Demos, { demo }))),
  })
  // Every app's useId() would otherwise start at `v-0`, so ids (label `for`, aria-*) collide across libraries.
  app.config.idPrefix = `app${appCount++}`
  app.provide(overlayKey, targets.overlay)
  install(app)
  app.mount(document.createElement('div'))
  return () => app.unmount()
}

/**
 * Reactively sets CSS custom properties on a library's scope elements (its demo cells and
 * overlay host), e.g. to push the selected primary color into a CSS-variable-themed library.
 * `vars` returning null removes them again. Returns a function that stops and cleans up.
 */
export function bindScopeVars(targets: MountTargets, vars: () => Record<string, string> | null) {
  const elements = [...Object.values(targets.cells), targets.overlay]
  let applied: string[] = []
  const clear = (keep: Record<string, string> = {}) => {
    for (const el of elements) for (const name of applied) if (!(name in keep)) el.style.removeProperty(name)
  }
  const stop = watchEffect(() => {
    const next = vars() ?? {}
    clear(next)
    for (const el of elements) for (const [name, value] of Object.entries(next)) el.style.setProperty(name, value)
    applied = Object.keys(next)
  })
  return () => {
    stop()
    clear()
  }
}
