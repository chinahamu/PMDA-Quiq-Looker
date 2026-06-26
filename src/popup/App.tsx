import { FormEvent, useEffect, useMemo, useState } from 'react';

import { normalizePmdaSearchKeyword } from '../shared/search-normalizer';
import {
  LAST_CONTEXT_MENU_TEXT_STORAGE_KEY,
  PMDA_SEARCH_REQUEST_MESSAGE,
  PMDA_SEARCH_STATE_MESSAGE,
  PMDA_SEARCH_STATE_STORAGE_KEY,
} from '../shared/constants';
import type {
  PmdaSearchRequestMessage,
  PmdaSearchRequestResponse,
  PmdaSearchState,
  PmdaSearchStateMessage,
} from '../shared/types';

import { SearchForm } from './components/SearchForm';
import { SearchResultsList } from './components/SearchResultsList';
import { StatusPanel } from './components/StatusPanel';

export function App() {
  const [keyword, setKeyword] = useState('');
  const [searchState, setSearchState] = useState<PmdaSearchState | null>(null);

  useEffect(() => {
    chrome.storage.session.get(
      [LAST_CONTEXT_MENU_TEXT_STORAGE_KEY, PMDA_SEARCH_STATE_STORAGE_KEY],
      (items) => {
        const storedKeyword = items[LAST_CONTEXT_MENU_TEXT_STORAGE_KEY];
        const storedState = items[PMDA_SEARCH_STATE_STORAGE_KEY];

        if (typeof storedKeyword === 'string') {
          setKeyword(storedKeyword);
        }

        if (isSearchState(storedState)) {
          setSearchState(storedState);
        }
      },
    );

    function handleMessage(message: unknown): void {
      if (isSearchStateMessage(message)) {
        setSearchState(message.payload);
        setKeyword(message.payload.keyword);
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const results = useMemo(() => {
    if (searchState?.status !== 'success') {
      return [];
    }

    return searchState.response?.results ?? [];
  }, [searchState]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const normalizedKeyword = normalizePmdaSearchKeyword(keyword);

    if (!normalizedKeyword) {
      setSearchState({
        status: 'error',
        keyword: '',
        source: 'popup',
        error: {
          code: 'INVALID_KEYWORD',
          message: '検索キーワードを入力してください。',
        },
        updatedAt: Date.now(),
      });
      return;
    }

    setKeyword(normalizedKeyword);
    setSearchState({
      status: 'loading',
      keyword: normalizedKeyword,
      source: 'popup',
      updatedAt: Date.now(),
    });

    const message: PmdaSearchRequestMessage = {
      type: PMDA_SEARCH_REQUEST_MESSAGE,
      payload: {
        keyword: normalizedKeyword,
        source: 'popup',
      },
    };

    chrome.runtime.sendMessage(message, (response?: PmdaSearchRequestResponse) => {
      if (chrome.runtime.lastError) {
        setSearchState({
          status: 'error',
          keyword: normalizedKeyword,
          source: 'popup',
          error: {
            code: 'RUNTIME_ERROR',
            message: chrome.runtime.lastError.message ?? 'Service Workerとの通信に失敗しました。',
          },
          updatedAt: Date.now(),
        });
        return;
      }

      if (response?.state) {
        setSearchState(response.state);
      }
    });
  }

  const isLoading = searchState?.status === 'loading';
  const shouldShowResults = searchState?.status === 'success';

  return (
    <main className="flex min-h-[480px] w-[520px] max-w-full flex-col gap-4 bg-slate-50 p-5 text-slate-900" lang="ja">
      <header className="rounded-3xl bg-gradient-to-br from-sky-900 to-sky-700 p-5 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">
          PMDA package insert lookup
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">PMDA Quick Looker</h1>
        <p className="mt-2 text-sm leading-6 text-sky-100">
          薬品名を検索し、PMDA添付文書（PDF）を別タブで確認できます。
        </p>
      </header>

      <SearchForm
        keyword={keyword}
        isLoading={isLoading}
        onKeywordChange={setKeyword}
        onSubmit={handleSubmit}
      />

      <StatusPanel searchState={searchState} />

      {shouldShowResults ? <SearchResultsList results={results} /> : null}
    </main>
  );
}

function isSearchStateMessage(message: unknown): message is PmdaSearchStateMessage {
  return (
    isRecord(message) &&
    message.type === PMDA_SEARCH_STATE_MESSAGE &&
    isSearchState(message.payload)
  );
}

function isSearchState(value: unknown): value is PmdaSearchState {
  return (
    isRecord(value) &&
    typeof value.keyword === 'string' &&
    typeof value.source === 'string' &&
    typeof value.status === 'string' &&
    typeof value.updatedAt === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
