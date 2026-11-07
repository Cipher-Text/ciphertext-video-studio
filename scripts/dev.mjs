import {spawn} from 'node:child_process';

const children = [
  spawn(process.execPath, ['src/server/index.mjs'], {stdio: 'inherit'}),
  spawn('pnpm', ['exec', 'vite', ...process.argv.slice(2)], {stdio: 'inherit'}),
];
const stop = (code = 0) => {
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  process.exit(code);
};
for (const child of children) child.on('exit', (code) => { if (code && code !== 0) stop(code); });
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
