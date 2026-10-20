<script setup lang="ts">
import { OButton, ODialog, OInput, OSelect, OSwitch } from "@oruga-ui/oruga-next";
import { ref } from "vue";
import { controls } from "../../store";
import type { DemoKey } from "../types";

defineProps<{ demo: DemoKey }>();

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <div class="demo">
    <o-button v-if="demo === 'button'" variant="primary" :size="controls.size" :disabled="controls.disabled[demo]">
      {{ controls.label }}
    </o-button>

    <o-input
      v-else-if="demo === 'input'"
      v-model="name"
      placeholder="Name"
      :size="controls.size"
      :disabled="controls.disabled[demo]"
    />

    <!-- OSelect wraps a native <select>, so there is no popup to teleport -->
    <o-select
      v-else-if="demo === 'select'"
      v-model="fruit"
      placeholder="Fruit"
      :options="fruits"
      :size="controls.size"
      :disabled="controls.disabled[demo]"
    />

    <o-switch
      v-else-if="demo === 'switch'"
      v-model="enabled"
      label="Notifications"
      variant="primary"
      :size="controls.size"
      :disabled="controls.disabled[demo]"
    />

    <template v-else-if="demo === 'dialog'">
      <o-button :size="controls.size" :disabled="controls.disabled[demo]" @click="open = true">Open dialog</o-button>
      <!-- teleport target and scroll handling come from createOruga() in index.ts -->
      <o-dialog v-model:active="open" max-width="400px" title="Oruga">
        This dialog is teleported into the Oruga overlay host.
        <template #footer>
          <o-button @click="open = false">Close</o-button>
        </template>
      </o-dialog>
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
</style>
