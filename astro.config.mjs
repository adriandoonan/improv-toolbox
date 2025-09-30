import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const renameTypeScriptAssetPlugin = () => ({
  name: 'rename-ts-url-assets',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const asset of Object.values(bundle)) {
      if (asset.type === 'asset' && typeof asset.fileName === 'string' && asset.fileName.endsWith('.ts')) {
        asset.fileName = asset.fileName.replace(/\.ts$/i, '.js');
      }
    }
  },
});

export default defineConfig({
  adapter: cloudflare(),
  server: { host: true },
  markdown: { gfm: true },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [renameTypeScriptAssetPlugin()],
  },
});
