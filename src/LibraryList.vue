<script setup lang="ts">
import { groups, KIND_LABELS, npmFetchedAt } from "./board";
import LibraryLinks from "./LibraryLinks.vue";
import { controls } from "./store";
import TopBar from "./TopBar.vue";

/**
 * Every library on the compare page, one table per kind with its npm stats and links. It reads
 * only their metadata (board.ts): no library is loaded here.
 */
const total = groups.reduce((sum, group) => sum + group.columns.length, 0);
</script>

<template>
  <div class="shell list" :class="{ 'is-dark': controls.dark }">
    <TopBar page="libraries" />

    <main class="page">
      <h1 class="visually-hidden">Libraries</h1>
      <p class="muted">
        {{ total }} libraries ·
        {{ npmFetchedAt ? `npm data as of ${npmFetchedAt}` : "npm data unavailable" }}
      </p>

      <section v-for="group in groups" :key="group.kind">
        <h2>
          {{ KIND_LABELS[group.kind].name }}
          <span class="muted">{{ group.columns.length }} · {{ KIND_LABELS[group.kind].description }}</span>
        </h2>
        <table>
          <thead>
            <tr>
              <th scope="col">library</th>
              <th scope="col">version</th>
              <th scope="col">released</th>
              <th class="weekly" scope="col">weekly</th>
              <th class="links-cell" scope="col">links</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lib in group.columns" :key="lib.id">
              <th class="name" scope="row">
                <!-- On a light tile in both themes: many logos are dark on a transparent background. -->
                <span class="logo"><img v-if="lib.logo" alt="" :src="lib.logo"></span>
                {{ lib.name }}
              </th>
              <td class="version">{{ lib.version ?? "—" }}</td>
              <td class="released">
                <span
                  v-if="lib.release"
                  :class="{ stale: lib.release.stale }"
                  :title="`latest release ${lib.release.date}${lib.release.stale ? ', over a year ago' : ''}`"
                >
                  {{ lib.release.ago }}
                </span>
                <template v-else>—</template>
              </td>
              <td class="weekly" title="npm downloads, last 7 days">{{ lib.downloads ?? "—" }}</td>
              <td class="links-cell"><LibraryLinks :lib /></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Uses the shell's --avc-* tokens (./tokens.css), like the compare page. */

.list {
  min-block-size: 100dvh;
  background: var(--avc-color-bg);
  color: var(--avc-color-text);
  font-family: var(--avc-font-mono);
  font-size: var(--avc-text-md);
  line-height: var(--avc-leading-normal);
  -webkit-font-smoothing: antialiased;
}

.page {
  max-inline-size: 64rem;
  padding: var(--avc-space-4) var(--avc-space-6) var(--avc-space-6);
}

.muted {
  color: var(--avc-color-text-muted);
  font-weight: normal;
}

p {
  margin: 0;
  font-size: var(--avc-text-sm);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

section {
  margin-block-start: var(--avc-space-6);
}

h2 {
  margin: 0 0 var(--avc-space-2);
  font-size: var(--avc-text-md);

  & .muted {
    font-size: var(--avc-text-sm);
  }
}

/* Fixed column widths, so every kind's table lines up with the others. */
table {
  inline-size: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--avc-text-sm);
  font-variant-numeric: tabular-nums;
}

th,
td {
  padding: var(--avc-space-2);
  border-block-end: 1px solid var(--avc-color-border);
  text-align: start;
}

thead th {
  color: var(--avc-color-text-muted);
  font-weight: normal;

  /* The name takes what's left; the others are as wide as their longest value. */
  &:nth-child(2) {
    inline-size: 8rem;
  }

  &:nth-child(3) {
    inline-size: 9rem;
  }

  &:nth-child(4) {
    inline-size: 6rem;
  }

  &:nth-child(5) {
    inline-size: 6.5rem;
  }
}

.name {
  font-family: var(--avc-font-sans);
  font-size: var(--avc-text-md);
  font-weight: var(--avc-weight-semibold);
}

.logo {
  display: inline-grid;
  place-items: center;
  box-sizing: border-box;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  margin-inline-end: var(--avc-space-2);
  padding: 0.25rem;
  border: 1px solid var(--avc-color-border);
  border-radius: var(--avc-radius-sm);
  background: oklch(100% 0 0);
  vertical-align: middle;

  & img {
    max-inline-size: 100%;
    max-block-size: 100%;
  }
}

.version,
.released {
  color: var(--avc-color-text-muted);
}

.stale {
  color: var(--avc-color-warning);
}

.weekly {
  text-align: end;
}

.links-cell {
  & .links {
    justify-content: flex-end;
  }
}

thead .links-cell {
  text-align: end;
}

/* Phones: each library on two lines, its name with its docs and GitHub links, then version ·
   release · downloads. */
@media (width < 40rem) {
  .page {
    padding-inline: var(--avc-space-4);
  }

  thead {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  tbody tr {
    display: grid;
    grid-template-areas: "name name name links"
      "version released weekly weekly";
    grid-template-columns: auto auto 1fr auto;
    align-items: center;
    column-gap: var(--avc-space-2);
    padding-block: var(--avc-space-2);
    border-block-end: 1px solid var(--avc-color-border);
  }

  tbody th,
  tbody td {
    padding: 0;
    border: 0;
    white-space: nowrap;
  }

  .name {
    grid-area: name;
  }

  .version {
    grid-area: version;
  }

  .released {
    grid-area: released;

    &::before {
      content: "· ";
    }
  }

  .weekly {
    grid-area: weekly;
    color: var(--avc-color-text-muted);
    text-align: start;

    &::before {
      content: "· ";
    }

    &::after {
      content: " / week";
    }
  }

  .links-cell {
    grid-area: links;

    & :deep(.npm) {
      display: none;
    }
  }
}
</style>
