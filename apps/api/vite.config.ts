import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    server: {
      cors: false,
      host: true,
      port: 9003
    },
    preview: {
      cors: false,
      host: true,
      port: 9003
    },
    plugins: [
      cloudflare({
        configPath: "./wrangler.jsonc",
        inspectorPort: false
      })
    ]
  };
});
