<script setup lang="ts">
import { darkTheme, type GlobalThemeOverrides } from "naive-ui";
import { computed, ref } from "vue";
import { shade, tint } from "../color";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();

// Naive's dark theme pairs a light primary with dark text, so lighten the color there.
const themeOverrides = computed<GlobalThemeOverrides | null>(() => {
  if (!controls.color) return null;
  const primary = controls.dark ? tint(controls.color, 0.35) : controls.color;
  return {
    common: {
      primaryColor: primary,
      primaryColorHover: tint(primary, 0.15),
      primaryColorPressed: shade(primary, 0.15),
      primaryColorSuppl: controls.dark ? shade(primary, 0.35) : tint(primary, 0.15),
    },
  };
});

const fruits = ["Apple", "Banana", "Cherry"].map((label) => ({ label, value: label }));
const name = ref("");
const fruit = ref<string | null>(null);
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <!--
    abstract: no wrapper element (it would stay behind in the overlay host; the demos are teleported out).
    preflight-style-disabled: the runtime-injected `body { ... }` rule is imported scoped instead (virtual:naive-ui-preflight.css).
  -->
  <n-config-provider
    abstract
    :theme="controls.dark ? darkTheme : null"
    :theme-overrides="themeOverrides"
    preflight-style-disabled
  >
    <DemoCells>
      <template #button="{ disabled }">
        <n-button type="primary" :size="controls.size" :disabled>{{ controls.label }}</n-button>
      </template>

      <template #input="{ disabled }">
        <n-input v-model:value="name" placeholder="Name" :size="controls.size" :disabled />
      </template>

      <template #select="{ disabled }">
        <n-select
          v-model:value="fruit"
          placeholder="Fruit"
          :options="fruits"
          :to="overlay"
          :size="controls.size"
          :disabled
        />
      </template>

      <template #switch="{ disabled }">
        <n-space align="center">
          <n-switch v-model:value="enabled" :size="controls.size" :disabled />
          <n-text>Notifications</n-text>
        </n-space>
      </template>

      <template #dialog="{ disabled }">
        <n-button :size="controls.size" :disabled @click="open = true">Open dialog</n-button>
        <n-modal
          v-model:show="open"
          preset="card"
          title="Naive UI"
          :to="overlay"
          :block-scroll="false"
          style="width: 400px"
        >
          This dialog is teleported into the Naive UI overlay host.
          <template #footer>
            <n-button @click="open = false">Close</n-button>
          </template>
        </n-modal>
      </template>
    </DemoCells>
  </n-config-provider>
</template>
