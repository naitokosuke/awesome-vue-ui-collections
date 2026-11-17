<script setup lang="ts">
import { Dialog } from '../dialog'
</script>

<template>
  <Dialog v-bind="$attrs">
    <slot />
  </Dialog>
</template>
