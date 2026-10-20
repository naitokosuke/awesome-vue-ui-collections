<script setup lang="ts">
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { computed, inject, ref } from 'vue'
import { controls } from '../../store'
import { shade, tint } from '../color'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!

// Naive's dark theme pairs a light primary with dark text, so lighten the color there.
const themeOverrides = computed<GlobalThemeOverrides | null>(() => {
  if (!controls.color) return null
  const primary = controls.dark ? tint(controls.color, 0.35) : controls.color
  return {
    common: {
      primaryColor: primary,
      primaryColorHover: tint(primary, 0.15),
      primaryColorPressed: shade(primary, 0.15),
      primaryColorSuppl: controls.dark ? shade(primary, 0.35) : tint(primary, 0.15),
    },
  }
})

const fruits = ['Apple', 'Banana', 'Cherry'].map((label) => ({ label, value: label }))
const name = ref('')
const fruit = ref<string | null>(null)
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <!-- preflight-style-disabled: skip the runtime-injected global `body { ... }` rule -->
  <n-config-provider
    class="demo"
    :theme="controls.dark ? darkTheme : null"
    :theme-overrides="themeOverrides"
    preflight-style-disabled
  >
    <n-button v-if="demo === 'button'" type="primary" :size="controls.size" :disabled="controls.disabled[demo]">
      {{ controls.label }}
    </n-button>

    <n-input
      v-else-if="demo === 'input'"
      v-model:value="name"
      placeholder="Name"
      :size="controls.size"
      :disabled="controls.disabled[demo]"
    />

    <n-select
      v-else-if="demo === 'select'"
      v-model:value="fruit"
      placeholder="Fruit"
      :options="fruits"
      :to="overlay"
      :size="controls.size"
      :disabled="controls.disabled[demo]"
    />

    <n-space v-else-if="demo === 'switch'" align="center">
      <n-switch v-model:value="enabled" :size="controls.size" :disabled="controls.disabled[demo]" />
      <n-text>Notifications</n-text>
    </n-space>

    <template v-else-if="demo === 'dialog'">
      <n-button :size="controls.size" :disabled="controls.disabled[demo]" @click="open = true">Open dialog</n-button>
      <n-modal
        v-model:show="open"
        preset="card"
        title="Naive UI"
        :to="overlay"
        :block-scroll="false"
        style="width: 400px"
      >
        This dialog is teleported into the Naive UI overlay host.
        <template #footer>
          <n-button @click="open = false">Close</n-button>
        </template>
      </n-modal>
    </template>
  </n-config-provider>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
}
</style>
