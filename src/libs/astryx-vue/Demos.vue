<script setup lang="ts">
import { Button } from "@astryx-vue/core/Button";
import { Dialog, DialogHeader } from "@astryx-vue/core/Dialog";
import { Selector } from "@astryx-vue/core/Selector";
import { Switch } from "@astryx-vue/core/Switch";
import { TextInput } from "@astryx-vue/core/TextInput";
import { computed, ref } from "vue";
import { controls } from "../../store";
import type { DemoKey } from "../types";

defineProps<{ demo: DemoKey }>();

const size = computed(() => (({ small: "sm", medium: "md", large: "lg" }) as const)[controls.size]);

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string | null>(null);
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <div class="demo">
    <Button
      v-if="demo === 'button'"
      variant="primary"
      :label="controls.label"
      :size
      :is-disabled="controls.disabled[demo]"
    />

    <!-- Fields need a label; hidden, so it shows the placeholder like the other libraries. -->
    <TextInput
      v-else-if="demo === 'input'"
      v-model="name"
      is-label-hidden
      label="Name"
      placeholder="Name"
      width="100%"
      :size
      :is-disabled="controls.disabled[demo]"
    />

    <!-- Its listbox is teleported to <body>; index.ts moves it into the overlay host. -->
    <Selector
      v-else-if="demo === 'select'"
      v-model="fruit"
      is-label-hidden
      label="Fruit"
      placeholder="Fruit"
      :options="fruits"
      :size
      :disabled="controls.disabled[demo]"
    />

    <Switch
      v-else-if="demo === 'switch'"
      v-model="enabled"
      label="Notifications"
      :size
      :is-disabled="controls.disabled[demo]"
    />

    <!-- A native <dialog> opened with showModal(): it stays in this cell (inside the CSS scope) and renders in the top layer. -->
    <template v-else-if="demo === 'dialog'">
      <Button label="Open dialog" :size :is-disabled="controls.disabled[demo]" @click="open = true" />
      <Dialog :is-open="open" width="400px" @open-change="open = $event">
        <DialogHeader has-close-button title="Astryx Vue" />
        <p class="body">This dialog is a native &lt;dialog&gt; in the Astryx Vue cell.</p>
        <div class="actions">
          <Button label="Close" @click="open = false" />
        </div>
      </Dialog>
    </template>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 100%;
  padding: 16px;
  color: var(--astryx-color-text-primary);
}

/* Body and actions line up with DialogHeader's own inset. */
.body {
  margin: 0;
  padding: 4px 12px 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  padding: 16px 12px 12px;
}
</style>
