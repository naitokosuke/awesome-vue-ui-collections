<script setup lang="ts">
import { BButton, BFormCheckbox, BFormInput, BFormSelect, BModal } from 'bootstrap-vue-next'
import { computed, ref } from 'vue'
import { controls } from '../../store'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const size = computed(() => (({ small: 'sm', medium: undefined, large: 'lg' }) as const)[controls.size])
const theme = computed(() => (controls.dark ? 'dark' : 'light'))

const fruits = [
  { value: null, text: 'Fruit', disabled: true },
  ...['Apple', 'Banana', 'Cherry'].map((text) => ({ value: text, text })),
]
const name = ref('')
const fruit = ref<string | null>(null)
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <!-- Bootstrap's `[data-bs-theme]` rules only apply to descendants of the scope, hence this wrapper. -->
  <div class="demo" :data-bs-theme="theme">
    <BButton v-if="demo === 'button'" variant="primary" :size :disabled="controls.disabled[demo]">
      {{ controls.label }}
    </BButton>

    <BFormInput
      v-else-if="demo === 'input'"
      v-model="name"
      placeholder="Name"
      :size
      :disabled="controls.disabled[demo]"
    />

    <BFormSelect
      v-else-if="demo === 'select'"
      v-model="fruit"
      :options="fruits"
      :size
      :disabled="controls.disabled[demo]"
    />

    <BFormCheckbox v-else-if="demo === 'switch'" v-model="enabled" switch :size :disabled="controls.disabled[demo]">
      Notifications
    </BFormCheckbox>

    <template v-else-if="demo === 'dialog'">
      <BButton variant="secondary" :size :disabled="controls.disabled[demo]" @click="open = true">Open dialog</BButton>
      <!-- teleportTo / bodyScrolling come from the createBootstrap defaults in index.ts -->
      <BModal v-model="open" title="BootstrapVue Next" :data-bs-theme="theme" centered>
        This dialog is teleported into the BootstrapVue Next overlay host.
        <template #footer>
          <BButton variant="secondary" @click="open = false">Close</BButton>
        </template>
      </BModal>
    </template>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 100%;
  padding: 16px;
  color: var(--bs-body-color);
}
</style>
