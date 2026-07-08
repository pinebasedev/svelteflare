import posthog from 'posthog-js';

export type PostHogProps = Record<string, unknown>;

class PostHogClient {
  private static instance: PostHogClient;
  private lastId: string | null = null;

  private constructor() {}

  static getInstance() {
    if (!PostHogClient.instance) {
      PostHogClient.instance = new PostHogClient();
    }
    return PostHogClient.instance;
  }

  identify(user: { id: string } | null | undefined) {
    if (!user?.id) return;

    if (this.lastId !== user.id) {
      posthog.identify(user.id);
      this.lastId = user.id;
    }
  }

  setPersonProperties(properties: PostHogProps) {
    posthog.setPersonProperties(properties);
  }

  capture(event: string, properties?: PostHogProps) {
    posthog.capture(event, properties);
  }

  pageView() {
    this.capture('$pageview');
  }

  pageLeave() {
    this.capture('$pageleave');
  }

  reset() {
    this.lastId = null;
    posthog.reset();
  }
}

export const ph = PostHogClient.getInstance();
