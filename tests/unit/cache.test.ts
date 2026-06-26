import { describe, expect, it } from 'vitest';

import { DEFAULT_CACHE_TTL_MS, PmdaCache } from '../../src/background/cache';
import type { PmdaSearchResponse } from '../../src/shared/types';

function createResult(name: string) {
  return {
    kikansiCode: `code-${name}`,
    name,
    yakkaiCode: `yj-${name}`,
    companyName: 'テスト製薬',
    insertUrl: 'https://www.pmda.go.jp/test.pdf',
  };
}

function createResponse(name: string): PmdaSearchResponse {
  return {
    total: 1,
    results: [createResult(name)],
  };
}

describe('PmdaCache', () => {
  it('stores and retrieves search responses with normalized keywords', async () => {
    let now = 1_000;
    const cache = new PmdaCache({ dbName: 'pmda-cache-test-search-v3', now: () => now });
    const response = createResponse('アムロジピン');

    await cache.putSearch('Amlodipine', response);

    expect(await cache.getSearch('  amlodipine  ')).toEqual(response);

    now += 100;
    expect(await cache.getUsage()).toMatchObject({ searchCount: 1, drugIndexCount: 1, historyCount: 1 });
  });

  it('keeps expired search responses available for stale-while-revalidate reads', async () => {
    let now = 10_000;
    const cache = new PmdaCache({ dbName: 'pmda-cache-test-stale-search-v3', now: () => now });
    const response = createResponse('期限切れ');

    await cache.putSearch('expired', response);
    now += DEFAULT_CACHE_TTL_MS + 1;

    expect(await cache.getSearch('expired')).toBeNull();

    const staleLookup = await cache.getSearchWithMetadata('expired');

    expect(staleLookup).toMatchObject({ value: response, isExpired: true });
    expect(await cache.getUsage()).toMatchObject({ searchCount: 1 });

    await cache.clearExpired();

    expect(await cache.getUsage()).toMatchObject({ searchCount: 0 });
  });

  it('searches the drug index populated from cached search results', async () => {
    const cache = new PmdaCache({ dbName: 'pmda-cache-test-drug-index-v3', now: () => 1_000 });

    await cache.putSearch('アムロ', createResponse('アムロジピン錠'));

    expect(await cache.searchDrugIndexByName('アムロジピン')).toEqual([
      {
        kikansiCode: 'code-アムロジピン錠',
        name: 'アムロジピン錠',
        companyName: 'テスト製薬',
        pdfUrl: 'https://www.pmda.go.jp/test.pdf',
        cachedAt: 1_000,
      },
    ]);
  });

  it('records search history in access order', async () => {
    let now = 1_000;
    const cache = new PmdaCache({ dbName: 'pmda-cache-test-history-v3', now: () => now });

    await cache.recordSearchHistory('first', 'code-first');
    now += 10;
    await cache.recordSearchHistory('second', 'code-second');

    expect(await cache.getRecentSearchHistory()).toMatchObject([
      { query: 'second', kikansiCode: 'code-second', accessedAt: 1_010 },
      { query: 'first', kikansiCode: 'code-first', accessedAt: 1_000 },
    ]);
  });

  it('returns a storage estimate object even when the StorageManager API is unavailable', async () => {
    const cache = new PmdaCache({ dbName: 'pmda-cache-test-storage-estimate-v3', now: () => 1_000 });

    expect(await cache.getUsage()).toMatchObject({
      storageEstimate: {
        supported: false,
      },
    });
  });

  it('evicts least recently accessed records when capacity is exceeded', async () => {
    let now = 1_000;
    const cache = new PmdaCache({ dbName: 'pmda-cache-test-lru-v3', maxBytes: 1_200, now: () => now });

    await cache.putSearch('first', createResponse('first'.repeat(20)));
    now += 1;
    await cache.putSearch('second', createResponse('second'.repeat(20)));
    now += 1;
    await cache.putSearch('third', createResponse('third'.repeat(20)));

    const usage = await cache.getUsage();

    expect(usage.totalBytes).toBeLessThanOrEqual(1_200);
    expect(await cache.getSearch('first')).toBeNull();
    expect(await cache.getSearch('third')).not.toBeNull();
  });
});
