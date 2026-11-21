<script setup lang="ts">
import { controls } from "./store";
import ToggleSwitch from "./ToggleSwitch.vue";

defineProps<{
  /** The page it's on, marked current in the navigation. */
  page: "compare" | "libraries";
  /** On phones the theme switch is in the page's settings instead (see Shell.vue). */
  themeInSettings?: boolean;
}>();

const PAGES = [
  { id: "compare", href: import.meta.env.BASE_URL },
  { id: "libraries", href: `${import.meta.env.BASE_URL}libraries/` },
] as const;
</script>

<template>
  <header class="topbar">
    <span class="brand">awesome-vue-ui-collections</span>
    <nav aria-label="Pages" class="nav">
      <a v-for="{ id, href } in PAGES" :key="id" :href :aria-current="id === page ? 'page' : undefined">{{ id }}</a>
    </nav>
    <!-- The page's own controls, before the theme switch. -->
    <slot />
    <!-- Theme is a page setting, not part of what is compared, so it lives up here. -->
    <ToggleSwitch v-model="controls.isDark" class="theme" :class="{ 'in-settings': themeInSettings }"
    >dark</ToggleSwitch>
  </header>
</template>

<style scoped>
/* Uses the shell's --avc-* tokens (./tokens.css). */

.topbar {
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--avc-space-6);
  box-sizing: border-box;
  block-size: var(--avc-topbar-size);
  padding: 0 var(--avc-space-6);
  border-block-end: 1px solid var(--avc-color-border);
  background: var(--avc-color-bg);
}

.brand {
  font-weight: var(--avc-weight-bold);
}

/* Like the kind tabs: the current page is underlined, on the top bar's bottom line. */
.nav {
  display: flex;
  align-self: stretch;
  gap: var(--avc-space-4);
  margin-inline-end: auto;

  & a {
    display: flex;
    align-items: center;
    margin-block-end: -1px;
    border-block: 2px solid transparent;
    color: var(--avc-color-text-muted);
    font-size: var(--avc-text-sm);
    text-decoration: none;

    &:hover {
      color: var(--avc-color-text);
    }

    &[aria-current="page"] {
      border-block-end-color: var(--avc-color-text);
      color: var(--avc-color-text);
      font-weight: var(--avc-weight-bold);
    }

    &:focus-visible {
      outline: var(--avc-focus-ring);
      outline-offset: 2px;
    }
  }
}

.theme {
  flex-shrink: 0;
}

@media (width < 40rem) {
  .topbar {
    gap: var(--avc-space-4);
    padding-inline: var(--avc-space-4);
  }

  .brand {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav {
    flex-shrink: 0;
  }

  .theme.in-settings {
    display: none;
  }
}
</style>
