import { expect, test } from '@playwright/test';

import { extensionUrl, launchExtensionContext } from '../utils/extension-context';

test('loads popup and side panel extension pages', async () => {
  const { context, extensionId } = await launchExtensionContext();

  try {
    const popup = await context.newPage();
    await popup.goto(extensionUrl(extensionId, 'popup/index.html'));
    await expect(popup.getByRole('heading', { name: 'PMDA Quick Looker' })).toBeVisible();
    await expect(popup.getByLabel('薬品名')).toBeVisible();

    const sidePanel = await context.newPage();
    await sidePanel.goto(extensionUrl(extensionId, 'sidepanel/sidepanel.html'));
    await expect(sidePanel.getByRole('main', { name: 'PMDA添付文書ビューア' })).toBeVisible();
    await expect(sidePanel.getByRole('search', { name: '薬名検索' })).toBeVisible();
    await expect(sidePanel.getByText('検索結果またはブックマークから薬剤を選ぶと、添付文書ビューアを表示します。')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('loads content script on a matched page without page errors', async () => {
  const { context } = await launchExtensionContext();
  const pageErrors: string[] = [];

  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.route('https://pmda-quick-looker.test/**', async (route) => {
      await route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html lang="ja"><body><p>アムロジピン</p></body></html>',
      });
    });

    await page.goto('https://pmda-quick-looker.test/content-script-smoke');
    await expect(page.getByText('アムロジピン')).toBeVisible();
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
