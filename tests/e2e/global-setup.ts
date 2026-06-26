import { execFileSync } from 'node:child_process';

export default function globalSetup() {
  execFileSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}
