<script setup lang="ts">
import { computed, ref } from "vue";
import { controls } from "../../store";
import NotProvided from "../NotProvided.vue";
import type { DemoKey } from "../types";
import CurvedInput from "./ui/CurvedInput.vue";
import OptionWheel from "./ui/OptionWheel.vue";
import SpecularButton from "./ui/SpecularButton.vue";

defineProps<{ demo: DemoKey }>();

const size = computed(() => (({ small: "sm", medium: "md", large: "lg" }) as const)[controls.size]);

// Vue Bits is designed on dark backgrounds; in light mode the colors are inverted to stay readable.
const button = computed(() =>
  controls.dark ? {} : { textColor: "#18181b", lineColor: "#18181b", baseColor: "#a1a1aa" },
);
const wheel = computed(() =>
  controls.dark ? { textColor: "#71717a", activeColor: "#fafafa" } : { textColor: "#a1a1aa", activeColor: "#18181b" },
);

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
</script>

<template>
  <div v-if="demo === 'button'" class="demo">
    <SpecularButton :size v-bind="button" :disabled="controls.disabled[demo]">{{ controls.label }}</SpecularButton>
  </div>

  <!-- CurvedInput has no disabled state. Kept shallow (and without its submit button) to fit the row. -->
  <div v-else-if="demo === 'input'" class="demo">
    <CurvedInput
      :value="name"
      aria-label="Name"
      placeholder="Name"
      type="text"
      :theme="controls.dark ? 'dark' : 'light'"
      width="100%"
      :height="44"
      :bend="10"
      :font-size="14"
      shadow-size="sm"
      :show-button="false"
      @change="name = $event"
    />
  </div>

  <!-- A scroll/drag wheel in place of a dropdown; it fills its parent's height. -->
  <div v-else-if="demo === 'select'" class="demo">
    <div class="wheel">
      <OptionWheel :items="fruits" :default-selected="0" :font-size="1" :inset="16" :tilt="12" v-bind="wheel" />
    </div>
  </div>

  <NotProvided v-else-if="demo === 'switch'" note="No switch component" />
  <NotProvided v-else note="No dialog component" />
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
}

.wheel {
  width: 100%;
  /* Fits the select row's fixed height (Shell's ROW_HEIGHTS) with the 16px padding. */
  height: 56px;
}
</style>
