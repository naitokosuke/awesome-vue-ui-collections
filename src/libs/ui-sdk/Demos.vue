<script setup lang="ts">
import { Button } from "@ui-sdk/vue/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/vue/dialog";
import { Field, FieldLabel } from "@ui-sdk/vue/field";
import { Input } from "@ui-sdk/vue/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-sdk/vue/select";
import { Switch, SwitchThumb } from "@ui-sdk/vue/switch";
import { ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string | null>(null);
const enabled = ref(true);
</script>

<template>
  <DemoCells class="us-demo" :class="`us-size-${controls.size}`">
    <template #button="{ disabled }">
      <Button class="control button primary" :disabled>{{ controls.label }}</Button>
    </template>

    <template #input="{ disabled }">
      <Field class="field" :disabled>
        <FieldLabel class="label">Name</FieldLabel>
        <Input v-model="name" class="control input" placeholder="Name" />
      </Field>
    </template>

    <!--
      Popups open in the browser's top layer in place; `container` moves their DOM into the
      overlay host, inside the library's CSS scope.
    -->
    <template #select="{ disabled }">
      <Select v-model="fruit" class="select" :items="fruits" placeholder="Fruit" :disabled>
        <SelectTrigger aria-label="Fruit" class="control trigger">
          <SelectValue />
          <span aria-hidden="true" class="chevron">▾</span>
        </SelectTrigger>
        <SelectContent class="us-popup us-listbox" :container="overlay">
          <SelectItem v-for="item in fruits" :key="item" class="option" :value="item">{{ item }}</SelectItem>
        </SelectContent>
      </Select>
    </template>

    <template #switch="{ disabled }">
      <!-- The field labels the switch, and pressing the label toggles it. -->
      <Field class="switch-row" :disabled>
        <Switch v-model="enabled" class="switch">
          <SwitchThumb class="thumb" />
        </Switch>
        <FieldLabel>Notifications</FieldLabel>
      </Field>
    </template>

    <!--
      modal="trap-focus": a modal dialog (the default) makes the rest of the page inert and locks
      scrolling. This keeps Tab inside the dialog and leaves the page alone.
    -->
    <template #dialog="{ disabled }">
      <Dialog modal="trap-focus">
        <DialogTrigger class="control button" :disabled>Open dialog</DialogTrigger>
        <DialogBackdrop class="backdrop" :container="overlay" />
        <DialogContent class="us-popup us-dialog" :container="overlay">
          <DialogTitle class="title">UI SDK</DialogTitle>
          <DialogDescription class="text">This dialog is teleported into the UI SDK overlay host.</DialogDescription>
          <div class="actions">
            <DialogClose class="control button">Close</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </template>
  </DemoCells>
</template>

<!--
  Deliberately plain styles: UI SDK is headless, these only make its parts visible. Parts render
  their own elements (some in the overlay host), so the rules are written under the library's scope.
-->
<style>
[data-lib='ui-sdk'] .us-demo {
  --us-height: 32px;
  --us-font: 14px;

  color: var(--hl-fg);
  font: var(--us-font) / 1.4 system-ui, sans-serif;
}

[data-lib='ui-sdk'] .us-size-small {
  --us-height: 24px;
  --us-font: 12px;
}

[data-lib='ui-sdk'] .us-size-large {
  --us-height: 40px;
  --us-font: 16px;
}

[data-lib='ui-sdk'] .control {
  box-sizing: border-box;
  height: var(--us-height);
  padding: 0 12px;
  border: 1px solid var(--hl-border);
  border-radius: var(--hl-radius);
  background: var(--hl-bg);
  color: var(--hl-fg);
  font: inherit;
}

[data-lib='ui-sdk'] .control:focus-visible,
[data-lib='ui-sdk'] .switch:focus-visible {
  outline: 2px solid var(--hl-focus);
  outline-offset: 1px;
}

[data-lib='ui-sdk'] .control[data-disabled],
[data-lib='ui-sdk'] .control:disabled,
[data-lib='ui-sdk'] .switch[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

[data-lib='ui-sdk'] .button {
  cursor: pointer;
}

[data-lib='ui-sdk'] .button:not(:disabled):hover {
  background: var(--hl-hover);
}

[data-lib='ui-sdk'] .primary {
  border-color: var(--hl-accent);
  background: var(--hl-accent);
  color: var(--hl-accent-fg);
}

[data-lib='ui-sdk'] .primary:not(:disabled):hover {
  background: var(--hl-accent);
  opacity: 0.85;
}

[data-lib='ui-sdk'] .field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

[data-lib='ui-sdk'] .label {
  color: var(--hl-muted);
}

[data-lib='ui-sdk'] .input,
[data-lib='ui-sdk'] .select {
  width: 100%;
}

[data-lib='ui-sdk'] .trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  cursor: pointer;
}

[data-lib='ui-sdk'] .trigger[data-placeholder],
[data-lib='ui-sdk'] .chevron {
  color: var(--hl-muted);
}

[data-lib='ui-sdk'] .switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

[data-lib='ui-sdk'] .switch {
  position: relative;
  flex: none;
  width: calc(var(--us-height) * 1.5);
  height: calc(var(--us-height) * 0.75);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--hl-off);
  cursor: pointer;
}

[data-lib='ui-sdk'] .switch[data-checked] {
  background: var(--hl-accent);
}

[data-lib='ui-sdk'] .thumb {
  display: block;
  width: calc(var(--us-height) * 0.75 - 4px);
  height: calc(var(--us-height) * 0.75 - 4px);
  border-radius: 50%;
  background: var(--hl-bg);
  transform: translateX(2px);
  transition: transform 0.15s;
}

[data-lib='ui-sdk'] .thumb[data-checked] {
  transform: translateX(calc(var(--us-height) * 0.75 + 2px));
}

/* The listbox and dialog live in the overlay host, outside the cells, so they set their own font. */
[data-lib='ui-sdk'] .us-popup {
  box-sizing: border-box;
  margin: 0;
  border: 1px solid var(--hl-border);
  border-radius: 6px;
  background: var(--hl-bg);
  color: var(--hl-fg);
  font: 14px / 1.4 system-ui, sans-serif;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
}

[data-lib='ui-sdk'] .us-listbox {
  min-width: var(--anchor-width);
  padding: 4px;
}

[data-lib='ui-sdk'] .option {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

[data-lib='ui-sdk'] .option[data-highlighted] {
  background: var(--hl-hover);
}

[data-lib='ui-sdk'] .option[data-selected] {
  font-weight: 600;
}

[data-lib='ui-sdk'] .backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
}

/* UI SDK's popover reset sets `inset: auto`, leaving placement to us. */
[data-lib='ui-sdk'] .us-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  width: min(400px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
  padding: 20px;
}

[data-lib='ui-sdk'] .title {
  margin: 0 0 8px;
  font-size: 18px;
}

[data-lib='ui-sdk'] .text {
  margin: 0;
  color: var(--hl-muted);
}

[data-lib='ui-sdk'] .actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
