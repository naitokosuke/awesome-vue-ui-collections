<script setup lang="ts">
import { ClosePopup, QBtn, QCard, QCardActions, QCardSection, QDialog, QInput, QSelect, QToggle } from "quasar";
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const vClosePopup = ClosePopup;

const { controls } = useMountContext();
const size = computed(() => ({ small: "sm", medium: "md", large: "lg" })[controls.size]);
// QInput / QSelect only come in two heights
const dense = computed(() => controls.size === "small");

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string | null>(null);
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <DemoCells>
    <template #button="{ disabled }">
      <q-btn color="primary" :label="controls.label" :size :disable="disabled" />
    </template>

    <template #input="{ disabled }">
      <q-input v-model="name" class="field" label="Name" outlined :dense :dark="controls.isDark" :disable="disabled" />
    </template>

    <!-- the menu is portaled to <body>; index.ts moves it into the overlay host -->
    <template #select="{ disabled }">
      <q-select
        v-model="fruit"
        class="field"
        label="Fruit"
        :options="fruits"
        behavior="menu"
        outlined
        :dense
        :dark="controls.isDark"
        :disable="disabled"
      />
    </template>

    <template #switch="{ disabled }">
      <q-toggle v-model="enabled" label="Notifications" :size :dark="controls.isDark" :disable="disabled" />
    </template>

    <template #dialog="{ disabled }">
      <q-btn label="Open dialog" :size :disable="disabled" @click="open = true" />
      <!-- `seamless`: a modal QDialog locks scrolling via classes/styles on <html>/<body> -->
      <q-dialog v-model="open" seamless>
        <q-card :dark="controls.isDark" style="width: 400px">
          <q-card-section class="text-h6">Quasar</q-card-section>
          <q-card-section class="q-pt-none">
            This dialog is teleported into the Quasar overlay host.
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup color="primary" flat label="Close" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </DemoCells>
</template>

<style scoped>
.field {
  flex: 1;
}
</style>
