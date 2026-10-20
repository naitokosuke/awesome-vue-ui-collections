<!--
  A radio group drawn as a row of equal chips; the selected chip gets a ring.
  Type-safe as in https://zenn.dev/comm_vue_nuxt/articles/vue-radio-etude: `Option` is inferred
  from `options` as a literal union, so `v-model` only accepts one of them.
  Each chip shows the option itself unless the `option` slot renders something else.
-->
<script setup lang="ts" generic="Option extends string">
import { useId } from 'vue'

const model = defineModel<Option>({ required: true })

defineProps<{
  /** At least two choices, or it isn't a choice. */
  options: readonly [Option, Option, ...Option[]]
  name: string
  /** Accessible name of the group (rendered visually hidden). */
  legend: string
}>()

defineSlots<{
  option?: (props: { option: Option }) => unknown
}>()

const idPrefix = useId()
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
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
}

/* Every option is the same box, whatever its content. */
label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  inline-size: 9ch;
  padding: 3px 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--text);
  }
}

/* Selected: a ring around the box, the same for text and color options. */
input:checked + label {
  color: var(--text);
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px var(--text);
}

input:focus-visible + label {
  outline: 2px solid var(--text);
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
