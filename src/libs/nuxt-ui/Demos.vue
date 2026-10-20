<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!
const size = computed(() => ({ small: 'sm', medium: 'md', large: 'lg' } as const)[controls.size])

const fruits = ['Apple', 'Banana', 'Cherry']
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <UApp :portal="overlay">
    <div class="demo">
      <UButton v-if="demo === 'button'" :size :disabled="controls.disabled[demo]">
        {{ controls.label }}
      </UButton>

      <UInput v-else-if="demo === 'input'" v-model="name" placeholder="Name" :size :disabled="controls.disabled[demo]" />

      <USelect
        v-else-if="demo === 'select'"
        v-model="fruit"
        placeholder="Fruit"
        :items="fruits"
        :size
        :disabled="controls.disabled[demo]"
        class="w-48"
      />

      <USwitch v-else-if="demo === 'switch'" v-model="enabled" label="Notifications" :size :disabled="controls.disabled[demo]" />

      <UModal
        v-else-if="demo === 'dialog'"
        v-model:open="open"
        title="Nuxt UI"
        description="This dialog is teleported into the Nuxt UI overlay host."
      >
        <UButton color="neutral" variant="outline" :size :disabled="controls.disabled[demo]">Open dialog</UButton>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="open = false">Close</UButton>
        </template>
      </UModal>
    </div>
  </UApp>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 100%;
  padding: 16px;
  color: var(--ui-text);
}
</style>
