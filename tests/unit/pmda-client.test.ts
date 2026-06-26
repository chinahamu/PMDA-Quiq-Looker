import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { PmdaApiClient, PmdaClientError, type FetchLike } from '../../src/background/pmda-client';

const server = setupServer();
const DRUGWIKI_API_BASE_URL = 'https://drugwiki.meta-alchemist.co.jp';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => {
  server.close();
});

describe('PmdaApiClient', () => {
  it('searches drugwiki products, preserves total, and enriches them with detail PDF URLs', async () => {
    server.use(
      http.get(`${DRUGWIKI_API_BASE_URL}/api/iyakuSearch/`, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('keyword')).toBe('アムロジピン');
        expect(url.searchParams.get('type')).toBe('json');

        return HttpResponse.json({
          total: 25,
          results: [
            {
              kikansiCode: 'K001',
              name: 'アムロジピン錠5mg',
              yakkaiCode: '2171022F1010',
              companyName: 'テスト製薬',
            },
          ],
        });
      }),
      http.get(`${DRUGWIKI_API_BASE_URL}/api/iyakuDetail/`, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('kikansiCode')).toBe('K001');
        expect(url.searchParams.get('type')).toBe('json');

        return HttpResponse.json({
          data: {
            insertUrl: '/files/0001.pdf',
          },
        });
      }),
    );

    const client = new PmdaApiClient({ debounceMs: 0 });

    await expect(client.search(' アムロジピン ')).resolves.toEqual({
      total: 25,
      results: [
        {
          kikansiCode: 'K001',
          name: 'アムロジピン錠5mg',
          yakkaiCode: '2171022F1010',
          companyName: 'テスト製薬',
          insertUrl: 'https://www.pmda.go.jp/files/0001.pdf',
        },
      ],
    });
  });

  it('returns an empty result set when drugwiki has no matching product', async () => {
    server.use(
      http.get(`${DRUGWIKI_API_BASE_URL}/api/iyakuSearch/`, () => {
        return HttpResponse.json({ total: 0, results: [] });
      }),
    );

    const client = new PmdaApiClient({ debounceMs: 0 });

    await expect(client.search('存在しない薬品')).resolves.toEqual({
      total: 0,
      results: [],
    });
  });

  it('throws API_ERROR when drugwiki returns a non-2xx response', async () => {
    server.use(
      http.get(`${DRUGWIKI_API_BASE_URL}/api/iyakuSearch/`, () => {
        return new HttpResponse('internal server error', { status: 500 });
      }),
    );

    const client = new PmdaApiClient({ debounceMs: 0 });

    await expect(client.search('アムロジピン')).rejects.toMatchObject({
      code: 'API_ERROR',
      status: 500,
    });
  });

  it('throws TIMEOUT when a request takes longer than the configured timeout', async () => {
    vi.useFakeTimers();

    const fetcher: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });

    const client = new PmdaApiClient({
      debounceMs: 0,
      fetcher,
      timeoutMs: 100,
    });
    const result = client.search('アムロジピン');

    result.catch(() => {});

    await vi.advanceTimersByTimeAsync(100);

    await expect(result).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('debounces consecutive search calls and keeps only the latest request', async () => {
    vi.useFakeTimers();

    const fetcher = vi.fn<FetchLike>(async (input) => {
      const url = new URL(input.toString());

      return HttpResponse.json({
        results: [
          {
            kikansiCode: 'K002',
            name: url.searchParams.get('keyword'),
          },
        ],
      });
    });
    const client = new PmdaApiClient({
      debounceMs: 300,
      fetcher,
      maxDetails: 0,
    });

    const first = client.search('古い検索').catch((error: PmdaClientError) => error);
    const second = client.search('新しい検索');

    await expect(first).resolves.toMatchObject({ code: 'DEBOUNCED' });
    expect(fetcher).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(299);
    expect(fetcher).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    await expect(second).resolves.toMatchObject({
      total: 1,
      results: [
        {
          kikansiCode: 'K002',
          name: '新しい検索',
          yakkaiCode: '',
          companyName: '',
          insertUrl: null,
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
