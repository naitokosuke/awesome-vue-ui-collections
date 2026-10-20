<!-- Shown in a row whose component the library doesn't offer, so every row still has a cell. -->
<script setup lang="ts">
defineProps<{
  /** Optional note, e.g. what the library offers instead. */
  note?: string;
}>();
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
  align-items: center;
  gap: var(--avc-space-0-5);
  width: 100%;
  padding: var(--avc-space-4);
  /* The shell's tokens (src/tokens.css), inherited into the cell. */
  color: var(--avc-color-text-muted);
  font: var(--avc-text-sm) / var(--avc-leading-normal) var(--avc-font-mono);
}
</style>
