import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

import { normalizePmdaSearchKeyword } from '../shared/search-normalizer';
import {
  LAST_CONTEXT_MENU_TEXT_STORAGE_KEY,
  PMDA_BOOKMARKS_STORAGE_KEY,
  PMDA_DISPLAY_MODE_STORAGE_KEY,
  PMDA_FONT_SIZE_STORAGE_KEY,
  PMDA_SEARCH_REQUEST_MESSAGE,
  PMDA_SEARCH_STATE_MESSAGE,
  PMDA_SEARCH_STATE_STORAGE_KEY,
} from '../shared/constants';
import type {
  PmdaDisplayMode,
  PmdaFontSize,
  PmdaSearchCacheInfo,
  PmdaSearchRequestMessage,
  PmdaSearchRequestResponse,
  PmdaSearchResult,
  PmdaSearchState,
  PmdaSearchStateMessage,
} from '../shared/types';

import { MarkdownContent } from './components/MarkdownContent';

const INCREMENTAL_SEARCH_DELAY_MS = 350;

const CACHE_TTL_WARNING_THRESHOLD_MS = 24 * 60 * 60 * 1_000;

interface ClinicalMarkdownSection {
  key: string;
  title: string;
  markdown: string;
  open?: boolean;
  className?: string;
}

interface ClinicalMarkdownSectionInput extends Omit<ClinicalMarkdownSection, 'markdown'> {
  markdown?: string;
}

export function SidePanelApp() {
  const [keyword, setKeyword] = useState('');
  const [searchState, setSearchState] = useState<PmdaSearchState | null>(null);
  const [selectedResult, setSelectedResult] = useState<PmdaSearchResult | null>(null);
  const [bookmarks, setBookmarks] = useState<PmdaSearchResult[]>([]);
  const [displayMode, setDisplayMode] = useState<PmdaDisplayMode>('sidePanel');
  const [fontSize, setFontSize] = useState<PmdaFontSize>('medium');
  const isOnline = useOnlineStatus();
  const candidateButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const submitSearch = useCallback((keywordToSearch: string) => {
    const normalizedKeyword = normalizePmdaSearchKeyword(keywordToSearch);

    if (!normalizedKeyword) {
      setSearchState({
        status: 'error',
        keyword: '',
        source: 'sidePanel',
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
      source: 'sidePanel',
      updatedAt: Date.now(),
    });

    const message: PmdaSearchRequestMessage = {
      type: PMDA_SEARCH_REQUEST_MESSAGE,
      payload: {
        keyword: normalizedKeyword,
        source: 'sidePanel',
      },
    };

    chrome.runtime.sendMessage(message, (response?: PmdaSearchRequestResponse) => {
      if (chrome.runtime.lastError) {
        setSearchState({
          status: 'error',
          keyword: normalizedKeyword,
          source: 'sidePanel',
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
  }, []);

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
          setSelectedResult(storedState.response?.results[0] ?? null);
        }
      },
    );

    chrome.storage.local.get(
      [PMDA_BOOKMARKS_STORAGE_KEY, PMDA_DISPLAY_MODE_STORAGE_KEY, PMDA_FONT_SIZE_STORAGE_KEY],
      (items) => {
        const storedBookmarks = items[PMDA_BOOKMARKS_STORAGE_KEY];
        const storedDisplayMode = items[PMDA_DISPLAY_MODE_STORAGE_KEY];
        const storedFontSize = items[PMDA_FONT_SIZE_STORAGE_KEY];

        if (isSearchResultArray(storedBookmarks)) {
          setBookmarks(storedBookmarks);
        }

        if (isDisplayMode(storedDisplayMode)) {
          setDisplayMode(storedDisplayMode);
        }

        if (isFontSize(storedFontSize)) {
          setFontSize(storedFontSize);
        }
      },
    );

    function handleMessage(message: unknown): void {
      if (isSearchStateMessage(message)) {
        setSearchState(message.payload);
        setKeyword(message.payload.keyword);
        setSelectedResult(message.payload.response?.results[0] ?? null);
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    const normalizedKeyword = normalizePmdaSearchKeyword(keyword);

    if (normalizedKeyword.length < 2) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (searchState?.status === 'loading' && searchState.keyword === normalizedKeyword) {
        return;
      }

      if (searchState?.status === 'success' && searchState.keyword === normalizedKeyword) {
        return;
      }

      submitSearch(normalizedKeyword);
    }, INCREMENTAL_SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [keyword, searchState?.keyword, searchState?.status, submitSearch]);

  const results = useMemo(() => {
    if (searchState?.status !== 'success') {
      return [];
    }

    return searchState.response?.results ?? [];
  }, [searchState]);

  const normalizedPreview = normalizePmdaSearchKeyword(keyword);
  const shouldShowNormalizedPreview = keyword.trim().length > 0 && normalizedPreview !== keyword.trim();
  const clinicalSections = selectedResult ? getClinicalSections(selectedResult) : [];
  const sideEffects = selectedResult?.sideEffects?.side_effects_list ?? [];

  const selectedResultIsBookmarked = selectedResult
    ? bookmarks.some((bookmark) => bookmark.kikansiCode === selectedResult.kikansiCode)
    : false;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submitSearch(keyword);
  }

  function handleDisplayModeChange(nextMode: PmdaDisplayMode): void {
    setDisplayMode(nextMode);
    chrome.storage.local.set({ [PMDA_DISPLAY_MODE_STORAGE_KEY]: nextMode }, () => {
      void chrome.runtime.lastError;
    });
  }

  function handleFontSizeChange(nextFontSize: PmdaFontSize): void {
    setFontSize(nextFontSize);
    chrome.storage.local.set({ [PMDA_FONT_SIZE_STORAGE_KEY]: nextFontSize }, () => {
      void chrome.runtime.lastError;
    });
  }

  function focusCandidate(index: number): void {
    const nextResult = results[index];

    if (!nextResult) {
      return;
    }

    setSelectedResult(nextResult);
    candidateButtonRefs.current[index]?.focus();
  }

  function handleCandidateKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    result: PmdaSearchResult,
  ): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusCandidate(Math.min(results.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusCandidate(Math.max(0, index - 1));
        break;
      case 'Home':
        event.preventDefault();
        focusCandidate(0);
        break;
      case 'End':
        event.preventDefault();
        focusCandidate(results.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setSelectedResult(result);
        break;
      default:
        break;
    }
  }

  function toggleBookmark(result: PmdaSearchResult): void {
    const nextBookmarks = bookmarks.some((bookmark) => bookmark.kikansiCode === result.kikansiCode)
      ? bookmarks.filter((bookmark) => bookmark.kikansiCode !== result.kikansiCode)
      : [result, ...bookmarks].slice(0, 30);

    setBookmarks(nextBookmarks);
    chrome.storage.local.set({ [PMDA_BOOKMARKS_STORAGE_KEY]: nextBookmarks }, () => {
      void chrome.runtime.lastError;
    });
  }

  return (
    <main
      className={`side-panel font-size-${fontSize}`}
      lang="ja"
      role="main"
      aria-label="PMDA添付文書ビューア"
    >
      <header className="app-header" role="banner">
        <div>
          <p className="eyebrow">PMDA Side Panel</p>
          <h1>添付文書ビューア</h1>
          <p className="language-note">表示言語: 日本語</p>
        </div>
        <div className="settings-group" aria-label="表示設定">
          <label className="mode-switch">
            <span>右クリック表示</span>
            <select
              value={displayMode}
              onChange={(event) => handleDisplayModeChange(event.target.value as PmdaDisplayMode)}
            >
              <option value="sidePanel">サイドパネル</option>
              <option value="popup">ポップアップ</option>
            </select>
          </label>
          <label className="mode-switch">
            <span>文字サイズ</span>
            <select
              value={fontSize}
              onChange={(event) => handleFontSizeChange(event.target.value as PmdaFontSize)}
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </label>
        </div>
      </header>

      <form className="search-card" role="search" aria-label="薬名検索" onSubmit={handleSubmit}>
        <label htmlFor="sidepanel-keyword">薬名検索</label>
        <div className="search-row">
          <input
            id="sidepanel-keyword"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="例：アムロジピン / のるばすく"
            autoComplete="off"
            aria-describedby="keyword-help keyword-normalized-preview"
          />
          <button type="submit" disabled={searchState?.status === 'loading'}>
            {searchState?.status === 'loading' ? '検索中' : '検索'}
          </button>
        </div>
        <p id="keyword-help" className="helper-text">
          2文字以上入力するとインクリメンタルサーチします。ひらがな・全角半角・一部の先発品名を正規化します。
        </p>
        <p id="keyword-normalized-preview" className="sr-only" aria-live="polite">
          {shouldShowNormalizedPreview ? `正規化後の検索語: ${normalizedPreview}` : ''}
        </p>
        {shouldShowNormalizedPreview ? (
          <p className="normalized-preview" aria-hidden="true">
            正規化後: {normalizedPreview}
          </p>
        ) : null}
      </form>

      <section className="viewer-card" aria-labelledby="viewer-heading">
        {selectedResult ? (
          <>
            <div className="viewer-header">
              <div>
                <h2 id="viewer-heading">{selectedResult.name}</h2>
                <p>
                  {selectedResult.companyName || '会社名未取得'} / {selectedResult.yakkaiCode || '薬価コード未取得'}
                </p>
              </div>
              <button
                type="button"
                className="bookmark-toggle"
                aria-pressed={selectedResultIsBookmarked}
                onClick={() => toggleBookmark(selectedResult)}
              >
                {selectedResultIsBookmarked ? '★ 解除' : '☆ 登録'}
              </button>
            </div>

            <dl className="drug-meta">
              <div>
                <dt>YJコード</dt>
                <dd>{selectedResult.kikansiCode}</dd>
              </div>
              <div>
                <dt>PDF</dt>
                <dd>
                  {selectedResult.insertUrl ? (
                    <a href={selectedResult.insertUrl} target="_blank" rel="noreferrer">
                      別タブで開く
                    </a>
                  ) : (
                    '未取得'
                  )}
                </dd>
              </div>
              <div>
                <dt>キャッシュ / 接続</dt>
                <dd>{formatCacheSummary(searchState?.cacheInfo, isOnline)}</dd>
              </div>
            </dl>

            <section className="document-status document-status-info" aria-labelledby="pdf-info-heading">
              <h3 id="pdf-info-heading">添付文書PDF / 薬剤情報</h3>
              <div className="drug-info-grid">
                <div className="drug-info-item">
                  <span className="drug-info-label">販売名</span>
                  <span className="drug-info-value">{selectedResult.name}</span>
                </div>
                <div className="drug-info-item">
                  <span className="drug-info-label">製造販売業者</span>
                  <span className="drug-info-value">{selectedResult.companyName || '未取得'}</span>
                </div>
                <div className="drug-info-item">
                  <span className="drug-info-label">薬価基準収載医薬品コード</span>
                  <span className="drug-info-value">{selectedResult.yakkaiCode || '未取得'}</span>
                </div>
                <div className="drug-info-item">
                  <span className="drug-info-label">YJコード</span>
                  <span className="drug-info-value">{selectedResult.kikansiCode || '未取得'}</span>
                </div>
                <div className="drug-info-item">
                  <span className="drug-info-label">PDF URL</span>
                  <span className="drug-info-value pdf-url-value">
                    {selectedResult.insertUrl ? (
                      <span className="pdf-url-text">{selectedResult.insertUrl}</span>
                    ) : (
                      '未取得'
                    )}
                  </span>
                </div>
              </div>

              <div className="clinical-info-area">
                {clinicalSections.map((section) => (
                  <details
                    className={section.className ? `clinical-section ${section.className}` : 'clinical-section'}
                    key={section.key}
                    open={section.open}
                  >
                    <summary className="clinical-summary">{section.title}</summary>
                    <MarkdownContent className="clinical-content" markdown={section.markdown} />
                  </details>
                ))}

                {sideEffects.length > 0 ? (
                  <details className="clinical-section">
                    <summary className="clinical-summary">副作用 ({sideEffects.length}件)</summary>
                    <div className="clinical-content">
                      <div className="side-effects-table-container">
                        <table className="side-effects-table">
                          <thead>
                            <tr>
                              <th>副作用名</th>
                              <th>分類</th>
                              <th>頻度</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sideEffects.map((sideEffect, index) => (
                              <tr key={`${sideEffect.name}-${index}`}>
                                <td className="font-bold">{sideEffect.name}</td>
                                <td>{sideEffect.category}</td>
                                <td>{sideEffect.frequency || '不明'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <div className="viewer-empty">
            <h2 id="viewer-heading">候補を選択してください</h2>
            <p>検索結果またはブックマークから薬剤を選ぶと、添付文書ビューアを表示します。</p>
          </div>
        )}
      </section>

      <section className={`status-card status-${searchState?.status ?? 'idle'}`} aria-live="polite">
        <div>
          <h2>{getStatusTitle(searchState)}</h2>
          <p>{getStatusMessage(searchState, results.length)}</p>
        </div>
        <CacheStatusBadges cacheInfo={searchState?.cacheInfo} isOnline={isOnline} />
      </section>

      <section className="layout-grid" aria-label="検索結果とブックマーク">
        <section className="panel-card candidates-card" aria-labelledby="candidate-heading">
          <div className="section-heading">
            <h2 id="candidate-heading">候補一覧</h2>
            <span>{results.length}件</span>
          </div>
          {results.length > 0 ? (
            <ul className="candidate-list" aria-label="PMDA検索候補" role="listbox">
              {results.map((result, index) => (
                <li key={result.kikansiCode} role="presentation">
                  <button
                    ref={(element) => {
                      candidateButtonRefs.current[index] = element;
                    }}
                    className={
                      selectedResult?.kikansiCode === result.kikansiCode
                        ? 'candidate-button is-selected'
                        : 'candidate-button'
                    }
                    type="button"
                    role="option"
                    aria-selected={selectedResult?.kikansiCode === result.kikansiCode}
                    onClick={() => setSelectedResult(result)}
                    onKeyDown={(event) => handleCandidateKeyDown(event, index, result)}
                  >
                    <span>{result.name}</span>
                    <small>
                      {result.companyName || '会社名未取得'} / {result.yakkaiCode || '薬価コード未取得'}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">検索候補はまだありません。</p>
          )}
        </section>

        <section className="panel-card bookmarks-card" aria-labelledby="bookmark-heading">
          <div className="section-heading">
            <h2 id="bookmark-heading">ブックマーク</h2>
            <span>{bookmarks.length}件</span>
          </div>
          {bookmarks.length > 0 ? (
            <ul className="bookmark-list" aria-label="ブックマーク済み薬剤">
              {bookmarks.map((bookmark) => (
                <li key={bookmark.kikansiCode}>
                  <button type="button" onClick={() => setSelectedResult(bookmark)}>
                    <span>{bookmark.name}</span>
                    <small>{bookmark.companyName || '会社名未取得'}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">よく見る薬剤を登録するとここに表示されます。</p>
          )}
        </section>
      </section>
    </main>
  );
}

function CacheStatusBadges({
  cacheInfo,
  isOnline,
}: {
  cacheInfo?: PmdaSearchCacheInfo;
  isOnline: boolean;
}) {
  const ttlState = getTtlState(cacheInfo);

  return (
    <div className="status-badges" aria-label="キャッシュと接続状態">
      <span className={isOnline ? 'status-badge is-online' : 'status-badge is-offline'}>
        {isOnline ? 'オンライン' : 'オフライン'}
      </span>
      {cacheInfo ? <span className="status-badge">{getCacheSourceLabel(cacheInfo)}</span> : null}
      {ttlState ? <span className={`status-badge ${ttlState.className}`}>{ttlState.label}</span> : null}
    </div>
  );
}

function getClinicalSections(result: PmdaSearchResult): ClinicalMarkdownSection[] {
  const sections: ClinicalMarkdownSectionInput[] = [
    { key: 'indication', title: '効能・効果', markdown: result.indication, open: true },
    { key: 'dosage', title: '用法・用量', markdown: result.dosage },
    { key: 'warnings', title: '警告', markdown: result.warnings, className: 'warning-section' },
    {
      key: 'contraindication',
      title: '禁忌',
      markdown: result.contraindication,
      className: 'error-section',
    },
    { key: 'precautions', title: '使用上の注意', markdown: result.precautions },
    { key: 'interactions', title: '相互作用', markdown: result.interactionsText },
  ];

  return sections.flatMap((section) => {
    if (!section.markdown?.trim()) {
      return [];
    }

    return [{ ...section, markdown: section.markdown }];
  });
}

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    function handleOnline(): void {
      setIsOnline(true);
    }

    function handleOffline(): void {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

function getStatusTitle(searchState: PmdaSearchState | null): string {
  if (!searchState) {
    return '準備完了';
  }

  if (searchState.status === 'loading') {
    return '検索中';
  }

  if (searchState.status === 'error') {
    return '検索エラー';
  }

  if (searchState.status === 'success') {
    return '検索完了';
  }

  return '準備完了';
}

function getStatusMessage(searchState: PmdaSearchState | null, shown: number): string {
  if (!searchState) {
    return '薬品名を入力するか、Webページ上で選択した薬品名から右クリック検索してください。';
  }

  if (searchState.status === 'loading') {
    return `${searchState.keyword} をPMDAで検索しています。`;
  }

  if (searchState.status === 'error') {
    return searchState.error?.message ?? '検索中にエラーが発生しました。';
  }

  if (searchState.status === 'success') {
    return `${searchState.keyword} の候補を ${shown} 件表示しています。`;
  }

  return '薬品名を入力してください。';
}

function formatCacheSummary(cacheInfo: PmdaSearchCacheInfo | undefined, isOnline: boolean): string {
  const networkState = isOnline ? 'オンライン' : 'オフライン';

  if (!cacheInfo) {
    return `${networkState} / キャッシュ情報なし`;
  }

  const sourceLabel = getCacheSourceLabel(cacheInfo);
  const ttlLabel = getTtlState(cacheInfo)?.label ?? 'TTL未設定';

  return `${networkState} / ${sourceLabel} / ${ttlLabel}`;
}

function getCacheSourceLabel(cacheInfo: PmdaSearchCacheInfo): string {
  switch (cacheInfo.source) {
    case 'network':
      return 'API取得';
    case 'freshCache':
      return 'キャッシュ済';
    case 'staleCache':
      return '期限切れキャッシュ';
    case 'drugIndex':
      return 'ローカル索引';
    default:
      return 'キャッシュ';
  }
}

function getTtlState(
  cacheInfo?: PmdaSearchCacheInfo,
): { label: string; className: string } | null {
  if (!cacheInfo?.expiresAt) {
    return null;
  }

  const remainingMs = cacheInfo.expiresAt - Date.now();

  if (remainingMs <= 0) {
    return { label: '期限切れ', className: 'is-stale' };
  }

  if (remainingMs < CACHE_TTL_WARNING_THRESHOLD_MS) {
    return { label: `期限 ${formatDuration(remainingMs)}以内`, className: 'is-warning' };
  }

  return { label: `有効 ${formatDuration(remainingMs)}`, className: 'is-fresh' };
}

function formatDuration(ms: number): string {
  const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1_000)));

  if (hours < 24) {
    return `${hours}時間`;
  }

  return `${Math.ceil(hours / 24)}日`;
}

function isSearchStateMessage(message: unknown): message is PmdaSearchStateMessage {
  if (!isRecord(message) || message.type !== PMDA_SEARCH_STATE_MESSAGE) {
    return false;
  }

  return isSearchState(message.payload);
}

function isSearchState(value: unknown): value is PmdaSearchState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isSearchStatus(value.status) &&
    typeof value.keyword === 'string' &&
    isSearchSource(value.source) &&
    typeof value.updatedAt === 'number'
  );
}

function isSearchStatus(value: unknown): value is PmdaSearchState['status'] {
  return value === 'idle' || value === 'loading' || value === 'success' || value === 'error';
}

function isSearchSource(value: unknown): value is PmdaSearchState['source'] {
  return value === 'contextMenu' || value === 'popup' || value === 'contentScript' || value === 'sidePanel';
}

function isSearchResultArray(value: unknown): value is PmdaSearchResult[] {
  return Array.isArray(value) && value.every(isSearchResult);
}

function isSearchResult(value: unknown): value is PmdaSearchResult {
  return (
    isRecord(value) &&
    typeof value.kikansiCode === 'string' &&
    typeof value.name === 'string' &&
    typeof value.yakkaiCode === 'string' &&
    typeof value.companyName === 'string' &&
    (value.insertUrl === null || typeof value.insertUrl === 'string')
  );
}

function isDisplayMode(value: unknown): value is PmdaDisplayMode {
  return value === 'popup' || value === 'sidePanel';
}

function isFontSize(value: unknown): value is PmdaFontSize {
  return value === 'small' || value === 'medium' || value === 'large';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
