import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'vant',
  name: 'Vant',
  package: 'vant',
  kind: 'styled',
  cssMatch: ['/node_modules/vant/'],
  // Instead of <van-config-provider>, which writes `van-theme-*` to <html>.
  darkAttrs: { class: 'van-theme-dark' },
}
