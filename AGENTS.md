# Agent Rules for This Project

This is a Svelteflare app: a pnpm/Turbo monorepo. `apps/web` is a SvelteKit SPA that contains all UI and routing. `apps/api` is a Hono Cloudflare Worker that contains all server logic (auth, database, billing). `packages/ui` (imported as `@repo/ui`) is the theme and component library — the single source of truth for how anything looks.

## Theme fidelity (non-negotiable)

The app has a founder-approved theme. All UI you build must look like it belongs to that theme.

1. Build ALL UI from `@repo/ui` components styled with semantic theme tokens only: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-destructive`, opacity modifiers like `text-foreground/60`, and the other tokens defined in `packages/ui/src/global.css`.
2. NEVER use:
   - Tailwind palette classes: `bg-blue-500`, `text-zinc-900`, `text-green-500`, `bg-white`, `text-black`, …
   - Color literals anywhere: hex (`#1e40af`), `rgb()`, `hsl()`, `oklch()` — in classes, `style=` attributes, or `<style>` blocks
   - Arbitrary color values: `bg-[#...]`, `text-[oklch(...)]`, `border-[rgb(...)]`
   - Named CSS colors (`color: red`) or classes for tokens that don't exist in `global.css`
3. Dark mode works automatically through the tokens. Do not write `dark:` color overrides in feature code.
4. Never recreate buttons, inputs, selects, textareas, dialogs, or other controls with raw markup. Never import `bits-ui`, `formsnap`, or icon packages directly — icons come from `~icons/lucide/<name>` via unplugin-icons.
5. Before assuming a component is missing, read the export list in `packages/ui/src/index.ts` (~57 components exist). Before assuming a token is missing, read the `:root` block of `packages/ui/src/global.css`. If a primitive truly is missing: `pnpm --filter @repo/ui ui:add <name>`, export it from `packages/ui/src/index.ts`, import it via `@repo/ui`.
6. `packages/ui/src/global.css` and `packages/ui/src/components` are THEME-OWNED. Do not edit them during feature work. Change them only when the user explicitly asks to change the theme or brand, through the theme workflow — and then use the exact colors the user provides, never colors you invented.
7. Lint enforces the color rules (`theme/no-hardcoded-colors`). If lint flags a color, replace it with a token — do not suppress the error. Run checks (`just check`) before finishing.

## Talking to the user

The user is a non-technical founder. Present plans and summaries in plain language: what they will see and what changed, not how. Keep file paths, shell commands, branch names, and other jargon out of user-facing text — do the technical work silently.

## Deep-dive skills

Detailed guides live in `.agents/skills/`; read the relevant one before working in its area:

- `project-orientation` — repo map, commands, where things live
- `build-feature` — end-to-end workflow for adding a feature
- `ui-and-theme` — components, tokens, theming (read before ANY UI work)
- `forms` — superforms + FormSnap + Zod patterns
- `auth-db-billing` — Better Auth, Drizzle/D1, Stripe
- `svelte-core-bestpractices` — Svelte 5 runes idioms
- `svelte-code-writer` — Svelte docs lookup and autofixer CLI

Deployment is managed by Pinebase: never edit `.github/workflows/deploy.yml` or touch `pinebase-deploy-*` tags.
