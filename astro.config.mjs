import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  adapter: cloudflare(),
  server: { host: true },
  markdown: { gfm: true }
});
