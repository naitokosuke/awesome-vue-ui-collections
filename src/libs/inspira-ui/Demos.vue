<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";
import NotProvided from "../NotProvided.vue";
import {
  AnimatedModal,
  AnimatedModalBody,
  AnimatedModalContent,
  AnimatedModalFooter,
  AnimatedModalTrigger,
} from "./ui/animated-modal";
import { IInput } from "./ui/input";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";

const { controls, overlay } = useMountContext();

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
  <DemoCells style="color: var(--foreground)">
    <template #button="{ disabled }">
      <InteractiveHoverButton :text="controls.label" :class="[text, disabledLook].join(' ')" :disabled />
    </template>

    <template #input="{ disabled }">
      <IInput v-model="name" container-class="w-full" placeholder="Name" :class="inputSize" :disabled />
    </template>

    <template #select>
      <NotProvided note="No select component" />
    </template>

    <template #switch>
      <NotProvided note="No switch component" />
    </template>

    <!--
      teleport-to: the modal layer renders into the overlay host (default: body).
      lock-scroll=false: would otherwise lock <body> scroll (VueUse useScrollLock).
    -->
    <template #dialog="{ disabled }">
      <AnimatedModal v-slot="{ closeModal }" v-model:open="open">
        <AnimatedModalTrigger
          class="border-border bg-background text-foreground hover:bg-accent border font-medium"
          :class="text"
          :disabled
        >
          Open dialog
        </AnimatedModalTrigger>
        <AnimatedModalBody :teleport-to="overlay" :lock-scroll="false" class="w-[min(420px,calc(100vw-32px))]">
          <AnimatedModalContent class="md:p-8">
            <h3 class="text-xl font-semibold">Inspira UI</h3>
            <p class="text-muted-foreground mt-2 text-sm">This dialog is teleported into the Inspira UI overlay host.</p
            >
          </AnimatedModalContent>
          <AnimatedModalFooter>
            <InteractiveHoverButton class="text-sm" text="Close" @click="closeModal" />
          </AnimatedModalFooter>
        </AnimatedModalBody>
      </AnimatedModal>
    </template>
  </DemoCells>
</template>
