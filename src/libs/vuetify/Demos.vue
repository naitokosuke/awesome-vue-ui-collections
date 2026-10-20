<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!
const size = computed(() => ({ small: 'small', medium: 'default', large: 'large' })[controls.size])
const density = computed(() => ({ small: 'compact', medium: 'comfortable', large: 'default' } as const)[controls.size])

/** Vuetify's fields don't use primary by default; only opt in when a color is chosen. */
const themed = computed(() => (controls.color ? 'primary' : undefined))

const fruits = ['Apple', 'Banana', 'Cherry']
const name = ref('')
const fruit = ref<string | null>(null)
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <!-- Sets the theme without painting a background, so the demo sits on the shell canvas. -->
  <v-theme-provider :theme="controls.dark ? 'dark' : 'light'">
    <div class="demo">
      <v-btn v-if="demo === 'button'" color="primary" :size :disabled="controls.disabled[demo]">
        {{ controls.label }}
      </v-btn>

      <v-text-field
        v-else-if="demo === 'input'"
        v-model="name"
        label="Name"
        :color="themed"
        :density
        :disabled="controls.disabled[demo]"
        hide-details
      />

      <v-select
        v-else-if="demo === 'select'"
        v-model="fruit"
        label="Fruit"
        :color="themed"
        :items="fruits"
        :density
        :disabled="controls.disabled[demo]"
        :menu-props="{ attach: overlay }"
        hide-details
      />

      <v-switch
        v-else-if="demo === 'switch'"
        v-model="enabled"
        color="primary"
        label="Notifications"
        :density
        :disabled="controls.disabled[demo]"
        hide-details
      />

      <template v-else-if="demo === 'dialog'">
        <v-btn :size :disabled="controls.disabled[demo]" @click="open = true">Open dialog</v-btn>
        <v-dialog v-model="open" :attach="overlay" max-width="400" scroll-strategy="none">
          <v-card title="Vuetify" text="This dialog is teleported into the Vuetify overlay host.">
            <v-card-actions>
              <v-spacer />
              <v-btn @click="open = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </template>
    </div>
  </v-theme-provider>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 100%;
  padding: 16px;
}

/* v-switch is a v-input, which grows to the full width; keep it control-sized so it centers. */
.demo > .v-switch {
  flex: none;
}
</style>
