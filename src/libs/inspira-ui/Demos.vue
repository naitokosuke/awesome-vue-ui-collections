<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { controls } from "../../store";
import NotProvided from "../NotProvided.vue";
import { overlayKey } from "../mount";
import type { DemoKey } from "../types";
import {
  AnimatedModal,
  AnimatedModalBody,
  AnimatedModalContent,
  AnimatedModalFooter,
  AnimatedModalTrigger,
} from "./ui/animated-modal";
import { IInput } from "./ui/input";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";

defineProps<{ demo: DemoKey }>();

const overlay = inject(overlayKey)!;

// None of these components has a size prop: scale them through their `class` prop.
const text = computed(() => (({ small: "text-sm", medium: "text-base", large: "text-lg" }) as const)[controls.size]);
const inputSize = computed(
  () => (({ small: "h-8 text-xs", medium: "h-10 text-sm", large: "h-12 text-base" }) as const)[controls.size],
);
// InteractiveHoverButton has no disabled styling; the attribute falls through to its <button>.
const disabledLook = "disabled:pointer-events-none disabled:opacity-50";

const name = ref("");
const open = ref(false);
</script>

<template>
  <div v-if="demo === 'button'" class="demo">
    <InteractiveHoverButton
      :text="controls.label"
      :class="[text, disabledLook].join(' ')"
      :disabled="controls.disabled[demo]"
    />
  </div>

  <div v-else-if="demo === 'input'" class="demo">
    <IInput
      v-model="name"
      container-class="w-full"
      placeholder="Name"
      :class="inputSize"
      :disabled="controls.disabled[demo]"
    />
  </div>

  <!--
    teleport-to: the modal layer renders into the overlay host (default: body).
    lock-scroll=false: would otherwise lock <body> scroll (VueUse useScrollLock).
  -->
  <div v-else-if="demo === 'dialog'" class="demo">
    <AnimatedModal v-slot="{ closeModal }" v-model:open="open">
      <AnimatedModalTrigger
        class="border-border bg-background text-foreground hover:bg-accent border font-medium"
        :class="text"
        :disabled="controls.disabled[demo]"
      >
        Open dialog
      </AnimatedModalTrigger>
      <AnimatedModalBody :teleport-to="overlay" :lock-scroll="false" class="w-[min(420px,calc(100vw-32px))]">
        <AnimatedModalContent class="md:p-8">
          <h3 class="text-xl font-semibold">Inspira UI</h3>
          <p class="text-muted-foreground mt-2 text-sm">This dialog is teleported into the Inspira UI overlay host.</p>
        </AnimatedModalContent>
        <AnimatedModalFooter>
          <InteractiveHoverButton class="text-sm" text="Close" @click="closeModal" />
        </AnimatedModalFooter>
      </AnimatedModalBody>
    </AnimatedModal>
  </div>

  <NotProvided v-else-if="demo === 'select'" note="No select component" />
  <NotProvided v-else note="No switch component" />
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  color: var(--foreground);
}
</style>
