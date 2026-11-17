<script setup lang="ts">
/** A native checkbox drawn as a monochrome switch; the whole label (the slot) is the target. */
const checked = defineModel<boolean>({ required: true });

defineProps<{
  /** For a switch whose label text alone doesn't say what it switches. */
  ariaLabel?: string;
  ariaDescribedby?: string;
}>();
</script>

<template>
  <label class="switch">
    <input v-model="checked" role="switch" type="checkbox" :aria-label :aria-describedby>
    <slot />
  </label>
</template>

<style scoped>
/* Uses the shell's --avc-* tokens (./tokens.css). */

.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--avc-space-2);
  min-block-size: var(--avc-target-min);
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);
  cursor: pointer;
  user-select: none;

  &:has(:checked) {
    color: var(--avc-color-text);
  }
}

input {
  --track-inline: 2rem;
  --track-block: 1.125rem;
  --thumb: 0.75rem;
  /* Thumb inset from the track's inner edge (inside the 1px border). */
  --inset: calc((var(--track-block) - 2px - var(--thumb)) / 2);

  appearance: none;
  position: relative;
  flex: none;
  inline-size: var(--track-inline);
  block-size: var(--track-block);
  margin: 0;
  border: 1px solid var(--avc-color-border-control);
  border-radius: var(--avc-radius-full);
  background: var(--avc-color-subtle);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;

  &::after {
    content: '';
    position: absolute;
    inset-block-start: var(--inset);
    inset-inline-start: var(--inset);
    inline-size: var(--thumb);
    block-size: var(--thumb);
    border-radius: 50%;
    background: var(--avc-color-text-muted);
    transition: translate 0.15s, background-color 0.15s;
  }

  &:checked {
    border-color: var(--avc-color-text);
    background: var(--avc-color-text);

    &::after {
      translate: calc(var(--track-inline) - 2px - var(--thumb) - var(--inset) * 2) 0;
      background: var(--avc-color-bg);
    }
  }

  &:focus-visible {
    outline: var(--avc-focus-ring);
    outline-offset: 2px;
  }
}
</style>
