<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();
const size = computed(() => (({ small: "sm", medium: "md", large: "lg" }) as const)[controls.size]);

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <UApp :portal="overlay">
    <DemoCells style="color: var(--ui-text)">
      <template #button="{ disabled }">
        <UButton :size :disabled>{{ controls.label }}</UButton>
      </template>

      <template #input="{ disabled }">
        <UInput v-model="name" placeholder="Name" :size :disabled />
      </template>

      <template #select="{ disabled }">
        <USelect v-model="fruit" placeholder="Fruit" :items="fruits" :size :disabled class="w-48" />
      </template>

      <template #switch="{ disabled }">
        <USwitch v-model="enabled" label="Notifications" :size :disabled />
      </template>

      <template #dialog="{ disabled }">
        <UModal
          v-model:open="open"
          description="This dialog is teleported into the Nuxt UI overlay host."
          title="Nuxt UI"
        >
          <UButton color="neutral" variant="outline" :size :disabled>Open dialog</UButton>
          <template #footer>
            <UButton color="neutral" variant="outline" @click="open = false">Close</UButton>
          </template>
        </UModal>
      </template>
    </DemoCells>
  </UApp>
</template>
