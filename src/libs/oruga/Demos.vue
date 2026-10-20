<script setup lang="ts">
import { OButton, ODialog, OInput, OSelect, OSwitch } from "@oruga-ui/oruga-next";
import { ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls } = useMountContext();

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <DemoCells>
    <template #button="{ disabled }">
      <o-button variant="primary" :size="controls.size" :disabled>{{ controls.label }}</o-button>
    </template>

    <template #input="{ disabled }">
      <o-input v-model="name" placeholder="Name" :size="controls.size" :disabled />
    </template>

    <!-- OSelect wraps a native <select>, so there is no popup to teleport -->
    <template #select="{ disabled }">
      <o-select v-model="fruit" placeholder="Fruit" :options="fruits" :size="controls.size" :disabled />
    </template>

    <template #switch="{ disabled }">
      <o-switch v-model="enabled" label="Notifications" variant="primary" :size="controls.size" :disabled />
    </template>

    <template #dialog="{ disabled }">
      <o-button :size="controls.size" :disabled @click="open = true">Open dialog</o-button>
      <!-- teleport target and scroll handling come from createOruga() in index.ts -->
      <o-dialog v-model:active="open" max-width="400px" title="Oruga">
        This dialog is teleported into the Oruga overlay host.
        <template #footer>
          <o-button @click="open = false">Close</o-button>
        </template>
      </o-dialog>
    </template>
  </DemoCells>
</template>
