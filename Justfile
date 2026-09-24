# ================================================================= #
#                            SVELTEFLARE                              #
#                          MONOREPO JUSTFILE                          #
# ================================================================= #
# Run:                                                               #
#   just           → show all commands (grouped)                     #
#   just <command> → run a specific recipe                           #
# ================================================================= #

[private]
@help:
  just --list


# ================================================================= #
#                           1. DEVELOPMENT                            #
# ================================================================= #

# Run the whole stack locally: marketing on :9001, web on :9002, api on :9003
[group('1. dev')]
dev:
  pnpm dev


# ================================================================= #
#                               2. BUILD                              #
# ================================================================= #

# Build the web app
[group('2. build')]
build-web:
  pnpm turbo build --filter=@repo/web

# Build the marketing site
[group('2. build')]
build-marketing:
  pnpm turbo build --filter=@repo/marketing

# Build everything
[group('2. build')]
build:
  pnpm build


# ================================================================= #
#                               3. DEPLOY                             #
# ================================================================= #

# Deploy a stage by hand, e.g. `just deploy pr-test` (CI deploys pr-*, staging, prod)
[group('3. deploy')]
deploy stage:
  pnpm run deploy --stage {{stage}}

# Tear a stage down, e.g. `just destroy pr-test`
[group('3. deploy')]
destroy stage:
  pnpm run destroy --stage {{stage}}


# ================================================================= #
#                          4. QUALITY CHECKS                          #
# ================================================================= #

# Typecheck the monorepo and the Alchemy stack, and run the stack's tests
[group('4. checks')]
check:
  pnpm check

# Run oxlint + ESLint (Svelte markup) checks
[group('4. checks')]
lint:
  pnpm lint

# Format all files with oxfmt
[group('4. checks')]
format:
  pnpm format


# ================================================================= #
#                          5. DATABASE (DRIZZLE)                      #
# ================================================================= #

# Generate a new migration from the Drizzle schema (applied on the next dev/deploy)
[group('5. db')]
generate:
  pnpm --filter @repo/api run generate:db
