<script setup lang="ts">
import { Select } from '../select'

// Vize can't resolve upstream's `extends /* @vue-ignore */ <the wrapped component's props>`, which
// declares no runtime props: the wrapped component's props fall through as attrs either way.
interface Props {}

const props = defineProps<Props>()
</script>

<template>
  <Select v-bind="props">
    <slot />
  </Select>
</template>
