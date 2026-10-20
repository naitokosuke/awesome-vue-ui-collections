<!--
  Every library's Demos.vue renders one of these, with a slot per demo row. Each slot is
  teleported into that row's grid cell, wrapped in a centered frame; attributes (style, data-*,
  a global class) go on every frame, for what a library needs set around its demos.
-->
<script setup lang="ts">
import { useMountContext } from "./mount";
import { DEMOS, type DemoKey } from "./types";

defineOptions({ inheritAttrs: false });

const slots = defineSlots<Record<DemoKey, (props: { disabled: boolean }) => unknown>>();

const { cells, controls } = useMountContext();

// Type checking catches a misnamed slot but not a missing one (slots are optional to Vue).
if (import.meta.env.DEV) {
  const missing = DEMOS.filter((demo) => !slots[demo]);
  if (missing.length > 0) {
    console.warn(`[DemoCells] No slot for ${missing.join(", ")}; use <NotProvided> for a row without a component.`);
  }
}
</script>

<template>
  <Teleport v-for="demo in DEMOS" :key="demo" :to="cells[demo]">
    <div class="demo" v-bind="$attrs">
      <slot :name="demo" :disabled="controls.disabled[demo]" />
    </div>
  </Teleport>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 100%;
  padding: 16px;
}
</style>
