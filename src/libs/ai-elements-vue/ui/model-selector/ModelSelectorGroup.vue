<script setup lang="ts">
import { CommandGroup } from '../command'
</script>

<template>
  <CommandGroup v-bind="$attrs">
    <slot />
  </CommandGroup>
</template>
