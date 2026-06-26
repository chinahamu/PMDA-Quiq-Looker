import {
  PMDA_API_BASE_URL,
  PMDA_REQUEST_DEBOUNCE_MS,
  PMDA_REQUEST_TIMEOUT_MS,
  PMDA_SITE_BASE_URL,
} from '../shared/constants';
import type { PmdaSearchResponse, PmdaSearchResult } from '../shared/types';

export type PmdaClientErrorCode =
  | 'DEBOUNCED'
  | 'INVALID_KEYWORD'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE';

export class PmdaClientError extends Error {
  readonly code: PmdaClientErrorCode;

  readonly status?: number;

  constructor(code: PmdaClientErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'PmdaClientError';
    this.code = code;
    this.status = status;
  }
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface PmdaApiClientOptions {
  apiBaseUrl?: string;
  siteBaseUrl?: string;
  fetcher?: FetchLike;
  debounceMs?: number;
  timeoutMs?: number;
  maxDetails?: number;
}

type NormalizedSearchItem = Omit<PmdaSearchResult, 'insertUrl'> & {
  insertUrl?: string | null;
};

interface ValueEntry {
  key: string;
  value: unknown;
}

const SEARCH_ENDPOINT = '/api/iyakuSearch/';
const DETAIL_ENDPOINT = '/api/iyakuDetail/';

const SEARCH_LIST_KEYS = ['results', 'result', 'data', 'items', 'list', 'iyaku', 'iyakuList'];
const TOTAL_KEYS = ['total', 'totalCount', 'hitCount', 'count', 'recordsTotal'];
const TOTAL_CONTAINER_KEYS = ['meta', 'metadata', 'pagination', 'pageInfo'];
const KIKANSI_CODE_KEYS = [
  'kikansiCode',
  'kikansiCd',
  'kikansi_code',
  'itemCode',
  'code',
  'medicineCode',
];
const NAME_KEYS = ['name', 'itemName', 'medicineName', 'drugName', 'hanbaiName', 'brandName'];
const YAKKAI_CODE_KEYS = ['yakkaiCode', 'yakkaCode', 'yjCode', 'yJCode', 'drugPriceCode'];
const COMPANY_NAME_KEYS = ['companyName', 'company', 'makerName', 'marketingCompany', 'hanbaiMoto'];
const INSERT_URL_KEYS = [
  'insertUrl',
  'insert_url',
  'pdfUrl',
  'pdf_url',
  'tenpuUrl',
  'tenpuBunshoUrl',
];

interface PendingDebounce {
  timeoutId: ReturnType<typeof setTimeout>;
  reject: (reason: PmdaClientError) => void;
}

export class PmdaApiClient {
  private readonly apiBaseUrl: string;

  private readonly siteBaseUrl: string;

  private readonly fetcher: FetchLike;

  private readonly debounceMs: number;

  private readonly timeoutMs: number;

  private readonly maxDetails: number;

  private pendingDebounce: PendingDebounce | null = null;

  constructor(options: PmdaApiClientOptions = {}) {
    this.apiBaseUrl = options.apiBaseUrl ?? PMDA_API_BASE_URL;
    this.siteBaseUrl = options.siteBaseUrl ?? PMDA_SITE_BASE_URL;
    this.fetcher = options.fetcher ?? ((input, init) => fetch(input, init));
    this.debounceMs = options.debounceMs ?? PMDA_REQUEST_DEBOUNCE_MS;
    this.timeoutMs = options.timeoutMs ?? PMDA_REQUEST_TIMEOUT_MS;
    this.maxDetails = options.maxDetails ?? 20;
  }

  async search(keyword: string): Promise<PmdaSearchResponse> {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      throw new PmdaClientError('INVALID_KEYWORD', '検索キーワードを入力してください。');
    }

    await this.waitForDebounce();

    const searchPayload = await this.requestJson(SEARCH_ENDPOINT, {
      keyword: normalizedKeyword,
      type: 'json',
    });
    const searchItems = extractItems(searchPayload)
      .map((item) => normalizeSearchItem(item, this.siteBaseUrl))
      .filter(isDefined);
    const results = searchItems.map<PmdaSearchResult>((item) => ({
      ...item,
      insertUrl: item.insertUrl ?? null,
    }));
    const total = extractTotal(searchPayload, results.length);

    if (results.length === 0 || this.maxDetails <= 0) {
      return {
        total,
        results,
      };
    }

    const detailCount = Math.min(results.length, this.maxDetails);
    const detailedResults = await Promise.all(
      results.slice(0, detailCount).map(async (result) => {
        const detailPayload = await this.requestJson(DETAIL_ENDPOINT, {
          kikansiCode: result.kikansiCode,
          type: 'json',
        });

        const rawObj = isRecord(detailPayload) ? detailPayload : {};
        const dataObj = isRecord(rawObj.data) ? rawObj.data : {};

        const getField = (key: string): string | undefined => {
          if (typeof rawObj[key] === 'string') return rawObj[key] as string;
          if (typeof dataObj[key] === 'string') return dataObj[key] as string;
          return undefined;
        };

        const getObjectField = (key: string): Record<string, unknown> | undefined => {
          if (isRecord(rawObj[key])) return rawObj[key];
          if (isRecord(dataObj[key])) return dataObj[key];
          return undefined;
        };

        return {
          ...result,
          insertUrl: findPdfUrl(detailPayload, this.siteBaseUrl) ?? result.insertUrl,
          indication: getField('indication'),
          dosage: getField('dosage'),
          contraindication: getField('contraindication'),
          warnings: getField('warnings'),
          precautions: getField('precautions'),
          interactionsText: getField('interactionsText'),
          sideEffects: getObjectField('sideEffects'),
        } satisfies PmdaSearchResult;
      }),
    );

    return {
      total,
      results: [...detailedResults, ...results.slice(detailCount)],
    };
  }

  private waitForDebounce(): Promise<void> {
    if (this.debounceMs <= 0) {
      return Promise.resolve();
    }

    if (this.pendingDebounce) {
      clearTimeout(this.pendingDebounce.timeoutId);
      this.pendingDebounce.reject(
        new PmdaClientError('DEBOUNCED', '新しい検索リクエストに置き換えられました。'),
      );
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingDebounce?.timeoutId === timeoutId) {
          this.pendingDebounce = null;
        }

        resolve();
      }, this.debounceMs);

      this.pendingDebounce = {
        timeoutId,
        reject,
      };
    });
  }

  private async requestJson(endpoint: string, params: Record<string, string>): Promise<unknown> {
    const url = new URL(endpoint, this.apiBaseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetcher(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new PmdaClientError(
          'API_ERROR',
          `PMDA API request failed with status ${response.status}.`,
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new PmdaClientError('INVALID_RESPONSE', 'PMDA API response is not valid JSON.');
      }
    } catch (error) {
      if (error instanceof PmdaClientError) {
        throw error;
      }

      if (isAbortError(error)) {
        throw new PmdaClientError('TIMEOUT', 'PMDA API request timed out.');
      }

      let errorMessage = 'PMDA API request failed.';
      if (error instanceof Error) {
        errorMessage = `PMDA API request failed: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `PMDA API request failed: ${error}`;
      }

      throw new PmdaClientError('NETWORK_ERROR', errorMessage);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const pmdaApiClient = new PmdaApiClient();

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of SEARCH_LIST_KEYS) {
    const value = getValue(payload, key);

    if (Array.isArray(value)) {
      return value;
    }

    const nestedItems = extractItems(value);

    if (nestedItems.length > 0) {
      return nestedItems;
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function extractTotal(payload: unknown, fallback: number): number {
  if (!isRecord(payload)) {
    return fallback;
  }

  const total = pickNumber(payload, TOTAL_KEYS);

  if (total !== null) {
    return total;
  }

  for (const key of TOTAL_CONTAINER_KEYS) {
    const value = getValue(payload, key);

    if (isRecord(value)) {
      const nestedTotal = pickNumber(value, TOTAL_KEYS);

      if (nestedTotal !== null) {
        return nestedTotal;
      }
    }
  }

  return fallback;
}

function normalizeSearchItem(item: unknown, siteBaseUrl: string): NormalizedSearchItem | null {
  if (!isRecord(item)) {
    return null;
  }

  const kikansiCode = pickString(item, KIKANSI_CODE_KEYS);
  const name = pickString(item, NAME_KEYS);

  if (!kikansiCode || !name) {
    return null;
  }

  return {
    kikansiCode,
    name,
    yakkaiCode: pickString(item, YAKKAI_CODE_KEYS) ?? '',
    companyName: pickString(item, COMPANY_NAME_KEYS) ?? '',
    insertUrl: findPdfUrl(item, siteBaseUrl),
  };
}

function findPdfUrl(payload: unknown, siteBaseUrl: string): string | null {
  return findPdfUrlDeep(payload, siteBaseUrl, new Set<unknown>());
}

function findPdfUrlDeep(
  payload: unknown,
  siteBaseUrl: string,
  seen: Set<unknown>,
  keyName = '',
): string | null {
  if (typeof payload === 'string') {
    return isPdfUrlCandidate(payload, keyName) ? normalizeUrl(payload, siteBaseUrl) : null;
  }

  if (!isRecord(payload) && !Array.isArray(payload)) {
    return null;
  }

  if (seen.has(payload)) {
    return null;
  }

  seen.add(payload);

  if (isRecord(payload)) {
    const directValue = pickPdfUrl(payload, siteBaseUrl);

    if (directValue) {
      return directValue;
    }

    for (const [childKey, value] of Object.entries(payload)) {
      const result = findPdfUrlDeep(value, siteBaseUrl, seen, childKey);

      if (result) {
        return result;
      }
    }
  }

  if (Array.isArray(payload)) {
    for (const value of payload) {
      const result = findPdfUrlDeep(value, siteBaseUrl, seen, keyName);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

function pickPdfUrl(record: Record<string, unknown>, siteBaseUrl: string): string | null {
  for (const key of INSERT_URL_KEYS) {
    const entry = findEntry(record, key);
    const stringValue = entry ? valueToString(entry.value) : null;

    if (entry && stringValue && isPdfUrlCandidate(stringValue, entry.key)) {
      return normalizeUrl(stringValue, siteBaseUrl);
    }
  }

  return null;
}

function isPdfUrlCandidate(value: string, keyName: string): boolean {
  const lowerValue = value.toLowerCase();
  const lowerKey = keyName.toLowerCase();

  return lowerValue.includes('.pdf') || lowerKey.includes('pdf');
}

function normalizeUrl(value: string, siteBaseUrl: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, siteBaseUrl).toString();
  } catch {
    return null;
  }
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = getValue(record, key);
    const stringValue = valueToString(value);

    if (stringValue) {
      return stringValue;
    }
  }

  return null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = getValue(record, key);
    const numberValue = valueToNumber(value);

    if (numberValue !== null) {
      return numberValue;
    }
  }

  return null;
}

function getValue(record: Record<string, unknown>, key: string): unknown {
  return findEntry(record, key)?.value;
}

function findEntry(record: Record<string, unknown>, key: string): ValueEntry | null {
  if (key in record) {
    return { key, value: record[key] };
  }

  const lowerKey = key.toLowerCase();
  const matchedKey = Object.keys(record).find((candidate) => candidate.toLowerCase() === lowerKey);

  return matchedKey ? { key: matchedKey, value: record[matchedKey] } : null;
}

function valueToString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function valueToNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());

    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}
