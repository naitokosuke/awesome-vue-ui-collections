<script setup lang="ts">
import {
  ConfigProvider,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Label,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SwitchRoot,
  SwitchThumb,
} from 'reka-ui'
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
  <!--
    teleport-to: every portalled primitive (Select, Dialog, …) renders into the overlay host.
    scroll-body=false only drops the scrollbar padding compensation; the real
    body locks are turned off per component below.
  -->
  <ConfigProvider :teleport-to="overlay" :scroll-body="false">
    <div class="demo" :class="`size-${controls.size}`">
      <button v-if="demo === 'button'" class="control button primary" type="button" :disabled="controls.disabled[demo]">
        {{ controls.label }}
      </button>

      <!-- Reka UI has no text input primitive; Label + native input is the intended pattern -->
      <div v-else-if="demo === 'input'" class="field">
        <Label class="label" :for="`${id}-name`">Name</Label>
        <input :id="`${id}-name`" v-model="name" class="control input" placeholder="Name" :disabled="controls.disabled[demo]">
      </div>

      <SelectRoot v-else-if="demo === 'select'" v-model="fruit" :disabled="controls.disabled[demo]">
        <SelectTrigger class="control trigger" aria-label="Fruit">
          <SelectValue placeholder="Fruit" />
          <SelectIcon class="chevron">▾</SelectIcon>
        </SelectTrigger>
        <SelectPortal>
          <!-- body-lock / outside-pointer-events would set overflow and pointer-events on <body> -->
          <SelectContent
            class="rk-popup rk-listbox"
            position="popper"
            :side-offset="4"
            :body-lock="false"
            :disable-outside-pointer-events="false"
          >
            <SelectViewport>
              <SelectItem v-for="item in fruits" :key="item" class="option" :value="item">
                <SelectItemText>{{ item }}</SelectItemText>
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>

      <div v-else-if="demo === 'switch'" class="field row">
        <SwitchRoot :id="`${id}-switch`" v-model="enabled" class="switch" :disabled="controls.disabled[demo]">
          <SwitchThumb class="thumb" />
        </SwitchRoot>
        <Label class="label" :for="`${id}-switch`">Notifications</Label>
      </div>

      <!--
        modal=false: a modal DialogRoot always locks the page (DialogOverlay sets
        body overflow:hidden, DialogContent sets body pointer-events:none and
        aria-hides siblings) with no option to opt out. The backdrop below is plain markup.
      -->
      <DialogRoot v-else-if="demo === 'dialog'" v-model:open="open" :modal="false">
        <DialogTrigger class="control button" :disabled="controls.disabled[demo]">Open dialog</DialogTrigger>
        <DialogPortal>
          <div v-if="open" class="backdrop" />
          <DialogContent class="rk-popup rk-dialog">
            <DialogTitle class="title">Reka UI</DialogTitle>
            <DialogDescription class="text">This dialog is teleported into the Reka UI overlay host.</DialogDescription>
            <div class="actions">
              <DialogClose class="control button">Close</DialogClose>
            </div>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </div>
  </ConfigProvider>
</template>

<!-- Deliberately plain styles: Reka UI is headless, these only make the primitives visible. -->
<style>
/* Shared headless look (../headless-theme.css), including its dark variant. */
[data-lib='reka-ui'] {
  --rk-fg: var(--hl-fg);
  --rk-muted: var(--hl-muted);
  --rk-bg: var(--hl-bg);
  --rk-hover: var(--hl-hover);
  --rk-border: var(--hl-border);
  --rk-focus: var(--hl-focus);
  --rk-off: var(--hl-off);
}

/*
 * Roots of portalled content (SelectContent, DialogContent) sit behind Presence
 * wrappers, so they are styled by class here instead of relying on scoped ids.
 * They live in the overlay host, outside .demo, so they set their own font.
 */
[data-lib='reka-ui'] .rk-popup {
  box-sizing: border-box;
  border: 1px solid var(--rk-border);
  border-radius: 6px;
  background: var(--rk-bg);
  color: var(--rk-fg);
  font: 14px / 1.4 system-ui, sans-serif;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
}

[data-lib='reka-ui'] .rk-listbox {
  z-index: 1000;
  min-width: var(--reka-select-trigger-width);
  padding: 4px;
}

[data-lib='reka-ui'] .rk-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1001;
  width: min(400px, calc(100vw - 32px));
  padding: 20px;
  transform: translate(-50%, -50%);
}
</style>

<style scoped>
.demo {
  --rk-height: 32px;
  --rk-font: 14px;

  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  color: var(--rk-fg);
  font: var(--rk-font) / 1.4 system-ui, sans-serif;
}

.size-small {
  --rk-height: 24px;
  --rk-font: 12px;
}

.size-large {
  --rk-height: 40px;
  --rk-font: 16px;
}

.control {
  box-sizing: border-box;
  height: var(--rk-height);
  padding: 0 12px;
  border: 1px solid var(--rk-border);
  border-radius: 4px;
  background: var(--rk-bg);
  color: var(--rk-fg);
  font: inherit;
}

.control:focus-visible,
.switch:focus-visible {
  outline: 2px solid var(--rk-focus);
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
  background: var(--rk-hover);
}

.primary {
  border-color: var(--rk-fg);
  background: var(--rk-fg);
  color: var(--rk-bg);
}

.primary:not(:disabled):hover {
  background: var(--rk-fg);
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
  color: var(--rk-muted);
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

.trigger[data-placeholder] {
  color: var(--rk-muted);
}

.chevron {
  color: var(--rk-muted);
}

.switch {
  position: relative;
  flex: none;
  width: calc(var(--rk-height) * 1.5);
  height: calc(var(--rk-height) * 0.75);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--rk-off);
  cursor: pointer;
}

.switch[data-state='checked'] {
  background: var(--rk-fg);
}

.thumb {
  display: block;
  width: calc(var(--rk-height) * 0.75 - 4px);
  height: calc(var(--rk-height) * 0.75 - 4px);
  border-radius: 50%;
  background: var(--rk-bg);
  transform: translateX(2px);
  transition: transform 0.15s;
}

.thumb[data-state='checked'] {
  transform: translateX(calc(var(--rk-height) * 0.75 + 2px));
}

.option {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

.option[data-highlighted] {
  background: var(--rk-hover);
}

.option[data-state='checked'] {
  font-weight: 600;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgb(0 0 0 / 0.4);
}

.title {
  margin: 0 0 8px;
  font-size: 18px;
}

.text {
  margin: 0;
  color: var(--rk-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
