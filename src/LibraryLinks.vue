<script setup lang="ts">
import IconBookOpen from "~icons/lucide/book-open";
import IconGithub from "~icons/lucide/github";
import IconPackage from "~icons/lucide/package";
import type { Column } from "./board";

defineProps<{ lib: Pick<Column, "name" | "docs" | "package" | "github"> }>();
</script>

<template>
  <!-- Links leave the page: the icons say where to, the tooltip says it opens a new tab. -->
  <span class="links">
    <a
      :href="lib.docs"
      rel="noopener noreferrer"
      target="_blank"
      :title="`${lib.name} docs (opens in a new tab)`"
      :aria-label="`${lib.name} docs (opens in a new tab)`"
    >
      <IconBookOpen aria-hidden="true" />
    </a>
    <a
      v-if="lib.package"
      class="npm"
      :href="`https://npmx.dev/package/${lib.package}`"
      rel="noopener noreferrer"
      target="_blank"
      :title="`${lib.package} on npmx.dev (opens in a new tab)`"
      :aria-label="`${lib.package} on npmx.dev (opens in a new tab)`"
    >
      <IconPackage aria-hidden="true" />
    </a>
    <a
      v-if="lib.github"
      :href="lib.github.url"
      rel="noopener noreferrer"
      target="_blank"
      :title="`${lib.github.slug} on GitHub (opens in a new tab)`"
      :aria-label="`${lib.github.slug} on GitHub (opens in a new tab)`"
    >
      <IconGithub aria-hidden="true" />
    </a>
  </span>
</template>

<style scoped>
/* Uses the shell's --avc-* tokens (./tokens.css). */

.links {
  display: flex;
  gap: var(--avc-space-1);
}

/* Icon-only links still get a full-size target. */
a {
  display: grid;
  place-items: center;
  inline-size: var(--avc-target-min);
  block-size: var(--avc-target-min);
  border-radius: var(--avc-radius-sm);
  color: var(--avc-color-text-muted);

  &:hover {
    background: var(--avc-color-subtle);
    color: var(--avc-color-text);
  }

  &:focus-visible {
    outline: var(--avc-focus-ring);
    outline-offset: 0;
  }
}

svg {
  inline-size: 1rem;
  block-size: 1rem;
}
</style>
