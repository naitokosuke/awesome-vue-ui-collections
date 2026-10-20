<script setup lang="ts">
import { Button } from "@vizejs/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@vizejs/ui/dialog";
import { Field, FieldLabel } from "@vizejs/ui/field";
import { Input } from "@vizejs/ui/input";
import { NativeSelect } from "@vizejs/ui/native-select";
import { Switch } from "@vizejs/ui/switch";
import { computed, ref, useId } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();

// Theme scope attributes (see `themeScopeAttributes` in @vizejs/ui/theme-scope):
// a preset plus the density scale, which drives control heights and spacing.
const scope = computed(() => ({
  "data-vize-theme": "headless",
  "data-vize-density": ({ small: "compact", medium: undefined, large: "comfortable" } as const)[controls.size],
}));

const fruits = [
  { value: "", label: "Fruit", disabled: true },
  ...["Apple", "Banana", "Cherry"].map((label) => ({ value: label, label })),
];
const name = ref("");
const fruit = ref("");
const enabled = ref(true);
const open = ref(false);
const switchLabel = useId();
/** Field's label points at `id`; Input doesn't pick it up on its own, so both get it. */
const nameId = useId();
</script>

<template>
  <!-- Each cell's frame is a theme scope. No background: the demo sits on the shell's canvas like every other library. -->
  <DemoCells v-bind="scope" style="color: var(--vize-ui-color-text); font-family: var(--vize-ui-type-family-sans)">
    <template #button="{ disabled }">
      <Button :disabled>{{ controls.label }}</Button>
    </template>

    <!-- Visible label like the other headless demos; Field wires it to the input. -->
    <template #input="{ disabled }">
      <Field :id="nameId" class="field-group" name="name">
        <FieldLabel class="field-label">Name</FieldLabel>
        <Input :id="nameId" v-model="name" class="field" placeholder="Name" :disabled />
      </Field>
    </template>

    <template #select="{ disabled }">
      <NativeSelect v-model="fruit" aria-label="Fruit" class="field select" :options="fruits" :disabled />
    </template>

    <template #switch="{ disabled }">
      <div class="switch">
        <Switch v-model="enabled" :aria-labelledby="switchLabel" :disabled />
        <span :id="switchLabel">Notifications</span>
      </div>
    </template>

    <template #dialog="{ disabled }">
      <Button class="secondary" :disabled @press="open = true">Open dialog</Button>
      <Dialog v-model:open="open">
        <DialogPortal :to="overlay">
          <!-- Re-open a theme scope: the portal content lives outside the cell. -->
          <div v-bind="scope">
            <DialogOverlay />
            <!-- lock-scroll would set overflow on <html>/<body>. -->
            <DialogContent class="dialog" :lock-scroll="false">
              <DialogTitle>Vize UI</DialogTitle>
              <DialogDescription>This dialog is teleported into the Vize UI overlay host.</DialogDescription>
              <div class="actions">
                <Button class="secondary" @press="open = false">Close</Button>
              </div>
            </DialogContent>
          </div>
        </DialogPortal>
      </Dialog>
    </template>
  </DemoCells>
</template>

<style scoped>
/*
 * Vize UI's Button has a single (accent) look; flip its tokens locally for the
 * outlined secondary buttons the other headless demos use for the dialog.
 */
.secondary {
  --vize-ui-color-accent: var(--hl-bg);
  --vize-ui-color-accent-contrast: var(--hl-fg);
  box-shadow: inset 0 0 0 1px var(--hl-border);
}

.field {
  flex: 1;
  min-width: 0;
}

.field-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field-label {
  color: var(--hl-muted);
}

/* @vizejs/ui ships no visual layer for NativeSelect; mirror component-input.css. */
.select {
  box-sizing: border-box;
  min-block-size: calc(var(--vize-ui-size-control-md) * var(--vize-ui-input-height-scale, 1));
  padding-block: var(--vize-ui-space-xs);
  padding-inline: var(--vize-ui-space-md);
  border: var(--vize-ui-input-border-width, var(--vize-ui-border-width-thin)) solid var(--vize-ui-color-border);
  border-radius: var(--vize-ui-input-radius, var(--vize-ui-radius-sm));
  background-color: var(--vize-ui-color-surface);
  color: var(--vize-ui-color-text);
  font-family: var(--vize-ui-input-font-family, var(--vize-ui-type-family-sans));
  font-size: var(--vize-ui-type-size-sm);
  line-height: var(--vize-ui-type-leading-normal);
}

.select:focus-visible {
  border-color: var(--vize-ui-color-accent);
  outline: var(--vize-ui-focus-ring-width) solid var(--vize-ui-focus-ring-color);
  outline-offset: var(--vize-ui-focus-ring-offset);
}

.select:disabled {
  opacity: var(--vize-ui-opacity-disabled);
  cursor: not-allowed;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--vize-ui-space-sm);
  font-size: var(--vize-ui-type-size-sm);
}

/* DialogContent puts `class` on its host wrapper; size the content element itself. */
.dialog :deep([data-vize-ui='dialog-content']) {
  inline-size: min(400px, 100vw - 2rem);
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
