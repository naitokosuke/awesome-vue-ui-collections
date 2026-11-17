<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectTrigger } from '../select'
import { cn } from 'cn'

// Vize can't resolve upstream's `extends /* @vue-ignore */ <the wrapped component's props>`, which
// declares no runtime props: the wrapped component's props fall through as attrs either way.
interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <SelectTrigger
    :class="cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground',
      props.class,
    )"
    v-bind="props"
  >
    <slot />
  </SelectTrigger>
</template>
