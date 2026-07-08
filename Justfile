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

# Start the SvelteKit web development server
[group('1. dev')]
dev-web:
  turbo dev --filter=@repo/web

# Start the API development server
[group('1. dev')]
dev-api:
  turbo dev --filter=@repo/api

# Start all dev servers
[group('1. dev')]
dev:
  turbo dev


# ================================================================= #
#                               2. BUILD                              #
# ================================================================= #

# Build the web app
[group('2. build')]
build-web:
  turbo build --filter=@repo/web

# Build the API
[group('2. build')]
build-api:
  turbo build --filter=@repo/api

# Build everything
[group('2. build')]
build:
  turbo build


# ================================================================= #
#                               3. DEPLOY                             #
# ================================================================= #

# Deploy the web app (staging)
[group('3. deploy')]
deploy-web-staging:
  turbo deploy:staging --filter=@repo/web

# Deploy the web app (production)
[group('3. deploy')]
deploy-web-production:
  turbo deploy:production --filter=@repo/web

# Deploy the API (staging)
[group('3. deploy')]
deploy-api-staging:
  turbo deploy:staging --filter=@repo/api

# Deploy the API (production)
[group('3. deploy')]
deploy-api-production:
  turbo deploy:production --filter=@repo/api


# ================================================================= #
#                          4. QUALITY CHECKS                          #
# ================================================================= #

# Run typechecking across the monorepo
[group('4. checks')]
check:
  turbo check

# Run ESLint + Prettier checks
[group('4. checks')]
lint:
  turbo lint

# Format all files with Prettier
[group('4. checks')]
format:
  turbo format


# ================================================================= #
#                          5. DATABASE (DRIZZLE)                      #
# ================================================================= #

# Generate new migrations from the current schema
[group('5. db')]
generate:
  pnpm --filter @repo/api run generate:db

# Apply migrations to the local D1 database
[group('5. db')]
migrate-local:
  pnpm --filter @repo/api run migrate:local

# Apply migrations to the staging D1 database
[group('5. db')]
migrate-staging:
  pnpm --filter @repo/api run migrate:staging

# Apply migrations to the production D1 database
[group('5. db')]
migrate-production:
  pnpm --filter @repo/api run migrate:production

# Open Drizzle Studio
[group('5. db')]
studio:
  pnpm --filter @repo/api exec drizzle-kit studio

# Generate Cloudflare Worker types from wrangler.jsonc
[group('5. db')]
cf-typegen:
  pnpm --filter @repo/api run cf-typegen
