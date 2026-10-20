<script setup lang="ts">
import { computed, ref } from "vue";
import DemoCells from "../DemoCells.vue";
import { useMountContext } from "../mount";

const { controls, overlay } = useMountContext();
const size = computed(() => (({ small: "small", medium: "default", large: "large" }) as const)[controls.size]);

const fruits = ["Apple", "Banana", "Cherry"];
const name = ref("");
const fruit = ref<string>();
const enabled = ref(true);
const open = ref(false);
</script>

<template>
  <el-config-provider :size>
    <DemoCells>
      <template #button="{ disabled }">
        <el-button type="primary" :disabled>{{ controls.label }}</el-button>
      </template>

      <template #input="{ disabled }">
        <el-input v-model="name" placeholder="Name" :disabled />
      </template>

      <template #select="{ disabled }">
        <el-select v-model="fruit" placeholder="Fruit" :append-to="overlay" :disabled>
          <el-option v-for="item in fruits" :key="item" :label="item" :value="item" />
        </el-select>
      </template>

      <template #switch="{ disabled }">
        <el-switch v-model="enabled" active-text="Notifications" :disabled />
      </template>

      <template #dialog="{ disabled }">
        <el-button :disabled @click="open = true">Open dialog</el-button>
        <el-dialog v-model="open" title="Element Plus" width="400" :append-to="overlay" :lock-scroll="false">
          This dialog is teleported into the Element Plus overlay host.
          <template #footer>
            <el-button @click="open = false">Close</el-button>
          </template>
        </el-dialog>
      </template>
    </DemoCells>
  </el-config-provider>
</template>
