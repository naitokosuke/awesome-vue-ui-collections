<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectValue } from '../select'
import { cn } from 'cn'

// Vize can't resolve upstream's `extends /* @vue-ignore */ <the wrapped component's props>`, which
// declares no runtime props: the wrapped component's props fall through as attrs either way.
interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <SelectValue :class="cn(props.class)" v-bind="props">
    <slot />
  </SelectValue>
</template>
