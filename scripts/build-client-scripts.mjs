import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const entryDir = resolve(projectRoot, 'src/scripts');
const outDir = resolve(projectRoot, 'public/scripts');

const entries = [
  'favorites.client.ts',
  'theme.client.ts',
  'resource-table.client.ts',
  'forms-table.client.ts',
  'exercises-table.client.ts',
  'warmups-table.client.ts',
];

await Promise.all(
  entries.map((entry) =>
    build({
      entryPoints: [resolve(entryDir, entry)],
      outfile: resolve(outDir, entry.replace(/\.ts$/, '.js')),
      bundle: true,
      format: 'esm',
      target: 'es2020',
      logLevel: 'info',
    })
  )
);
