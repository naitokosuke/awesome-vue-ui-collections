<script setup lang="ts">
import { ClosePopup, QBtn, QCard, QCardActions, QCardSection, QDialog, QInput, QSelect, QToggle } from 'quasar'
import { computed, ref } from 'vue'
import { controls } from '../../store'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const vClosePopup = ClosePopup
const size = computed(() => ({ small: 'sm', medium: 'md', large: 'lg' })[controls.size])
// QInput / QSelect only come in two heights
const dense = computed(() => controls.size === 'small')

const fruits = ['Apple', 'Banana', 'Cherry']
const name = ref('')
const fruit = ref<string | null>(null)
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <div class="demo">
    <q-btn v-if="demo === 'button'" color="primary" :label="controls.label" :size :disable="controls.disabled[demo]" />

    <q-input
      v-else-if="demo === 'input'"
      v-model="name"
      class="field"
      label="Name"
      outlined
      :dense
      :dark="controls.dark"
      :disable="controls.disabled[demo]"
    />

    <!-- the menu is portaled to <body>; index.ts moves it into the overlay host -->
    <q-select
      v-else-if="demo === 'select'"
      v-model="fruit"
      class="field"
      label="Fruit"
      :options="fruits"
      behavior="menu"
      outlined
      :dense
      :dark="controls.dark"
      :disable="controls.disabled[demo]"
    />

    <q-toggle
      v-else-if="demo === 'switch'"
      v-model="enabled"
      label="Notifications"
      :size
      :dark="controls.dark"
      :disable="controls.disabled[demo]"
    />

    <template v-else-if="demo === 'dialog'">
      <q-btn label="Open dialog" :size :disable="controls.disabled[demo]" @click="open = true" />
      <!-- `seamless`: a modal QDialog locks scrolling via classes/styles on <html>/<body> -->
      <q-dialog v-model="open" seamless>
        <q-card :dark="controls.dark" style="width: 400px">
          <q-card-section class="text-h6">Quasar</q-card-section>
          <q-card-section class="q-pt-none">
            This dialog is teleported into the Quasar overlay host.
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat color="primary" label="Close" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
}

.field {
  flex: 1;
}
</style>
