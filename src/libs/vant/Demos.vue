<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!
const buttonSize = computed(() => ({ small: 'small', medium: 'normal', large: 'large' } as const)[controls.size])
const fieldSize = computed(() => (controls.size === 'large' ? 'large' : 'normal'))
const switchSize = computed(() => ({ small: '20px', medium: '26px', large: '32px' })[controls.size])

// Vant is a mobile library without a Select; DropdownMenu is its closest equivalent.
const fruits = ['Apple', 'Banana', 'Cherry'].map((text) => ({ text, value: text }))
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <div class="demo">
    <van-button v-if="demo === 'button'" type="primary" :size="buttonSize" :disabled="controls.disabled[demo]">
      {{ controls.label }}
    </van-button>

    <van-field
      v-else-if="demo === 'input'"
      v-model="name"
      placeholder="Name"
      :size="fieldSize"
      :disabled="controls.disabled[demo]"
    />

    <van-dropdown-menu v-else-if="demo === 'select'" class="grow">
      <van-dropdown-item
        v-model="fruit"
        :title="fruit ? undefined : 'Fruit'"
        :options="fruits"
        :teleport="overlay"
        :disabled="controls.disabled[demo]"
      />
    </van-dropdown-menu>

    <div v-else-if="demo === 'switch'" class="switch">
      <van-switch v-model="enabled" :size="switchSize" :disabled="controls.disabled[demo]" />
      <span class="text">Notifications</span>
    </div>

    <template v-else-if="demo === 'dialog'">
      <van-button :size="buttonSize" :disabled="controls.disabled[demo]" @click="open = true">Open dialog</van-button>
      <van-dialog
        v-model:show="open"
        title="Vant"
        message="This dialog is teleported into the Vant overlay host."
        confirm-button-text="Close"
        :width="400"
        :teleport="overlay"
        :lock-scroll="false"
      />
    </template>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
}

.grow {
  flex: 1;
}

.switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text {
  color: var(--van-text-color);
}
</style>
