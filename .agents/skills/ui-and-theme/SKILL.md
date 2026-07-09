---
name: ui-and-theme
description: >
  Frontend/design system skill for the svelteflare monorepo. Use this whenever
  the user wants to build or modify UI — pages, sections, components, layouts,
  forms, cards, tables, dialogs, dashboards, or landing pages. Also invoke for
  anything theme-related: light/dark mode, custom colors, design tokens,
  typography, or spacing. Trigger on "add a [card/table/dialog/form/dashboard]",
  "build a [landing/marketing] section", "change the theme", "add dark mode",
  "customize colors", "install [shadcn component]", "make it look like X",
  "style this", "create a [component]". When in doubt, invoke — this skill
  prevents hard-coded colors, raw HTML elements, and design inconsistencies.
---

# UI and Theme

Build all UI from **shadcn-svelte components** and **theme CSS variables only**. Never use raw hex/rgb colors or arbitrary Tailwind values for anything that should adapt to the theme.

## Stack at a glance

| Layer | Detail |
|---|---|
| Component library | shadcn-svelte (style: **vega**), built on bits-ui primitives |
| CSS framework | Tailwind CSS **v4** (no `tailwind.config.js` — all config lives in CSS) |
| Token system | CSS custom properties in `packages/ui/src/global.css`, bridged via `@theme inline` |
| Dark mode | Class-based (`.dark` on `<html>`), managed by `mode-watcher` |
| Icons | `unplugin-icons` — import as `~icons/lucide/<name>` |
| Fonts | Inter Variable (sans), Geist Mono (mono) |

## Using components

Components live in `packages/ui` and are imported by the web app as `@repo/ui`.

```svelte
<script lang="ts">
  import { Button, Card, Badge, Input, Form } from '@repo/ui'
</script>

<!-- Namespace pattern — components are objects, not default exports -->
<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>...</Card.Content>
  <Card.Footer>
    <Button.Root variant="default">Action</Button.Root>
    <Button.Root variant="outline">Cancel</Button.Root>
  </Card.Footer>
</Card.Root>
```

### Currently installed components

`badge`, `button`, `card`, `form`, `input`, `label`, `sonner` (toasts), `switch`, `tooltip`

### Installing a missing component

Use the official shadcn-svelte CLI, run from the `packages/ui` directory:

```bash
cd packages/ui && pnpm dlx shadcn-svelte@latest add <component-name>
# e.g.:
cd packages/ui && pnpm dlx shadcn-svelte@latest add table
cd packages/ui && pnpm dlx shadcn-svelte@latest add dialog
cd packages/ui && pnpm dlx shadcn-svelte@latest add select
cd packages/ui && pnpm dlx shadcn-svelte@latest add dropdown-menu
cd packages/ui && pnpm dlx shadcn-svelte@latest add avatar
cd packages/ui && pnpm dlx shadcn-svelte@latest add separator
cd packages/ui && pnpm dlx shadcn-svelte@latest add sheet
cd packages/ui && pnpm dlx shadcn-svelte@latest add tabs
```

Or via the monorepo script shortcut (same thing):

```bash
pnpm --filter @repo/ui ui:add <component-name>
```

After installing, export the new component from `packages/ui/src/index.ts`:

```ts
export * as Dialog from './components/ui/dialog/index.js';
export * as Table from './components/ui/table/index.js';
// etc.
```

Then import in any page/component via `import { Dialog, Table } from '@repo/ui'`.

### Button variants

`default` | `secondary` | `destructive` | `outline` | `ghost` | `link`

```svelte
<Button.Root variant="ghost" size="icon" onclick={handler}>
  <SomeIcon class="size-4" />
</Button.Root>
```

## Theme tokens

All semantic color tokens are CSS custom properties. Use them via Tailwind utilities — **never hardcode colors**.

### Core palette

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--background` | white | near-black | page background |
| `--foreground` | near-black | white | body text |
| `--card` | white | dark-gray | card surfaces |
| `--card-foreground` | near-black | white | text on cards |
| `--primary` | near-black | white | primary actions |
| `--primary-foreground` | white | near-black | text on primary |
| `--secondary` | light-gray | dark-gray | secondary actions |
| `--muted` | light-gray | dark-gray | subtle backgrounds |
| `--muted-foreground` | medium-gray | medium-gray | placeholder/helper text |
| `--accent` | light-gray | dark-gray | hover states |
| `--destructive` | red | red | errors/danger |
| `--border` | light-gray | white/10% | borders |
| `--input` | light-gray | white/15% | input borders |
| `--ring` | near-black | gray | focus rings |
| `--sidebar` | off-white | dark-gray | sidebar surface |

### Tailwind class patterns

```svelte
<!-- Surface and text -->
<div class="bg-background text-foreground" />
<div class="bg-card text-card-foreground" />
<div class="bg-muted text-muted-foreground" />

<!-- Borders -->
<div class="border border-border" />

<!-- Opacity variants work -->
<span class="text-foreground/60" />  <!-- 60% opacity foreground -->
<div class="bg-background/80 backdrop-blur-sm" />

<!-- Radius tokens -->
<div class="rounded-sm" />  <!-- calc(radius - 4px) -->
<div class="rounded-md" />  <!-- calc(radius - 2px) -->
<div class="rounded-lg" />  <!-- var(--radius) = 0.5rem -->
<div class="rounded-xl" />  <!-- calc(radius + 4px) -->
```

## Customizing the theme

Tokens live in `packages/ui/src/global.css`. Edit `:root` (light) and `.dark` blocks using oklch values.

```css
:root {
  --primary: oklch(0.45 0.18 250);           /* blue-ish primary */
  --primary-foreground: oklch(0.985 0 0);
  --radius: 0.75rem;                          /* rounder corners */
}

.dark {
  --primary: oklch(0.65 0.18 250);           /* lighter in dark mode */
}
```

To add a brand color as a new token:

```css
/* In :root / .dark */
--brand: oklch(0.55 0.20 260);
--brand-foreground: oklch(0.98 0 0);

/* In @theme inline block */
--color-brand: var(--brand);
--color-brand-foreground: var(--brand-foreground);
```

Then use `bg-brand`, `text-brand-foreground` etc. in Tailwind.

## Dark mode

Mode is managed by `mode-watcher` (already wired in the root layout).

```svelte
<script lang="ts">
  import { mode, ModeWatcher } from 'mode-watcher'
  import { settings } from '$lib/state/settings.svelte'

  const toggle = () => settings.setColorMode(mode.current === 'dark' ? 'light' : 'dark')
</script>

<ModeWatcher />  <!-- place once in root layout only -->
```

Dark-mode-conditional styles use the `dark:` prefix:

```svelte
<div class="bg-white dark:bg-zinc-900 text-black dark:text-white" />
```

The `.dark` class variant is defined in `global.css` as `@custom-variant dark (&:is(.dark *))`.

## Icons

Always use `unplugin-icons` — never install or import from `lucide-svelte` or any other icon package directly. The `~icons/` virtual import is resolved by the bundler at build time.

```svelte
<script lang="ts">
  import MoonIcon from '~icons/lucide/moon'
  import SunIcon from '~icons/lucide/sun'
  import PlusIcon from '~icons/lucide/plus'
</script>

<PlusIcon class="size-4" />
```

Browse available icons at lucide.dev. The import path is always `~icons/lucide/<kebab-name>`.

**Wrong** — do not do this:
```svelte
import { Moon } from 'lucide-svelte'   // ❌ wrong package
```

## Forms

Uses sveltekit-superforms + formsnap + zod. See `build-feature` skill for the full pattern. Quick reference:

```svelte
<Form.Field {form} name="email">
  <Form.Control>
    {#snippet children({ props })}
      <Form.Label>Email</Form.Label>
      <Input {...props} type="email" bind:value={$formData.email} />
    {/snippet}
  </Form.Control>
  <Form.FieldErrors />
</Form.Field>
```

## Common UI patterns

### Dashboard card grid

```svelte
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
      <Card.Title class="text-sm font-medium">Metric</Card.Title>
      <SomeIcon class="size-4 text-muted-foreground" />
    </Card.Header>
    <Card.Content>
      <div class="text-2xl font-bold">1,234</div>
      <p class="text-xs text-muted-foreground">+12% from last month</p>
    </Card.Content>
  </Card.Root>
</div>
```

### Landing hero section

```svelte
<section class="flex flex-col items-center gap-6 py-24 text-center">
  <Badge.Root variant="secondary">New</Badge.Root>
  <h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">Headline</h1>
  <p class="max-w-xl text-lg text-muted-foreground">Subheadline copy here.</p>
  <div class="flex gap-3">
    <Button.Root size="lg">Get started</Button.Root>
    <Button.Root size="lg" variant="outline">Learn more</Button.Root>
  </div>
</section>
```

### Data table (after installing `table` component)

```svelte
<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head class="text-right">Actions</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each rows as row}
      <Table.Row>
        <Table.Cell class="font-medium">{row.name}</Table.Cell>
        <Table.Cell><Badge.Root>{row.status}</Badge.Root></Table.Cell>
        <Table.Cell class="text-right">
          <Button.Root variant="ghost" size="sm">Edit</Button.Root>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

### Dialog

```svelte
<script lang="ts">
  import { Dialog } from '@repo/ui'
  let open = $state(false)
</script>

<Button.Root onclick={() => open = true}>Open</Button.Root>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Confirm action</Dialog.Title>
      <Dialog.Description>This cannot be undone.</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button.Root variant="outline" onclick={() => open = false}>Cancel</Button.Root>
      <Button.Root variant="destructive">Delete</Button.Root>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

## Where things live

| What | Location |
|---|---|
| Shared components (used across pages) | `packages/ui/src/components/ui/<name>/` |
| Shared component exports | `packages/ui/src/index.ts` |
| Theme tokens | `packages/ui/src/global.css` |
| Page-local components | `apps/web/src/lib/components/` |
| Global CSS (web app) | `apps/web/src/main.css` |
| App-level layout | `apps/web/src/routes/+layout.svelte` |

When a component is needed in one page only, put it in `apps/web/src/lib/components/`. When it'll be reused across multiple pages or in a future project, put it in `packages/ui`.
