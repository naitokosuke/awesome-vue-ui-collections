<script setup lang="ts">
import { Button, Dialog, Input, Select, Switch } from '@vuetify/v0'
import { inject, ref, useId } from 'vue'
import { controls } from '../../store'
import { overlayKey } from '../mount'
import type { DemoKey } from '../types'

defineProps<{ demo: DemoKey }>()

const overlay = inject(overlayKey)!
const id = useId()

const fruits = ['Apple', 'Banana', 'Cherry']
const name = ref('')
const fruit = ref<string>()
const enabled = ref(true)
const open = ref(false)
</script>

<template>
  <div class="demo" :class="`size-${controls.size}`">
    <Button.Root v-if="demo === 'button'" class="control button primary" :disabled="controls.disabled[demo]">
      {{ controls.label }}
    </Button.Root>

    <Input.Root
      v-else-if="demo === 'input'"
      :id="`${id}-name`"
      v-model="name"
      class="field"
      :disabled="controls.disabled[demo]"
    >
      <label class="label" :for="`${id}-name`">Name</label>
      <Input.Control class="control input" placeholder="Name" />
    </Input.Root>

    <Select.Root v-else-if="demo === 'select'" v-model="fruit" :disabled="controls.disabled[demo]">
      <Select.Activator class="control trigger" label="Fruit">
        <Select.Placeholder class="placeholder">Fruit</Select.Placeholder>
        <Select.Value />
        <Select.Cue class="chevron">▾</Select.Cue>
      </Select.Activator>
      <!--
        Select.Content renders in place as a native [popover] (top layer, CSS
        anchor positioning). It is teleported only so it sits inside the scope.
      -->
      <Teleport :to="overlay">
        <Select.Content class="v0-popup v0-listbox">
          <Select.Item v-for="item in fruits" :key="item" class="option" :value="item">
            {{ item }}
          </Select.Item>
        </Select.Content>
      </Teleport>
    </Select.Root>

    <div v-else-if="demo === 'switch'" class="field row">
      <Switch.Root :id="`${id}-switch`" v-model="enabled" class="switch" :disabled="controls.disabled[demo]">
        <Switch.Thumb class="thumb" />
      </Switch.Root>
      <label class="label" :for="`${id}-switch`">Notifications</label>
    </div>

    <Dialog.Root v-else-if="demo === 'dialog'" v-model="open">
      <!-- Dialog.Activator has no disabled prop; the attribute falls through to the <button>. -->
      <Dialog.Activator class="control button" :disabled="controls.disabled[demo]">Open dialog</Dialog.Activator>
      <!--
        Dialog.Content is a native <dialog> opened with showModal(): top layer,
        ::backdrop and inertness come from the browser, no body locks. It has no
        portal of its own, so it is teleported to stay inside the scope.
      -->
      <Teleport :to="overlay">
        <Dialog.Content class="v0-popup v0-dialog">
          <Dialog.Title class="title">Vuetify0</Dialog.Title>
          <Dialog.Description class="text">This dialog is teleported into the Vuetify0 overlay host.</Dialog.Description
          >
          <div class="actions">
            <Dialog.Close class="control button">Close</Dialog.Close>
          </div>
        </Dialog.Content>
      </Teleport>
    </Dialog.Root>
  </div>
</template>

<!-- Deliberately plain styles: @vuetify/v0 is headless, these only make the primitives visible. -->
<style>
/* Shared headless look (../headless-theme.css), including its dark variant. */
[data-lib='vuetify0'] {
  --v0-fg: var(--hl-fg);
  --v0-muted: var(--hl-muted);
  --v0-bg: var(--hl-bg);
  --v0-hover: var(--hl-hover);
  --v0-border: var(--hl-border);
  --v0-focus: var(--hl-focus);
  --v0-off: var(--hl-off);
}

/*
 * Popup roots live in the overlay host, outside .demo, so they set their own
 * font. Both are top-layer elements (popover / modal dialog), so no z-index.
 */
[data-lib='vuetify0'] .v0-popup {
  box-sizing: border-box;
  border: 1px solid var(--v0-border);
  border-radius: 6px;
  background: var(--v0-bg);
  color: var(--v0-fg);
  font: 14px / 1.4 system-ui, sans-serif;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
}

/* position / position-area / margin come inline from v0's popover adapter */
[data-lib='vuetify0'] .v0-listbox {
  min-width: anchor-size(width);
  margin-top: 4px !important;
  padding: 4px;
}

[data-lib='vuetify0'] .v0-dialog {
  width: min(400px, calc(100vw - 32px));
  padding: 20px;
}

[data-lib='vuetify0'] .v0-dialog::backdrop {
  background: rgb(0 0 0 / 0.4);
}
</style>

<style>
/*
 * Not `scoped`: v0 roots such as Button.Root and Switch.Root render a fragment
 * (element + comment), so they never receive the scoped data-v attribute.
 */
[data-lib='vuetify0'] {
  .demo {
    --v0-height: 32px;
    --v0-font: 14px;

    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 16px;
    color: var(--v0-fg);
    font: var(--v0-font) / 1.4 system-ui, sans-serif;
  }

  .size-small {
    --v0-height: 24px;
    --v0-font: 12px;
  }

  .size-large {
    --v0-height: 40px;
    --v0-font: 16px;
  }

  .control {
    box-sizing: border-box;
    height: var(--v0-height);
    padding: 0 12px;
    border: 1px solid var(--v0-border);
    border-radius: 4px;
    background: var(--v0-bg);
    color: var(--v0-fg);
    font: inherit;
  }

  .control:focus-visible,
  .switch:focus-visible {
    outline: 2px solid var(--v0-focus);
    outline-offset: 1px;
  }

  .control:disabled,
  .control[data-disabled],
  .switch[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button {
    cursor: pointer;
  }

  .button:not(:disabled):hover {
    background: var(--v0-hover);
  }

  .primary {
    border-color: var(--v0-fg);
    background: var(--v0-fg);
    color: var(--v0-bg);
  }

  .primary:not(:disabled):hover {
    background: var(--v0-fg);
    opacity: 0.85;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .field.row {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .label {
    color: var(--v0-muted);
  }

  .row .label {
    color: inherit;
  }

  .input {
    width: 100%;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    cursor: pointer;
  }

  .placeholder,
  .chevron {
    color: var(--v0-muted);
  }

  .switch {
    position: relative;
    flex: none;
    width: calc(var(--v0-height) * 1.5);
    height: calc(var(--v0-height) * 0.75);
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--v0-off);
    cursor: pointer;
  }

  .switch[data-state='checked'] {
    background: var(--v0-fg);
  }

  .thumb {
    display: block;
    width: calc(var(--v0-height) * 0.75 - 4px);
    height: calc(var(--v0-height) * 0.75 - 4px);
    border-radius: 50%;
    background: var(--v0-bg);
    transform: translateX(2px);
    transition: transform 0.15s;
  }

  .thumb[data-state='checked'] {
    transform: translateX(calc(var(--v0-height) * 0.75 + 2px));
  }

  .option {
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
  }

  .option:hover,
  .option[data-highlighted] {
    background: var(--v0-hover);
  }

  .option[data-selected] {
    font-weight: 600;
  }

  .title {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .text {
    margin: 0;
    color: var(--v0-muted);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
