<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!
const size = computed(() => (({ small: 'small', medium: 'default', large: 'large' }) as const)[controls.size])

const fruits = ['Apple', 'Banana', 'Cherry']
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <el-config-provider :size>
    <div class="demo">
      <el-button v-if="demo === 'button'" type="primary" :disabled="controls.disabled[demo]">
        {{ controls.label }}
      </el-button>

      <el-input v-else-if="demo === 'input'" v-model="name" placeholder="Name" :disabled="controls.disabled[demo]" />

      <el-select
        v-else-if="demo === 'select'"
        v-model="fruit"
        placeholder="Fruit"
        :append-to="overlay"
        :disabled="controls.disabled[demo]"
      >
        <el-option v-for="item in fruits" :key="item" :label="item" :value="item" />
      </el-select>

      <el-switch
        v-else-if="demo === 'switch'"
        v-model="enabled"
        active-text="Notifications"
        :disabled="controls.disabled[demo]"
      />

      <template v-else-if="demo === 'dialog'">
        <el-button :disabled="controls.disabled[demo]" @click="open = true">Open dialog</el-button>
        <el-dialog v-model="open" title="Element Plus" width="400" :append-to="overlay" :lock-scroll="false">
          This dialog is teleported into the Element Plus overlay host.
          <template #footer>
            <el-button @click="open = false">Close</el-button>
          </template>
        </el-dialog>
      </template>
    </div>
  </el-config-provider>
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
