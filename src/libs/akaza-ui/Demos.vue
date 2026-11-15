<script setup lang="ts">
import { Button, Dialog, Field, Input, Select, Switch } from "akaza-ui";
import { ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();

// Dialog's `teleport` takes a selector, not an element.
const overlayTarget = `#${overlay.id}`;

const fruits = ["Apple", "Banana", "Cherry"].map((label) => ({ value: label, label }));
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
</script>

<template>
  <DemoCells class="ak-demo" :class="`ak-size-${controls.size}`">
    <template #button="{ disabled }">
      <Button class="control button primary" :disabled>{{ controls.label }}</Button>
    </template>

    <template #input="{ disabled }">
      <Field class="field" label="Name" :ui="{ label: 'label' }" :disabled>
        <template #default="{ controlProps }">
          <Input v-bind="controlProps" v-model="name" class="control input" placeholder="Name" />
        </template>
      </Field>
    </template>

    <!--
      Select has no teleport option: its listbox is positioned in place, under the trigger.
      The cell is lifted above the rows below while it's open (see the styles).
    -->

    <template #select="{ disabled }">
      <Select
        v-model="fruit"
        class="select"
        :options="fruits"
        aria-label="Fruit"
        placeholder="Fruit"
        :disabled
        :ui="{ trigger: 'control trigger', content: 'ak-popup ak-listbox', option: 'option' }"
      />
    </template>

    <template #switch="{ disabled }">
      <Switch
        v-model="enabled"
        label="Notifications"
        :disabled
        :ui="{ wrapper: 'switch-row', root: 'switch', thumb: 'thumb' }"
      />
    </template>

    <!--
      Dialog is always modal: while it's open, it sets overflow:hidden on <body> and makes
      everything outside it inert, with no option to opt out. Both are undone on close.
    -->
    <template #dialog="{ disabled }">
      <Dialog
        title="Akaza UI"
        :teleport="overlayTarget"
        :ui="{ overlay: 'backdrop', content: 'ak-popup ak-dialog', title: 'title', description: 'text' }"
      >
        <template #trigger="{ open }">
          <Button class="control button" :disabled @click="open">Open dialog</Button>
        </template>
        <template #description>This dialog is teleported into the Akaza UI overlay host.</template>
        <template #footer="{ close }">
          <div class="actions">
            <Button class="control button" @click="close()">Close</Button>
          </div>
        </template>
      </Dialog>
    </template>
  </DemoCells>
</template>

<!-- Deliberately plain styles: Akaza UI is headless, these only make the primitives visible. -->
<style>
/* Each cell's frame (DemoCells): not this component's element, so it's styled by class here. */
[data-lib='akaza-ui'] .ak-demo {
  --ak-height: 32px;
  --ak-font: 14px;

  color: var(--hl-fg);
  font: var(--ak-font) / 1.4 system-ui, sans-serif;
}

[data-lib='akaza-ui'] .ak-size-small {
  --ak-height: 24px;
  --ak-font: 12px;
}

[data-lib='akaza-ui'] .ak-size-large {
  --ak-height: 40px;
  --ak-font: 16px;
}

/*
 * Classes passed through `ui` land on elements Akaza UI renders (some teleported), so they
 * are styled here, unscoped under the library's own scope.
 */
[data-lib='akaza-ui'] .control {
  box-sizing: border-box;
  height: var(--ak-height);
  padding: 0 12px;
  border: 1px solid var(--hl-border);
  border-radius: var(--hl-radius);
  background: var(--hl-bg);
  color: var(--hl-fg);
  font: inherit;
}

[data-lib='akaza-ui'] .control:focus-visible,
[data-lib='akaza-ui'] .switch:focus-visible {
  outline: 2px solid var(--hl-focus);
  outline-offset: 1px;
}

[data-lib='akaza-ui'] .control:disabled,
[data-lib='akaza-ui'] .control[data-akaza-disabled],
[data-lib='akaza-ui'] .switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

[data-lib='akaza-ui'] .button {
  cursor: pointer;
}

[data-lib='akaza-ui'] .button:not(:disabled):hover {
  background: var(--hl-hover);
}

[data-lib='akaza-ui'] .primary {
  border-color: var(--hl-accent);
  background: var(--hl-accent);
  color: var(--hl-accent-fg);
}

[data-lib='akaza-ui'] .primary:not(:disabled):hover {
  background: var(--hl-accent);
  opacity: 0.85;
}

[data-lib='akaza-ui'] .label {
  color: var(--hl-muted);
}

[data-lib='akaza-ui'] .trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  cursor: pointer;
}

[data-lib='akaza-ui'] .trigger .akaza-select-placeholder {
  color: var(--hl-muted);
}

[data-lib='akaza-ui'] .switch-row {
  align-items: center;
  gap: 8px;
}

[data-lib='akaza-ui'] .switch {
  position: relative;
  flex: none;
  width: calc(var(--ak-height) * 1.5);
  height: calc(var(--ak-height) * 0.75);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--hl-off);
  cursor: pointer;
}

[data-lib='akaza-ui'] .switch[data-akaza-state='checked'] {
  background: var(--hl-accent);
}

[data-lib='akaza-ui'] .thumb {
  display: block;
  width: calc(var(--ak-height) * 0.75 - 4px);
  height: calc(var(--ak-height) * 0.75 - 4px);
  border-radius: 50%;
  background: var(--hl-bg);
  transform: translateX(2px);
  transition: transform 0.15s;
}

[data-lib='akaza-ui'] .thumb[data-akaza-state='checked'] {
  transform: translateX(calc(var(--ak-height) * 0.75 + 2px));
}

/* The listbox and dialog set their own font: the dialog lives in the overlay host, outside the cells. */
[data-lib='akaza-ui'] .ak-popup {
  box-sizing: border-box;
  border: 1px solid var(--hl-border);
  border-radius: 6px;
  background: var(--hl-bg);
  color: var(--hl-fg);
  font: 14px / 1.4 system-ui, sans-serif;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
}

/*
 * Every cell isolates its library's z-indexes, so the next row's cell would paint over the
 * in-place listbox: the select's own cell is raised above its siblings while the listbox is open.
 */
[data-lib='akaza-ui']:has(.akaza-select-trigger[aria-expanded='true']) {
  z-index: 1;
}

[data-lib='akaza-ui'] .ak-listbox {
  padding: 4px;
}

[data-lib='akaza-ui'] .option {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

[data-lib='akaza-ui'] .option[data-akaza-highlighted] {
  background: var(--hl-hover);
}

[data-lib='akaza-ui'] .option[data-akaza-state='checked'] {
  font-weight: 600;
}

[data-lib='akaza-ui'] .backdrop {
  background: rgb(0 0 0 / 0.4);
}

[data-lib='akaza-ui'] .ak-dialog {
  width: min(400px, calc(100vw - 32px));
  padding: 20px;
}

[data-lib='akaza-ui'] .title {
  margin: 0 0 8px;
  font-size: 18px;
}

[data-lib='akaza-ui'] .text {
  margin: 0;
  color: var(--hl-muted);
}

[data-lib='akaza-ui'] .actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

<!-- Roots of the components in this template, which carry its scope id. -->
<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.input {
  width: 100%;
}

.select {
  position: relative;
  width: 100%;
}
</style>
