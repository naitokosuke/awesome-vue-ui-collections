<script setup lang="ts">
import { CommandList } from '../command'
</script>

<template>
  <CommandList v-bind="$attrs">
    <slot />
  </CommandList>
</template>
