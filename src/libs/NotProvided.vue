<!-- Shown in a row whose component the library doesn't offer, so every row still has a cell. -->
<script setup lang="ts">
defineProps<{
  /** Optional note, e.g. what the library offers instead. */
  note?: string
}>()
</script>

<template>
  <div class="not-provided">
    <span>—</span>
    <span v-if="note" class="note">{{ note }}</span>
  </div>
</template>

<style scoped>
.not-provided {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px;
  color: GrayText;
  font: 12px / 1.4 ui-monospace, monospace;
}
</style>
