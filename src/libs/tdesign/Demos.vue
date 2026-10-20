<script setup lang="ts">
import type { GlobalConfigProvider } from 'tdesign-vue-next'
import { inject, ref } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!
// Global attach: popups and dialogs render into the overlay host instead of body.
const globalConfig: GlobalConfigProvider = { attach: () => overlay }

const fruits = ['Apple', 'Banana', 'Cherry'].map((label) => ({ label, value: label }))
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <t-config-provider :global-config>
    <div class="demo">
      <t-button v-if="demo === 'button'" theme="primary" :size="controls.size" :disabled="controls.disabled[demo]">
        {{ controls.label }}
      </t-button>

      <t-input
        v-else-if="demo === 'input'"
        v-model="name"
        placeholder="Name"
        :size="controls.size"
        :disabled="controls.disabled[demo]"
      />

      <t-select
        v-else-if="demo === 'select'"
        v-model="fruit"
        placeholder="Fruit"
        :options="fruits"
        :size="controls.size"
        :disabled="controls.disabled[demo]"
      />

      <t-space v-else-if="demo === 'switch'" align="center">
        <t-switch v-model="enabled" :size="controls.size" :disabled="controls.disabled[demo]" />
        <span class="text">Notifications</span>
      </t-space>

      <template v-else-if="demo === 'dialog'">
        <t-button variant="outline" :size="controls.size" :disabled="controls.disabled[demo]" @click="open = true">
          Open dialog
        </t-button>
        <!-- prevent-scroll-through would append an `html body { overflow-y: hidden }` style element to body -->
        <t-dialog v-model:visible="open" header="TDesign" width="400px" :prevent-scroll-through="false">
          This dialog is teleported into the TDesign overlay host.
          <template #footer>
            <t-button @click="open = false">Close</t-button>
          </template>
        </t-dialog>
      </template>
    </div>
  </t-config-provider>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
}

.text {
  color: var(--td-text-color-primary);
}
</style>
