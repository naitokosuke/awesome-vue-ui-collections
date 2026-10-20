<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls } = useMountContext();
const buttonSize = computed(() => (({ small: "small", medium: "normal", large: "large" }) as const)[controls.size]);
// Inputs and selects only come in `small` and `normal`.
const fieldSize = computed(() => (controls.size === "small" ? "small" : "normal"));
const switchSize = computed(() => ({ small: 16, medium: 20, large: 24 })[controls.size]);

const fruits = ["Apple", "Banana", "Cherry"].map((label) => ({ label, value: label }));
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <!-- Theme variables (dark + primary color) are set on the scope element in index.ts. -->
  <DemoCells style="color: var(--color-text)">
    <template #button="{ disabled }">
      <var-button type="primary" :size="buttonSize" :disabled>{{ controls.label }}</var-button>
    </template>

    <template #input="{ disabled }">
      <var-input v-model="name" class="grow" placeholder="Name" variant="outlined" :size="fieldSize" :disabled />
    </template>

    <template #select="{ disabled }">
      <var-select
        v-model="fruit"
        class="grow"
        placeholder="Fruit"
        variant="outlined"
        :options="fruits"
        :size="fieldSize"
        :disabled
      />
    </template>

    <template #switch="{ disabled }">
      <div class="switch">
        <var-switch v-model="enabled" :size="switchSize" :disabled />
        Notifications
      </div>
    </template>

    <template #dialog="{ disabled }">
      <var-button :size="buttonSize" :disabled @click="open = true">Open dialog</var-button>
      <!-- teleport / lockScroll come from Dialog.setPropsDefaults in index.ts -->
      <var-dialog v-model:show="open" title="Varlet" :confirm-button="false" :cancel-button="false">
        This dialog is teleported into the Varlet overlay host.
        <template #actions>
          <var-button text type="primary" @click="open = false">Close</var-button>
        </template>
      </var-dialog>
    </template>
  </DemoCells>
</template>

<style scoped>
.grow {
  flex: 1;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-md);
}
</style>
