<script setup lang="ts" generic="Option extends string">
import { useId, useTemplateRef } from "vue";
import { useSelectionRect } from "./useSelectionRect";

const model = defineModel<Option>({ required: true });

const { appearance = "segmented" } = defineProps<{
  /** At least two choices, or it isn't a choice. */
  options: readonly [Option, Option, ...Option[]];
  name: string;
  /** Accessible name of the group (rendered visually hidden). */
  legend: string;
  appearance?: "segmented" | "swatches";
}>();

defineSlots<{
  option?: (props: { option: Option }) => unknown;
}>();

const idPrefix = useId();

const group = useTemplateRef<HTMLElement>("group");
const selection = useSelectionRect(group, "input:checked + label", model);
</script>

<template>
  <fieldset ref="group" class="radio-group" :class="appearance">
    <legend class="visually-hidden">{{ legend }}</legend>

    <span
      v-if="selection"
      aria-hidden="true"
      class="selection"
      :style="{
        translate: `${selection.x}px ${selection.y}px`,
        inlineSize: `${selection.width}px`,
        blockSize: `${selection.height}px`,
      }"
    />

    <!-- Ids by position: option values may hold characters such as `#`. -->
    <template v-for="(option, index) in options" :key="option">
      <input :id="`${idPrefix}-${index}`" v-model="model" class="visually-hidden" type="radio" :name :value="option">
      <label :for="`${idPrefix}-${index}`">
        <slot name="option" :option>{{ option }}</slot>
      </label>
    </template>
  </fieldset>
</template>

<style scoped>
/* Uses the shell's --avc-* tokens (../tokens.css). */

/* One row; a container too narrow for it scrolls instead of wrapping. */
.radio-group {
  position: relative;
  display: flex;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
  isolation: isolate;
}

label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: var(--avc-target-min);
  color: var(--avc-color-text-muted);
  font-size: var(--avc-text-sm);
  line-height: var(--avc-leading-tight);
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--avc-color-text);
  }
}

input:checked + label {
  color: var(--avc-color-text);
}

input:focus-visible + label {
  outline: var(--avc-focus-ring);
  outline-offset: 4px;
}

.selection {
  position: absolute;
  inset: 0 auto auto 0;
  box-sizing: border-box;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  label {
    transition: color 0.2s;
  }

  .selection {
    transition:
      translate 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      inline-size 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.segmented {
  padding: 2px;
  border: 1px solid var(--avc-color-border);
  border-radius: var(--avc-radius-md);
  background: var(--avc-color-subtle);

  & label {
    flex: 1;
    min-inline-size: 5ch;
    padding: 0 var(--avc-space-3);
    border-radius: var(--avc-radius-sm);
  }

  & .selection {
    border-radius: var(--avc-radius-sm);
    background: var(--avc-color-raised);
    box-shadow:
      0 0 0 1px var(--avc-color-border),
      0 1px 2px oklch(0% 0 0 / 0.12);
  }
}

.swatches {
  gap: var(--avc-space-3);

  & label {
    min-inline-size: var(--avc-target-min);
    padding: 0 var(--avc-space-2);
    overflow: hidden;
    border: 1px solid var(--avc-color-border-control);
    border-radius: var(--avc-radius-full);
    background: var(--avc-color-surface);
  }

  & .selection {
    border-radius: var(--avc-radius-full);
    outline: 2px solid var(--avc-color-text);
    outline-offset: 2px;
  }
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
