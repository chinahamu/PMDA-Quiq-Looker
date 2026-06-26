import {
  CONTEXT_MENU_ID,
  EXTENSION_NAME,
  LAST_CONTEXT_MENU_TEXT_STORAGE_KEY,
  PMDA_DISPLAY_MODE_STORAGE_KEY,
  PMDA_SEARCH_REQUEST_MESSAGE,
  PMDA_SEARCH_STATE_MESSAGE,
  PMDA_SEARCH_STATE_STORAGE_KEY,
} from '../shared/constants';
import type {
  PmdaDisplayMode,
  PmdaSearchCacheInfo,
  PmdaSearchError,
  PmdaSearchRequestMessage,
  PmdaSearchRequestResponse,
  PmdaSearchResponse,
  PmdaSearchResult,
  PmdaSearchSource,
  PmdaSearchState,
  PmdaSearchStateMessage,
} from '../shared/types';

import { DEFAULT_CACHE_TTL_MS, pmdaCache, type DrugIndex, type PmdaCacheLookup } from './cache';
import { PmdaClientError, pmdaApiClient } from './pmda-client';

let latestSearchRequestId = 0;
let preferredDisplayMode: PmdaDisplayMode = 'sidePanel';

initializeSidePanel();
loadPreferredDisplayMode();
watchPreferredDisplayMode();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'PMDAで添付文書を調べる',
    contexts: ['selection'],
  });

  initializeSidePanel();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return;
  }

  const selectedText = info.selectionText?.trim();

  if (!selectedText) {
    return;
  }

  if (preferredDisplayMode === 'sidePanel') {
    openSidePanelForTab(tab);
  }

  void runSearch(selectedText, 'contextMenu');
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isSearchRequestMessage(message)) {
    return false;
  }

  void runSearch(message.payload.keyword, message.payload.source).then((state) => {
    const response: PmdaSearchRequestResponse = {
      ok: state.status === 'success',
      state,
    };

    sendResponse(response);
  });

  return true;
});

async function runSearch(keyword: string, source: PmdaSearchSource): Promise<PmdaSearchState> {
  const requestId = ++latestSearchRequestId;
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    const state = createErrorState(normalizedKeyword, source, {
      code: 'INVALID_KEYWORD',
      message: '検索キーワードを入力してください。',
    });

    await saveAndBroadcastCurrentState(state, requestId);
    return state;
  }

  chrome.action.setTitle({ title: `${EXTENSION_NAME}: ${normalizedKeyword}` });

  await saveAndBroadcastCurrentState(
    {
      status: 'loading',
      keyword: normalizedKeyword,
      source,
      updatedAt: Date.now(),
    },
    requestId,
  );

  try {
    const cachedResponse = await getCachedSearchResponse(normalizedKeyword);

    if (cachedResponse) {
      const state: PmdaSearchState = {
        status: 'success',
        keyword: normalizedKeyword,
        source,
        response: cachedResponse.value,
        cacheInfo: createCacheInfo(cachedResponse),
        updatedAt: Date.now(),
      };

      await saveAndBroadcastCurrentState(state, requestId);

      if (cachedResponse.isExpired) {
        refreshSearchCacheInBackground(normalizedKeyword, source, requestId);
      }

      return state;
    }

    const indexedResponse = await getIndexedDrugSearchResponse(normalizedKeyword);

    if (indexedResponse) {
      const state: PmdaSearchState = {
        status: 'success',
        keyword: normalizedKeyword,
        source,
        response: indexedResponse,
        cacheInfo: {
          source: 'drugIndex',
          cachedAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      await saveAndBroadcastCurrentState(state, requestId);
      refreshSearchCacheInBackground(normalizedKeyword, source, requestId);
      return state;
    }

    const response = await pmdaApiClient.search(normalizedKeyword);
    const now = Date.now();

    await putCachedSearchResponse(normalizedKeyword, response);

    const state: PmdaSearchState = {
      status: 'success',
      keyword: normalizedKeyword,
      source,
      response,
      cacheInfo: createNetworkCacheInfo(now),
      updatedAt: now,
    };

    await saveAndBroadcastCurrentState(state, requestId);
    return state;
  } catch (error) {
    const state = createErrorState(normalizedKeyword, source, normalizeError(error));

    await saveAndBroadcastCurrentState(state, requestId);
    return state;
  }
}

function initializeSidePanel(): void {
  if (typeof chrome.sidePanel?.setOptions !== 'function') {
    return;
  }

  void chrome.sidePanel
    .setOptions({
      path: 'sidepanel/sidepanel.html',
      enabled: true,
    })
    .catch((error: unknown) => {
      console.warn('Failed to initialize PMDA side panel.', error);
    });
}

function openSidePanelForTab(tab?: chrome.tabs.Tab): void {
  if (tab?.id === undefined || typeof chrome.sidePanel?.open !== 'function') {
    return;
  }

  void chrome.sidePanel.open({ tabId: tab.id }).catch((error: unknown) => {
    console.warn('Failed to open PMDA side panel.', error);
  });
}

function loadPreferredDisplayMode(): void {
  chrome.storage.local.get(PMDA_DISPLAY_MODE_STORAGE_KEY, (items) => {
    const storedMode = items[PMDA_DISPLAY_MODE_STORAGE_KEY];

    if (isDisplayMode(storedMode)) {
      preferredDisplayMode = storedMode;
    }
  });
}

function watchPreferredDisplayMode(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    const change = changes[PMDA_DISPLAY_MODE_STORAGE_KEY];

    if (isDisplayMode(change?.newValue)) {
      preferredDisplayMode = change.newValue;
    }
  });
}

async function getCachedSearchResponse(
  keyword: string,
): Promise<PmdaCacheLookup<PmdaSearchResponse> | null> {
  try {
    return await pmdaCache.getSearchWithMetadata(keyword);
  } catch (error) {
    console.warn('Failed to read PMDA search cache.', error);
    return null;
  }
}

async function getIndexedDrugSearchResponse(keyword: string): Promise<PmdaSearchResponse | null> {
  try {
    const results = await pmdaCache.searchDrugIndexByName(keyword);

    if (results.length === 0) {
      return null;
    }

    return {
      total: results.length,
      results: results.map(drugIndexToSearchResult),
    };
  } catch (error) {
    console.warn('Failed to read PMDA drug index cache.', error);
    return null;
  }
}

function refreshSearchCacheInBackground(
  keyword: string,
  source: PmdaSearchSource,
  requestId: number,
): void {
  void (async () => {
    try {
      const response = await pmdaApiClient.search(keyword);
      const now = Date.now();

      await putCachedSearchResponse(keyword, response);

      if (requestId !== latestSearchRequestId) {
        return;
      }

      await saveAndBroadcastCurrentState(
        {
          status: 'success',
          keyword,
          source,
          response,
          cacheInfo: createNetworkCacheInfo(now),
          updatedAt: now,
        },
        requestId,
      );
    } catch (error) {
      console.warn('Failed to refresh stale PMDA search cache.', error);
    }
  })();
}

async function putCachedSearchResponse(
  keyword: string,
  response: PmdaSearchResponse,
): Promise<void> {
  try {
    await pmdaCache.putSearch(keyword, response);
  } catch (error) {
    console.warn('Failed to write PMDA search cache.', error);
  }
}

function drugIndexToSearchResult(index: DrugIndex): PmdaSearchResult {
  return {
    kikansiCode: index.kikansiCode,
    name: index.name,
    yakkaiCode: '',
    companyName: index.companyName,
    insertUrl: index.pdfUrl,
  };
}

function createCacheInfo(lookup: PmdaCacheLookup<PmdaSearchResponse>): PmdaSearchCacheInfo {
  return {
    source: lookup.isExpired ? 'staleCache' : 'freshCache',
    cachedAt: lookup.cachedAt,
    expiresAt: lookup.expiresAt,
  };
}

function createNetworkCacheInfo(now: number): PmdaSearchCacheInfo {
  return {
    source: 'network',
    cachedAt: now,
    expiresAt: now + DEFAULT_CACHE_TTL_MS,
    refreshedAt: now,
  };
}

async function saveAndBroadcastCurrentState(
  state: PmdaSearchState,
  requestId: number,
): Promise<void> {
  if (requestId !== latestSearchRequestId) {
    return;
  }

  await setSessionItems({
    [LAST_CONTEXT_MENU_TEXT_STORAGE_KEY]: state.keyword,
    [PMDA_SEARCH_STATE_STORAGE_KEY]: state,
  });

  if (requestId !== latestSearchRequestId) {
    return;
  }

  broadcastState(state);
}

function setSessionItems(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.session.set(items, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

function broadcastState(state: PmdaSearchState): void {
  const message: PmdaSearchStateMessage = {
    type: PMDA_SEARCH_STATE_MESSAGE,
    payload: state,
  };

  chrome.runtime.sendMessage(message, () => {
    void chrome.runtime.lastError;
  });
}

function createErrorState(
  keyword: string,
  source: PmdaSearchSource,
  error: PmdaSearchError,
): PmdaSearchState {
  return {
    status: 'error',
    keyword,
    source,
    error,
    updatedAt: Date.now(),
  };
}

function normalizeError(error: unknown): PmdaSearchError {
  if (error instanceof PmdaClientError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: '予期しないエラーが発生しました。',
  };
}

function isSearchRequestMessage(message: unknown): message is PmdaSearchRequestMessage {
  if (!isRecord(message) || message.type !== PMDA_SEARCH_REQUEST_MESSAGE) {
    return false;
  }

  const payload = message.payload;

  return isRecord(payload) && typeof payload.keyword === 'string' && isSearchSource(payload.source);
}

function isSearchSource(value: unknown): value is PmdaSearchSource {
  return value === 'contextMenu' || value === 'popup' || value === 'contentScript' || value === 'sidePanel';
}

function isDisplayMode(value: unknown): value is PmdaDisplayMode {
  return value === 'popup' || value === 'sidePanel';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
