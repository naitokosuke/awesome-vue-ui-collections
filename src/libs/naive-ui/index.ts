import naive from 'naive-ui'
import { mountLibrary } from '../mount'
import type { MountTargets } from '../types'
import Demos from './Demos.vue'

export { version } from 'naive-ui'

export function mount(targets: MountTargets) {
  return mountLibrary(targets, Demos, (app) => {
    app.use(naive)
  })
}
