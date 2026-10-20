<script setup lang="ts">
import { ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <!-- Arco's switch only has small/medium sizes; everything else reads the provider size. -->
  <a-config-provider :size="controls.size">
    <DemoCells>
      <template #button="{ disabled }">
        <a-button type="primary" :disabled>{{ controls.label }}</a-button>
      </template>

      <template #input="{ disabled }">
        <a-input v-model="name" placeholder="Name" :disabled />
      </template>

      <template #select="{ disabled }">
        <a-select v-model="fruit" placeholder="Fruit" :popup-container="overlay" :disabled>
          <a-option v-for="item in fruits" :key="item" :value="item">{{ item }}</a-option>
        </a-select>
      </template>

      <template #switch="{ disabled }">
        <a-space align="center">
          <a-switch v-model="enabled" :size="controls.size === 'small' ? 'small' : 'medium'" :disabled />
          <span class="text">Notifications</span>
        </a-space>
      </template>

      <template #dialog="{ disabled }">
        <a-button :disabled @click="open = true">Open dialog</a-button>
        <!-- Arco only hides overflow on the popup container when it scrolls; the overlay host never does. -->
        <a-modal v-model:visible="open" title="Arco Design Vue" :width="400" :popup-container="overlay">
          This dialog is teleported into the Arco Design Vue overlay host.
          <template #footer>
            <a-button @click="open = false">Close</a-button>
          </template>
        </a-modal>
      </template>
    </DemoCells>
  </a-config-provider>
</template>

<style scoped>
.text {
  color: var(--color-text-1);
}
</style>
