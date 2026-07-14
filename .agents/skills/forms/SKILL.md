---
name: forms
description: >
  Form handling skill for the svelteflare monorepo. Use this whenever the user
  wants to add, build, or modify any form — login forms, settings forms, profile
  editors, onboarding flows, multi-step wizards, or any input that validates and
  submits data. Covers the full stack: Zod schema, superforms setup, FormSnap
  field components, field-level errors, loading/success/error states, and toast
  feedback. Trigger on "add a form", "build a form for X", "create a settings
  page", "add a field", "handle form submission", "validate input", "show errors",
  "wire up a form to the API". When in doubt, invoke — this skill prevents
  inconsistent patterns, missing validation, and broken error handling.
---

# Forms

All forms in this project use **sveltekit-superforms** + **FormSnap** + **Zod v4** in **SPA mode** (no server-side form actions — everything is client-side). The app has `ssr = false`.

## Full pattern

### 1. Zod schema — `apps/web/src/lib/forms/<name>-schema.ts`

```ts
import z from 'zod';

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name must be under 50 characters.' })
    .trim(),
  email: z.email({ message: 'Please enter a valid email address.' }).trim(),
  bio: z.string().max(500, { message: 'Bio must be under 500 characters.' }).optional()
});

export type ProfileFormSchema = typeof profileFormSchema;
```

Use `z.email()` (not `z.string().email()`) — this project runs Zod v4. Cross-field validation uses `.refine()`:

```ts
export const changePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword']
  });
```

### 2. Page component — `+page.svelte`

```svelte
<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { profileFormSchema } from '$lib/forms/profile-schema';
  import { Button, Form, Input } from '@repo/ui';
  import { toast } from 'svelte-sonner';
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod4, zod4Client } from 'sveltekit-superforms/adapters';

  const initialData = { name: '', email: '', bio: '' };

  const form = superForm(defaults(initialData, zod4(profileFormSchema)), {
    SPA: true,
    validators: zod4Client(profileFormSchema),
    validationMethod: 'onsubmit',   // validate on blur for better UX on longer forms
    async onUpdate({ form }) {
      if (!form.valid) return;

      try {
        const { error } = await apiFetch('/v1/profile', {
          method: 'PUT',
          body: form.data
        });

        if (error) {
          toast.error(error.message ?? 'Could not save profile. Please try again.');
          return;
        }

        toast.success('Profile updated.');
      } catch {
        toast.error('Could not save profile. Please try again.');
      }
    }
  });

  const { form: formData, enhance, submitting } = form;
</script>

<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input.Root bind:value={$formData.name} type="text" {...props} class="text-base" />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input.Root bind:value={$formData.email} type="email" {...props} class="text-base" />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Button.Root type="submit" class="w-full" disabled={$submitting}>
    {$submitting ? 'Saving...' : 'Save changes'}
  </Button.Root>
</form>
```

## Key rules

**Always use `zod4` / `zod4Client`** (not the older `zod` / `zodClient` adapters) — the project uses Zod v4.

**SPA mode is mandatory**: never add `+page.server.ts` with form actions. All submission logic goes in `onUpdate`.

**Check validity first**: `if (!form.valid) return;` at the top of `onUpdate` before any async work.

**`{...props}` must spread onto the input**: FormSnap uses this to wire up accessibility (id, aria, name). Always spread props inside `Form.Control`'s snippet.

**`bind:value`**: bind the input to `$formData.<fieldName>` so the store stays in sync.

**`$submitting` for loading state**: disable the submit button and swap its label while the request is in flight.

## Imports

```ts
import { Button, Form, Input } from '@repo/ui';
import { defaults, superForm } from 'sveltekit-superforms';
import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
```

`Form` exports: `Form.Field`, `Form.Control`, `Form.Label`, `Form.FieldErrors`, `Form.Description`, `Form.Fieldset`, `Form.Legend`

## validationMethod options

| Value | When to use |
|---|---|
| `'onsubmit'` | Simple forms; only validate on submit |
| `'oninput'` | Real-time feedback (password strength, search) |
| `'onblur'` | Longer forms; validate each field when user leaves it |

## Pre-populating with existing data

When editing existing records (e.g., a profile loaded from the API), pass the initial data directly instead of using `defaults`:

```ts
// Load the data first (e.g., from a load function or prop)
let { data } = $props(); // data.profile from +page.ts load fn

const form = superForm(data.profile, {
  SPA: true,
  validators: zod4Client(profileFormSchema),
  // ...
});
```

Or when you have it inline:

```ts
const form = superForm({ name: data.user.name, email: data.user.email }, {
  SPA: true,
  validators: zod4Client(profileFormSchema),
  validationMethod: 'onblur',
  async onUpdate({ form }) { /* ... */ }
});
```

## Schema file location

Always put schemas in `apps/web/src/lib/forms/<feature>-schema.ts`. If the same shape is validated on the API side, keep two separate schemas — one in `apps/web`, one using Zod directly in the Hono route (don't try to share them across the monorepo boundary unless you move them to a shared package).

## Form in a dialog

When embedding a form inside a Dialog, the form setup is identical — just place the `<form>` inside `<Dialog.Content>`:

```svelte
<Dialog.Content>
  <Dialog.Header>
    <Dialog.Title>Edit profile</Dialog.Title>
  </Dialog.Header>
  <form method="POST" use:enhance class="space-y-4">
    <!-- fields here -->
    <Dialog.Footer>
      <Button.Root variant="outline" onclick={() => (open = false)}>Cancel</Button.Root>
      <Button.Root type="submit" disabled={$submitting}>
        {$submitting ? 'Saving...' : 'Save'}
      </Button.Root>
    </Dialog.Footer>
  </form>
</Dialog.Content>
```

## Common field types

```svelte
<!-- Text -->
<Input.Root bind:value={$formData.name} type="text" {...props} />

<!-- Email -->
<Input.Root bind:value={$formData.email} type="email" {...props} />

<!-- Password -->
<Input.Root bind:value={$formData.password} type="password" {...props} />

<!-- Number (after installing input or using native) -->
<Input.Root bind:value={$formData.age} type="number" {...props} />

<!-- Textarea (install shadcn textarea first if needed) -->
<Textarea bind:value={$formData.bio} {...props} />

<!-- Select (install shadcn select first) -->
<Select.Root bind:value={$formData.role}>
  <Select.Trigger {...props}><Select.Value /></Select.Trigger>
  <Select.Content>
    <Select.Item value="admin">Admin</Select.Item>
    <Select.Item value="member">Member</Select.Item>
  </Select.Content>
</Select.Root>
```

All form controls come from `@repo/ui` — never write raw `<textarea>`, `<select>`, `<input>`, or checkbox markup, even as a stopgap. Check `packages/ui/src/index.ts` first: most controls (including Textarea, Select, Checkbox) are already exported. Only if one is genuinely missing, install it:

## Installing missing shadcn components

```bash
pnpm --filter @repo/ui ui:add textarea
pnpm --filter @repo/ui ui:add select
pnpm --filter @repo/ui ui:add checkbox
```

Then export from `packages/ui/src/index.ts` and import via `@repo/ui`.
