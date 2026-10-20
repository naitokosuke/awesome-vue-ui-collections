import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'
import { Quasar } from 'quasar'
import { controls } from '../../store'
import { bindScopeVars, mountLibrary } from '../mount'
import type { MountTargets } from '../types'
import Demos from './Demos.vue'

export const version: string = Quasar.version

export function mount(targets: MountTargets) {
  // Workaround: Quasar's Platform/Dark plugins unconditionally add classes to <body>
  // (`desktop`, `no-touch`, `body--light`, ...) on install. None of the demos depend
  // on them (dark mode comes from `darkAttrs` + the `dark` prop), so undo them.
  const bodyClass = document.body.className

  const unmount = mountLibrary(targets, Demos, (app) => {
    app.use(Quasar, {
      config: {
        dark: false,
        // don't set `lang`/`dir` on <html>
        lang: { noHtmlAttrs: true },
      },
    })
  })

  document.body.className = bodyClass

  // Workaround: Quasar has no option for where portals (QMenu, QDialog, ...) go; it always
  // appends `#q-portal--<type>--<n>` nodes to <body>. Move them into the overlay host,
  // inside the CSS scope. Vue's Teleport keeps targeting the same (moved) node.
  const adopt = (node: Node) => {
    if (node instanceof HTMLElement && node.id.startsWith('q-portal--')) targets.overlay.append(node)
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach(adopt)
  })
  observer.observe(document.body, { childList: true })

  // quasar.css reads `--q-primary` everywhere (bg/text-primary, toggle, focused field,
  // active item); its `:root` default is scoped onto these same elements.
  const unbind = bindScopeVars(targets, () => (controls.color ? { '--q-primary': controls.color } : null))

  return () => {
    unbind()
    observer.disconnect()
    unmount()
  }
}
