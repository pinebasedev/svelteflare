<script lang="ts">
  import { Card } from '@repo/ui';
  import BracesIcon from '~icons/lucide/braces';
  import CloudIcon from '~icons/lucide/cloud';
  import CreditCardIcon from '~icons/lucide/credit-card';
  import KeyRoundIcon from '~icons/lucide/key-round';
  import PaletteIcon from '~icons/lucide/palette';
  import ShieldCheckIcon from '~icons/lucide/shield-check';

  const features = [
    {
      icon: KeyRoundIcon,
      title: 'Auth that just works',
      description:
        'Email OTP and Google OAuth via Better Auth. Sessions, verification, and password reset wired end to end.'
    },
    {
      icon: CreditCardIcon,
      title: 'Stripe subscriptions',
      description:
        'Plans, checkout, webhooks, and entitlement checks built in. Gate any route or feature on an active subscription.'
    },
    {
      icon: PaletteIcon,
      title: '56-component UI kit',
      description:
        'Real shadcn-svelte components with semantic tokens and automatic dark mode. Customize the shared variables and component implementations as one cohesive design system.'
    },
    {
      icon: BracesIcon,
      title: 'Typed end to end',
      description:
        'The SvelteKit client consumes the Hono API through a typed RPC client. Rename a field on the server and the frontend fails to compile.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Hardened API',
      description:
        'CORS, CSRF protection, rate limiting, and secure headers as middleware on every Worker request.'
    },
    {
      icon: CloudIcon,
      title: 'Cloudflare-native',
      description:
        'Workers, one D1 database, email delivery, and static assets — no servers to manage and a generous free tier.'
    }
  ];
</script>

<section class="mx-auto max-w-5xl px-4 py-20">
  <h2 class="mb-2 text-center text-3xl font-semibold tracking-tight">
    Everything a SaaS needs, already wired
  </h2>
  <p class="mb-10 text-center text-muted-foreground">
    Skip the first month of plumbing and start on the product.
  </p>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each features as feature (feature.title)}
      <Card.Root>
        <Card.Header>
          <feature.icon class="mb-2 size-5 text-primary" />
          <Card.Title>{feature.title}</Card.Title>
          <Card.Description>{feature.description}</Card.Description>
        </Card.Header>
      </Card.Root>
    {/each}
  </div>
</section>
