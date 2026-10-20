<script setup lang="ts">
import { computed, ref } from 'vue'
import { controls } from '../../store'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const buttonSize = computed(() => ({ small: 'small', medium: 'normal', large: 'large' } as const)[controls.size])
// Inputs and selects only come in `small` and `normal`.
const fieldSize = computed(() => (controls.size === 'small' ? 'small' : 'normal'))
const switchSize = computed(() => ({ small: 16, medium: 20, large: 24 })[controls.size])

const fruits = ['Apple', 'Banana', 'Cherry'].map((label) => ({ label, value: label }))
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <!-- Theme variables (dark + primary color) are set on the scope element in index.ts. -->
  <div class="demo">
    <var-button v-if="demo === 'button'" type="primary" :size="buttonSize" :disabled="controls.disabled[demo]">
      {{ controls.label }}
    </var-button>

    <var-input
      v-else-if="demo === 'input'"
      v-model="name"
      variant="outlined"
      placeholder="Name"
      :size="fieldSize"
      :disabled="controls.disabled[demo]"
    />

    <var-select
      v-else-if="demo === 'select'"
      v-model="fruit"
      variant="outlined"
      placeholder="Fruit"
      :options="fruits"
      :size="fieldSize"
      :disabled="controls.disabled[demo]"
    />

    <div v-else-if="demo === 'switch'" class="switch">
      <var-switch v-model="enabled" :size="switchSize" :disabled="controls.disabled[demo]" />
      Notifications
    </div>

    <template v-else-if="demo === 'dialog'">
      <var-button :size="buttonSize" :disabled="controls.disabled[demo]" @click="open = true">Open dialog</var-button>
      <!-- teleport / lockScroll come from Dialog.setPropsDefaults in index.ts -->
      <var-dialog v-model:show="open" title="Varlet" :confirm-button="false" :cancel-button="false">
        This dialog is teleported into the Varlet overlay host.
        <template #actions>
          <var-button text type="primary" @click="open = false">Close</var-button>
        </template>
      </var-dialog>
    </template>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  align-self: stretch;
  width: 100%;
  padding: 16px;
  background-color: var(--color-body);
  color: var(--color-text);
}

.demo > :deep(.var-input),
.demo > :deep(.var-select) {
  flex: 1;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-md);
}
</style>
