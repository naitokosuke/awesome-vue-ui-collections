# awesome-vue-ui-collections

A side-by-side comparison of Vue UI libraries on one page
Every library renders the same five demos (button, input, select, switch, dialog) in its own column, so their look and behavior can be compared row by row

The libraries are grouped into four tabs

- Styled libraries ship a complete visual design as a package (Vuetify, Element Plus, Naive UI, Quasar, …)
- Copy-paste libraries are styled components a CLI copies into your project (shadcn-vue, Inspira UI)
- Headless libraries are unstyled, accessible primitives (Reka UI, Vuetify0, Vize UI, Akaza UI)
- Fancy libraries are animated, effect-first components (Vue Bits)

The page can switch dark mode, size, primary color, the button label and each row's disabled state
Column headers show npm stats (version, release age, weekly downloads) fetched at build time

## How libraries share one page

Each library is mounted as its own Vue app, so its plugins and global config stay inside it
Its demos are teleported into the table cells, and its dialogs and popups go into an overlay host of its own

Each library's global CSS is rewritten at build time to apply only under `[data-lib="<id>"]` (see `build/scope-library-css.ts`)
Where a library still writes to `<html>` or `<body>` at runtime, its adapter in `src/libs/<id>/index.ts` turns that off or undoes it, with the reason in a comment

## Development

This project uses [Vite+](https://viteplus.dev) (`vp`) with [Vize](https://vizejs.dev) for `.vue` files, and pnpm

```bash
vp install
```

```bash
vp dev
```

`vp run check` formats, lints and type-checks everything

```bash
vp run check
```

`vp test run` runs three test projects

- `unit` covers the pure helpers (CSS scoping, npm stats, dates, saved controls, colors)
- `build` builds the site for production and checks that every shipped CSS rule is scoped
- `browser` loads every library into the shell in headless Chromium and checks that nothing reaches outside its scope, including after unmounting

```bash
vp test run
```

The browser tests need Playwright's Chromium once

```bash
vp exec playwright install chromium
```

`vp run build` type-checks and builds into `dist`
It fetches npm stats (retrying failed requests) and fails if any package's stats, weekly downloads included, can't be fetched, so a build never ships with silently missing numbers

```bash
vp run build
```

## Adding a library

Create `src/libs/<id>/` with three files

- `meta.ts` holds the library's static info (name, package, kind, column order, the CSS files to scope, dark-mode attributes)
- `index.ts` exports `mount(context)`, which creates the library's app with `mountLibrary()` and pushes the shared primary color into it
- `Demos.vue` renders `<DemoCells>` with one slot per demo row, using `<NotProvided>` for a row the library has no component for

Anything `mount()` changes outside its app goes through `workaround()` (`src/libs/mount.ts`): why it's needed, what it relies on in the library (checked first, so an upgrade that breaks it shows as an error in the column), and how to undo it
Then run `vp test run`, which fails if the library's CSS or DOM side effects leak, or if a demo is taller than `ROW_HEIGHTS` in `src/Shell.vue` allows
