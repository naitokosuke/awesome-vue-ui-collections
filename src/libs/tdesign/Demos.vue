<script setup lang="ts">
import type { GlobalConfigProvider } from "tdesign-vue-next";
import { ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();
// Global attach: popups and dialogs render into the overlay host instead of body.
const globalConfig: GlobalConfigProvider = { attach: () => overlay };

const fruits = ["Apple", "Banana", "Cherry"].map((label) => ({ label, value: label }));
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <t-config-provider :global-config>
    <DemoCells>
      <template #button="{ disabled }">
        <t-button theme="primary" :size="controls.size" :disabled>{{ controls.label }}</t-button>
      </template>

      <template #input="{ disabled }">
        <t-input v-model="name" placeholder="Name" :size="controls.size" :disabled />
      </template>

      <template #select="{ disabled }">
        <t-select v-model="fruit" placeholder="Fruit" :options="fruits" :size="controls.size" :disabled />
      </template>

      <template #switch="{ disabled }">
        <t-space align="center">
          <t-switch v-model="enabled" :size="controls.size" :disabled />
          <span class="text">Notifications</span>
        </t-space>
      </template>

      <template #dialog="{ disabled }">
        <t-button variant="outline" :size="controls.size" :disabled @click="open = true">Open dialog</t-button>
        <!-- prevent-scroll-through would append an `html body { overflow-y: hidden }` style element to body -->
        <t-dialog v-model:visible="open" header="TDesign" width="400px" :prevent-scroll-through="false">
          This dialog is teleported into the TDesign overlay host.
          <template #footer>
            <t-button @click="open = false">Close</t-button>
          </template>
        </t-dialog>
      </template>
    </DemoCells>
  </t-config-provider>
</template>

<style scoped>
.text {
  color: var(--td-text-color-primary);
}
</style>
