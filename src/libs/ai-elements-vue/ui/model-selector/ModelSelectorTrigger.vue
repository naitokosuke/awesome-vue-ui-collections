<script setup lang="ts">
import { DialogTrigger } from '../dialog'
</script>

<template>
  <DialogTrigger v-bind="$attrs">
    <slot />
  </DialogTrigger>
</template>
