import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const astroBin = resolve(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'astro.cmd' : 'astro'
);

const build = spawnSync(astroBin, ['build'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const testRun = spawnSync(process.execPath, ['--test'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (testRun.status !== 0) {
  process.exit(testRun.status ?? 1);
}
