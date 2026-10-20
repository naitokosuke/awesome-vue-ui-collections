<script setup lang="ts">
import { BButton, BFormCheckbox, BFormInput, BFormSelect, BModal } from "bootstrap-vue-next";
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls } = useMountContext();
const size = computed(() => (({ small: "sm", medium: undefined, large: "lg" }) as const)[controls.size]);
const theme = computed(() => (controls.dark ? "dark" : "light"));

const fruits = [
  { value: null, text: "Fruit", disabled: true },
  ...["Apple", "Banana", "Cherry"].map((text) => ({ value: text, text })),
];
const name = ref("");
const fruit = ref<string | null>(null);
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <!-- Bootstrap's `[data-bs-theme]` rules only apply to descendants of the scope, so each cell's frame gets it. -->
  <DemoCells :data-bs-theme="theme" style="color: var(--bs-body-color)">
    <template #button="{ disabled }">
      <BButton variant="primary" :size :disabled>{{ controls.label }}</BButton>
    </template>

    <template #input="{ disabled }">
      <BFormInput v-model="name" placeholder="Name" :size :disabled />
    </template>

    <template #select="{ disabled }">
      <BFormSelect v-model="fruit" :options="fruits" :size :disabled />
    </template>

    <template #switch="{ disabled }">
      <BFormCheckbox v-model="enabled" switch :size :disabled>Notifications</BFormCheckbox>
    </template>

    <template #dialog="{ disabled }">
      <BButton variant="secondary" :size :disabled @click="open = true">Open dialog</BButton>
      <!-- teleportTo / bodyScrolling come from the createBootstrap defaults in index.ts -->
      <BModal v-model="open" title="BootstrapVue Next" :data-bs-theme="theme" centered>
        This dialog is teleported into the BootstrapVue Next overlay host.
        <template #footer>
          <BButton variant="secondary" @click="open = false">Close</BButton>
        </template>
      </BModal>
    </template>
  </DemoCells>
</template>
