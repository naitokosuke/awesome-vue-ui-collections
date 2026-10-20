<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();
const size = computed(() => ({ small: "small", medium: "default", large: "large" })[controls.size]);
const density = computed(
  () => (({ small: "compact", medium: "comfortable", large: "default" }) as const)[controls.size],
);
/** Vuetify's fields don't use primary by default; only opt in when a color is chosen. */
const themed = computed(() => (controls.color ? "primary" : undefined));

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string | null>(null);
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <!-- Provides the theme to the components (each sets its own theme class), without painting a background. -->
  <v-theme-provider :theme="controls.dark ? 'dark' : 'light'">
    <DemoCells>
      <template #button="{ disabled }">
        <v-btn color="primary" :size :disabled>{{ controls.label }}</v-btn>
      </template>

      <template #input="{ disabled }">
        <v-text-field v-model="name" label="Name" :color="themed" :density :disabled hide-details />
      </template>

      <template #select="{ disabled }">
        <v-select
          v-model="fruit"
          label="Fruit"
          :color="themed"
          :items="fruits"
          :density
          :disabled
          :menu-props="{ attach: overlay }"
          hide-details
        />
      </template>

      <!-- v-switch is a v-input, which grows to the full width; keep it control-sized so it centers. -->
      <template #switch="{ disabled }">
        <v-switch
          v-model="enabled"
          class="flex-none"
          color="primary"
          label="Notifications"
          :density
          :disabled
          hide-details
        />
      </template>

      <template #dialog="{ disabled }">
        <v-btn :size :disabled @click="open = true">Open dialog</v-btn>
        <v-dialog v-model="open" :attach="overlay" max-width="400" scroll-strategy="none">
          <v-card text="This dialog is teleported into the Vuetify overlay host." title="Vuetify">
            <v-card-actions>
              <v-spacer />
              <v-btn @click="open = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </template>
    </DemoCells>
  </v-theme-provider>
</template>

<style scoped>
.flex-none {
  flex: none;
}
</style>
