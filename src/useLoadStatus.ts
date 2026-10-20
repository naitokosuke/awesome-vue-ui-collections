import { ref } from 'vue'

/** Load state of each library app, by library id. */
export function useLoadStatus() {
  const versions = ref<Record<string, string>>({})
  const errors = ref<Record<string, string>>({})
  return { versions, errors }
}
