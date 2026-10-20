<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";
import NotProvided from "../NotProvided.vue";
import CurvedInput from "./ui/CurvedInput.vue";
import OptionWheel from "./ui/OptionWheel.vue";
import SpecularButton from "./ui/SpecularButton.vue";

const { controls } = useMountContext();
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
  <DemoCells>
    <template #button="{ disabled }">
      <SpecularButton :size v-bind="button" :disabled>{{ controls.label }}</SpecularButton>
    </template>

    <!-- CurvedInput has no disabled state. Kept shallow (and without its submit button) to fit the row. -->
    <template #input>
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
    </template>

    <!-- A scroll/drag wheel in place of a dropdown; it fills its parent's height. -->
    <template #select>
      <div class="wheel">
        <OptionWheel :items="fruits" :default-selected="0" :font-size="1" :inset="16" :tilt="12" v-bind="wheel" />
      </div>
    </template>

    <template #switch>
      <NotProvided note="No switch component" />
    </template>

    <template #dialog>
      <NotProvided note="No dialog component" />
    </template>
  </DemoCells>
</template>

<style scoped>
.wheel {
  width: 100%;
  /* Fits the select row's fixed height (Shell's ROW_HEIGHTS) with the 16px padding. */
  height: 56px;
}
</style>
