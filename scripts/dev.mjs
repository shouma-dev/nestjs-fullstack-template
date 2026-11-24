import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  const force = setTimeout(() => { for (const child of children) if (child.exitCode === null) child.kill('SIGKILL'); }, 3000);
  force.unref();
}
function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', env: process.env });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
}
// 直接持有 Node 子进程，退出时不留下 npm 启动的孙进程。
start(process.execPath, ['--watch', 'dist/server/main.js']);
start(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.node.json', '--watch', '--preserveWatchOutput']);
start(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.config.ts']);
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
