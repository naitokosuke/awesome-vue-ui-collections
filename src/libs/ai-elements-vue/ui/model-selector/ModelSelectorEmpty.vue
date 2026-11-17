<script setup lang="ts">
import { CommandEmpty } from '../command'
</script>

<template>
  <CommandEmpty v-bind="$attrs">
    <slot />
  </CommandEmpty>
</template>
