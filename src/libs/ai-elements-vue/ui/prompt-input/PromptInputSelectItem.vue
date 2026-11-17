<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { SelectItem } from '../select'
import { cn } from 'cn'

// Vize can't resolve upstream's `extends /* @vue-ignore */ <the wrapped component's props>`, which
// declares no runtime props: the wrapped component's props fall through as attrs either way.
// `value` is declared here because SelectItem requires it.
interface Props {
  value: AcceptableValue
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <SelectItem :class="cn(props.class)" v-bind="props">
    <slot />
  </SelectItem>
</template>
