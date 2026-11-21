<script setup lang="ts">
import type { Library } from "./libs/types";

defineProps<{ lib: Pick<Library, "logo"> }>();
</script>

<template>
  <!-- On a light tile in both themes: many logos are dark on a transparent background. -->
  <span class="logo"><img v-if="lib.logo" alt="" :src="lib.logo"></span>
</template>

<style scoped>
.logo {
  display: inline-grid;
  flex: none;
  place-items: center;
  box-sizing: border-box;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  padding: 0.25rem;
  border: 1px solid var(--avc-color-border);
  border-radius: var(--avc-radius-md);
  background: oklch(100% 0 0);
  vertical-align: middle;

  & img {
    max-inline-size: 100%;
    max-block-size: 100%;
  }
}
</style>
