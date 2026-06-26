import { expect, test, type Page } from '@playwright/test';

type MockScenario = 'success' | 'empty';

async function openPopup(page: Page, scenario: MockScenario): Promise<void> {
  await page.addInitScript((mockScenario) => {
    const storageItems: Record<string, unknown> = {};
    const listeners: Array<(message: unknown) => void> = [];

    const successState = {
      status: 'success',
      keyword: 'アムロジピン',
      source: 'popup',
      updatedAt: Date.now(),
      response: {
        total: 2,
        results: [
          {
            kikansiCode: 'mock-amlodipine-od',
            name: 'アムロジピンOD錠5mg「サンプル」',
            yakkaiCode: '2171022F1010',
            companyName: 'サンプル製薬',
            insertUrl: 'https://www.pmda.go.jp/files/mock/amlodipine.pdf',
          },
          {
            kikansiCode: 'mock-amlodipine-tablet',
            name: 'アムロジピン錠2.5mg「サンプル」',
            yakkaiCode: '2171022F2017',
            companyName: 'テストファーマ',
            insertUrl: null,
          },
        ],
      },
    };

    const emptyState = {
      status: 'success',
      keyword: '存在しない薬品名',
      source: 'popup',
      updatedAt: Date.now(),
      response: {
        total: 0,
        results: [],
      },
    };

    const chromeMock = {
      runtime: {
        lastError: undefined,
        sendMessage: (message: unknown, callback?: (response: unknown) => void) => {
          void message;
          const state = mockScenario === 'success' ? successState : emptyState;
          storageItems.pmdaSearchState = state;
          listeners.forEach((listener) => listener({ type: 'PMDA_SEARCH_STATE', payload: state }));
          callback?.({ ok: true, state });
        },
        onMessage: {
          addListener: (listener: (message: unknown) => void) => {
            listeners.push(listener);
          },
          removeListener: (listener: (message: unknown) => void) => {
            const index = listeners.indexOf(listener);

            if (index >= 0) {
              listeners.splice(index, 1);
            }
          },
        },
      },
      storage: {
        session: {
          get: (keys: unknown, callback: (items: Record<string, unknown>) => void) => {
            void keys;
            callback(storageItems);
          },
          set: (items: Record<string, unknown>, callback?: () => void) => {
            Object.assign(storageItems, items);
            callback?.();
          },
        },
      },
    };

    Object.defineProperty(window, 'chrome', {
      value: chromeMock,
      configurable: true,
    });
  }, scenario);

  await page.goto('/popup/index.html');
}

test.describe('PMDA Quick Looker popup', () => {
  test('renders mocked search results and links to the PDF directly', async ({ page }) => {
    await openPopup(page, 'success');

    await page.getByLabel('薬品名').fill('アムロジピン');
    await page.getByRole('button', { name: '検索' }).click();

    await expect(page.getByRole('heading', { name: '検索結果' })).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'PMDA検索結果' }).getByText('アムロジピンOD錠5mg「サンプル」'),
    ).toBeVisible();

    const pdfLink = page.getByRole('link', { name: 'PDFを開く' }).first();
    await expect(pdfLink).toBeVisible();
    await expect(pdfLink).toHaveAttribute(
      'href',
      'https://www.pmda.go.jp/files/mock/amlodipine.pdf',
    );
    await expect(pdfLink).toHaveAttribute('target', '_blank');
  });

  test('renders the empty state for a mocked no-hit response', async ({ page }) => {
    await openPopup(page, 'empty');

    await page.getByLabel('薬品名').fill('存在しない薬品名');
    await page.getByRole('button', { name: '検索' }).click();

    await expect(page.getByRole('heading', { name: '該当なし' })).toBeVisible();
    await expect(page.getByText('検索条件に一致する候補はありませんでした。')).toBeVisible();
  });
});
