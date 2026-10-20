<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();
const buttonSize = computed(() => (({ small: "small", medium: "normal", large: "large" }) as const)[controls.size]);
const fieldSize = computed(() => (controls.size === "large" ? "large" : "normal"));
const switchSize = computed(() => ({ small: "20px", medium: "26px", large: "32px" })[controls.size]);

// Vant is a mobile library without a Select; DropdownMenu is its closest equivalent.
const fruits = ["Apple", "Banana", "Cherry"].map((text) => ({ text, value: text }));
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <DemoCells>
    <template #button="{ disabled }">
      <van-button type="primary" :size="buttonSize" :disabled>{{ controls.label }}</van-button>
    </template>

    <template #input="{ disabled }">
      <van-field v-model="name" placeholder="Name" :size="fieldSize" :disabled />
    </template>

    <template #select="{ disabled }">
      <van-dropdown-menu class="grow">
        <van-dropdown-item
          v-model="fruit"
          :title="fruit ? undefined : 'Fruit'"
          :options="fruits"
          :teleport="overlay"
          :disabled
        />
      </van-dropdown-menu>
    </template>

    <template #switch="{ disabled }">
      <div class="switch">
        <van-switch v-model="enabled" :size="switchSize" :disabled />
        <span class="text">Notifications</span>
      </div>
    </template>

    <template #dialog="{ disabled }">
      <van-button :size="buttonSize" :disabled @click="open = true">Open dialog</van-button>
      <van-dialog
        v-model:show="open"
        confirm-button-text="Close"
        message="This dialog is teleported into the Vant overlay host."
        title="Vant"
        :width="400"
        :teleport="overlay"
        :lock-scroll="false"
      />
    </template>
  </DemoCells>
</template>

<style scoped>
.grow {
  flex: 1;
}

.switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text {
  color: var(--van-text-color);
}
</style>
