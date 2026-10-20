<script setup lang="ts">
import { inject, ref } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!

const fruits = ['Apple', 'Banana', 'Cherry']
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <!-- Arco's switch only has small/medium sizes; everything else reads the provider size. -->
  <a-config-provider :size="controls.size">
    <div class="demo">
      <a-button v-if="demo === 'button'" type="primary" :disabled="controls.disabled[demo]">
        {{ controls.label }}
      </a-button>

      <a-input v-else-if="demo === 'input'" v-model="name" placeholder="Name" :disabled="controls.disabled[demo]" />

      <a-select
        v-else-if="demo === 'select'"
        v-model="fruit"
        placeholder="Fruit"
        :popup-container="overlay"
        :disabled="controls.disabled[demo]"
      >
        <a-option v-for="item in fruits" :key="item" :value="item">{{ item }}</a-option>
      </a-select>

      <a-space v-else-if="demo === 'switch'" align="center">
        <a-switch
          v-model="enabled"
          :size="controls.size === 'small' ? 'small' : 'medium'"
          :disabled="controls.disabled[demo]"
        />
        <span class="text">Notifications</span>
      </a-space>

      <template v-else-if="demo === 'dialog'">
        <a-button :disabled="controls.disabled[demo]" @click="open = true">Open dialog</a-button>
        <!-- Arco only hides overflow on the popup container when it scrolls; the overlay host never does. -->
        <a-modal v-model:visible="open" title="Arco Design Vue" :width="400" :popup-container="overlay">
          This dialog is teleported into the Arco Design Vue overlay host.
          <template #footer>
            <a-button @click="open = false">Close</a-button>
          </template>
        </a-modal>
      </template>
    </div>
  </a-config-provider>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
}

.text {
  color: var(--color-text-1);
}
</style>
