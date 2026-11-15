<script setup lang="ts">
import { ConfigProvider } from "reka-ui";
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";
import NotProvided from "../NotProvided.vue";
import { Button } from "./ui/button";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorTrigger,
} from "./ui/model-selector";
import {
  PromptInput,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputTextarea,
} from "./ui/prompt-input";
import { Suggestion } from "./ui/suggestion";

const { controls, overlay } = useMountContext();

const buttonSize = computed(() => (({ small: "sm", medium: "default", large: "lg" }) as const)[controls.size]);
// PromptInputSelectTrigger has shadcn's `sm` / `default` sizes only: match the button heights.
const height = computed(() => (({ small: "h-8", medium: "h-9", large: "h-10" }) as const)[controls.size]);

const fruits = ["Apple", "Banana", "Cherry"];
const fruit = ref<string>();
const open = ref(false);
</script>

<template>
  <!--
    teleport-to: SelectContent / DialogContent wrap Reka's portals without a `to`,
    so they render into the overlay host. scroll-body=false drops the scrollbar padding.
  -->
  <ConfigProvider :teleport-to="overlay" :scroll-body="false">
    <DemoCells style="color: var(--foreground)">
      <!-- A prompt suggestion chip, the library's button. -->
      <template #button="{ disabled }">
        <Suggestion :suggestion="controls.label" :size="buttonSize" :disabled />
      </template>

      <!--
        PromptInput's form with only its textarea, which keeps its own text. PromptInput's `class`
        goes to the form inside its root <div>, so the wrapper sizes the root.
      -->
      <template #input="{ disabled }">
        <div class="w-full">
          <PromptInput>
            <PromptInputTextarea class="min-h-0" :rows="1" placeholder="Name" :disabled />
          </PromptInput>
        </div>
      </template>

      <template #select="{ disabled }">
        <PromptInputSelect v-model="fruit" :disabled>
          <PromptInputSelectTrigger class="w-48" :class="height" aria-label="Fruit">
            <PromptInputSelectValue placeholder="Fruit" />
          </PromptInputSelectTrigger>
          <!-- body-lock / outside-pointer-events would set overflow and pointer-events on <body> -->
          <PromptInputSelectContent :body-lock="false" :disable-outside-pointer-events="false">
            <PromptInputSelectItem v-for="item in fruits" :key="item" :value="item">{{ item }}</PromptInputSelectItem>
          </PromptInputSelectContent>
        </PromptInputSelect>
      </template>

      <template #switch>
        <NotProvided note="No switch component" />
      </template>

      <!--
        modal=false: a modal Reka dialog always locks the page (body overflow:hidden,
        body pointer-events:none, aria-hidden siblings) with no opt-out, and shadcn's
        DialogOverlay only renders for modal dialogs. The backdrop is plain markup instead.
      -->
      <template #dialog="{ disabled }">
        <Teleport :to="overlay">
          <div v-if="open" class="fixed inset-0 z-50 bg-black/80" />
        </Teleport>
        <ModelSelector v-model:open="open" :modal="false">
          <ModelSelectorTrigger as-child>
            <Button variant="outline" :size="buttonSize" :disabled>Open dialog</Button>
          </ModelSelectorTrigger>
          <ModelSelectorContent title="AI Elements Vue">
            <ModelSelectorInput placeholder="Search fruits…" />
            <ModelSelectorList>
              <ModelSelectorEmpty>No fruit found.</ModelSelectorEmpty>
              <ModelSelectorGroup heading="Fruits">
                <ModelSelectorItem v-for="item in fruits" :key="item" :value="item" @select="open = false">
                  {{ item }}
                </ModelSelectorItem>
              </ModelSelectorGroup>
            </ModelSelectorList>
            <p class="text-muted-foreground border-t px-3 py-2 text-sm">
              This dialog is teleported into the AI Elements Vue overlay host.
            </p>
          </ModelSelectorContent>
        </ModelSelector>
      </template>
    </DemoCells>
  </ConfigProvider>
</template>
