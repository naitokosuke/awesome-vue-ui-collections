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
        <!-- body-lock / outside-pointer-events would set overflow and pointer-events on <body> -->
        <USelect
          v-model="fruit"
          placeholder="Fruit"
          :items="fruits"
          :size
          :disabled
          :content="{ bodyLock: false, disableOutsidePointerEvents: false }"
          class="w-48"
        />
      </template>

      <template #switch="{ disabled }">
        <USwitch v-model="enabled" label="Notifications" :size :disabled />
      </template>

      <!--
        modal=false: a modal UModal (a Reka dialog) locks the page (body overflow:hidden,
        body pointer-events:none) with no opt-out, and its overlay only renders for modal
        dialogs. The backdrop is plain markup instead, with UModal's own overlay look.
        z-50: both would otherwise paint under the table's sticky header row and label column.
      -->
      <template #dialog="{ disabled }">
        <Teleport :to="overlay">
          <div v-if="open" class="fixed inset-0 z-50 bg-elevated/75" />
        </Teleport>
        <UModal
          v-model:open="open"
          :modal="false"
          :ui="{ content: 'z-50' }"
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
