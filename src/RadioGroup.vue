<script setup lang="ts" generic="Option extends string">
import { useId } from "vue";

const model = defineModel<Option>({ required: true });

defineProps<{
  /** At least two choices, or it isn't a choice. */
  options: readonly [Option, Option, ...Option[]];
  name: string;
  /** Accessible name of the group (rendered visually hidden). */
  legend: string;
}>();

defineSlots<{
  option?: (props: { option: Option }) => unknown;
}>();

const idPrefix = useId();
</script>

<template>
  <fieldset class="radio-group">
    <legend class="visually-hidden">{{ legend }}</legend>

    <template v-for="option in options" :key="option">
      <input :id="`${idPrefix}-${option}`" v-model="model" class="visually-hidden" type="radio" :name :value="option">
      <label :for="`${idPrefix}-${option}`">
        <slot name="option" :option>{{ option }}</slot>
      </label>
    </template>
  </fieldset>
</template>

<style scoped>
/* Uses the shell's --avc-* tokens (../tokens.css). */

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--avc-space-2);
  margin: 0;
  padding: 0;
  border: 0;
}

/* Every option is the same box, whatever its content; at least the minimum target size. */
label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  inline-size: 10ch;
  min-block-size: var(--avc-target-min);
  padding: var(--avc-space-0-5) var(--avc-space-2);
  overflow: hidden;
  border: 1px solid var(--avc-color-border-control);
  border-radius: var(--avc-radius-sm);
  background: var(--avc-color-surface);
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);
  line-height: var(--avc-leading-tight);
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--avc-color-text);
  }
}

/* Selected: a ring around the box, the same for text and color options. */
input:checked + label {
  color: var(--avc-color-text);
  box-shadow:
    0 0 0 2px var(--avc-color-bg),
    0 0 0 3px var(--avc-color-text);
}

input:focus-visible + label {
  outline: var(--avc-focus-ring);
  outline-offset: 4px;
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
