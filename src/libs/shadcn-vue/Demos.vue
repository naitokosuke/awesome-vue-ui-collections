<script setup lang="ts">
import { ConfigProvider } from "reka-ui";
import { computed, ref, useId } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

const { controls, overlay } = useMountContext();
const id = useId();

const buttonSize = computed(() => (({ small: "sm", medium: "default", large: "lg" }) as const)[controls.size]);
// Input and Select have no size prop (Select only `sm`/`default`): match the button heights.
const height = computed(() => (({ small: "h-8", medium: "h-9", large: "h-10" }) as const)[controls.size]);
// Switch has one size, shadcn's default: scaled (layout included) around it, like the other columns' switches.
const switchZoom = computed(() => ({ small: 0.875, medium: 1, large: 1.25 })[controls.size]);

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <!--
    teleport-to: SelectContent / DialogContent wrap Reka's portals without a `to`,
    so they render into the overlay host. scroll-body=false drops the scrollbar padding.
  -->
  <ConfigProvider :teleport-to="overlay" :scroll-body="false">
    <DemoCells style="color: var(--foreground)">
      <template #button="{ disabled }">
        <Button :size="buttonSize" :disabled>{{ controls.label }}</Button>
      </template>

      <template #input="{ disabled }">
        <Input v-model="name" placeholder="Name" :class="height" :disabled />
      </template>

      <template #select="{ disabled }">
        <Select v-model="fruit" :disabled>
          <SelectTrigger class="w-48 data-[size=default]:h-auto" :class="height" aria-label="Fruit">
            <SelectValue placeholder="Fruit" />
          </SelectTrigger>
          <!-- body-lock / outside-pointer-events would set overflow and pointer-events on <body> -->
          <SelectContent :body-lock="false" :disable-outside-pointer-events="false">
            <SelectItem v-for="item in fruits" :key="item" :value="item">{{ item }}</SelectItem>
          </SelectContent>
        </Select>
      </template>

      <template #switch="{ disabled }">
        <div class="flex items-center gap-2">
          <Switch :id="`${id}-switch`" v-model="enabled" :disabled :style="{ zoom: switchZoom }" />
          <Label :for="`${id}-switch`">Notifications</Label>
        </div>
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
        <Dialog v-model:open="open" :modal="false">
          <DialogTrigger as-child>
            <Button variant="outline" :size="buttonSize" :disabled>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>shadcn-vue</DialogTitle>
              <DialogDescription>This dialog is teleported into the shadcn-vue overlay host.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
    </DemoCells>
  </ConfigProvider>
</template>
