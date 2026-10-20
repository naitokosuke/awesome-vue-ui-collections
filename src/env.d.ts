declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module 'virtual:npm-stats' {
  import type { NpmStats } from '../build/npm-stats.ts'
  const stats: NpmStats
  export default stats
}
