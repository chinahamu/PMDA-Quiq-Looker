export interface PmdaSearchResult {
  kikansiCode: string;
  name: string;
  yakkaiCode: string;
  companyName: string;
  insertUrl: string | null;
  indication?: string;
  dosage?: string;
  contraindication?: string;
  warnings?: string;
  precautions?: string;
  interactionsText?: string;
  sideEffects?: {
    side_effects_list?: Array<{
      name: string;
      category: string;
      severity: string;
      frequency: string;
    }>;
  };
}

export interface PmdaSearchResponse {
  total: number;
  results: PmdaSearchResult[];
}

export type PmdaSearchSource = 'contextMenu' | 'popup' | 'contentScript' | 'sidePanel';

export type PmdaSearchStatus = 'idle' | 'loading' | 'success' | 'error';

export type PmdaDisplayMode = 'popup' | 'sidePanel';

export type PmdaFontSize = 'small' | 'medium' | 'large';

export type PmdaSearchCacheSource = 'network' | 'freshCache' | 'staleCache' | 'drugIndex';

export interface PmdaSearchCacheInfo {
  source: PmdaSearchCacheSource;
  cachedAt?: number;
  expiresAt?: number;
  refreshedAt?: number;
}

export interface PmdaSearchError {
  code: string;
  message: string;
  status?: number;
}

export interface PmdaSearchState {
  status: PmdaSearchStatus;
  keyword: string;
  source: PmdaSearchSource;
  response?: PmdaSearchResponse;
  cacheInfo?: PmdaSearchCacheInfo;
  error?: PmdaSearchError;
  updatedAt: number;
}

export interface PmdaSearchRequestMessage {
  type: 'PMDA_SEARCH_REQUEST';
  payload: {
    keyword: string;
    source: PmdaSearchSource;
  };
}

export interface PmdaSearchStateMessage {
  type: 'PMDA_SEARCH_STATE';
  payload: PmdaSearchState;
}

export type PmdaRuntimeMessage = PmdaSearchRequestMessage | PmdaSearchStateMessage;

export interface PmdaSearchRequestResponse {
  ok: boolean;
  state: PmdaSearchState;
}
