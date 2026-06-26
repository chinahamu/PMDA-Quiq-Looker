import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium, type BrowserContext } from '@playwright/test';

export interface ExtensionTestContext {
  context: BrowserContext;
  extensionId: string;
}

export async function launchExtensionContext(): Promise<ExtensionTestContext> {
  const extensionPath = resolve(process.cwd(), 'dist');
  const userDataDir = await mkdtemp(resolve(tmpdir(), 'pmda-quick-looker-'));

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const serviceWorker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const extensionId = new URL(serviceWorker.url()).host;

  return { context, extensionId };
}

export function extensionUrl(extensionId: string, path: string): string {
  return `chrome-extension://${extensionId}/${path.replace(/^\//, '')}`;
}
