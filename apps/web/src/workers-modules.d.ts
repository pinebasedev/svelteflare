// The web type program pulls the api's sources in through the AppType import
// (src/lib/api.ts), but it must never load the Workers runtime type globals:
// they declare their own global `Element` (HTMLRewriter) which merges into the
// DOM's and breaks HTMLElement assignability across the whole app. This shim
// declares just the workers-runtime modules those api sources import.
declare module 'cloudflare:email' {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string | ReadableStream);
    readonly from: string;
    readonly to: string;
  }
}
