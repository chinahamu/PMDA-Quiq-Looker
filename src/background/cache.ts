import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { PmdaSearchResponse, PmdaSearchResult } from '../shared/types';

export const PMDA_CACHE_DB_NAME = 'pmda-quick-looker';
export const PMDA_CACHE_DB_VERSION = 2;

export const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
export const SEARCH_CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;
export const PMDA_CACHE_MAX_BYTES = 100 * 1024 * 1024;

const DRUG_INDEX_STORE_NAME = 'drug_index';
const SEARCH_HISTORY_STORE_NAME = 'search_history';
const SEARCH_STORE_NAME = 'search_cache';
const NAME_INDEX_NAME = 'by-name';
const CACHED_AT_INDEX_NAME = 'by-cached-at';
const EXPIRES_AT_INDEX_NAME = 'by-expires-at';
const LAST_ACCESSED_AT_INDEX_NAME = 'by-last-accessed-at';
const ACCESSED_AT_INDEX_NAME = 'by-accessed-at';
const KIKANSI_CODE_INDEX_NAME = 'by-kikansi-code';
const QUERY_INDEX_NAME = 'by-query';

export interface DrugIndex {
  kikansiCode: string;
  name: string;
  companyName: string;
  pdfUrl: string | null;
  cachedAt: number;
}

export interface SearchHistory {
  id?: number;
  query: string;
  kikansiCode: string;
  accessedAt: number;
}

export interface SearchCache {
  keyword: string;
  results: PmdaSearchResult[];
  total: number;
  cachedAt: number;
  expiresAt: number;
}

export interface PmdaCacheLookup<TValue> {
  value: TValue;
  cachedAt: number;
  expiresAt: number;
  isExpired: boolean;
}

export interface PmdaStorageEstimate {
  supported: boolean;
  usage?: number;
  quota?: number;
  usageRatio?: number;
}

export interface PmdaCacheUsage {
  totalBytes: number;
  drugIndexCount: number;
  searchCount: number;
  historyCount: number;
  storageEstimate: PmdaStorageEstimate;
}

export interface PmdaCacheOptions {
  dbName?: string;
  maxBytes?: number;
  now?: () => number;
}

interface CacheMetadata {
  lastAccessedAt: number;
  sizeBytes: number;
}

interface ExpirableMetadata extends CacheMetadata {
  cachedAt: number;
  expiresAt: number;
}

type DrugIndexRecord = DrugIndex & CacheMetadata;
type SearchCacheRecord = SearchCache & ExpirableMetadata;
type SearchHistoryRecord = SearchHistory & { id: number; sizeBytes: number };

type DrugIndexInput = Omit<DrugIndex, 'cachedAt'> & Partial<Pick<DrugIndex, 'cachedAt'>>;
type SearchCacheInput = Omit<SearchCache, 'cachedAt' | 'expiresAt'> &
  Partial<Pick<SearchCache, 'cachedAt' | 'expiresAt'>>;

type CacheStoreName = typeof DRUG_INDEX_STORE_NAME | typeof SEARCH_STORE_NAME | typeof SEARCH_HISTORY_STORE_NAME;

interface UsageEntry {
  storeName: CacheStoreName;
  key: string | number;
  lastAccessedAt: number;
  sizeBytes: number;
}

interface PmdaCacheDatabase extends DBSchema {
  [DRUG_INDEX_STORE_NAME]: {
    key: string;
    value: DrugIndexRecord;
    indexes: {
      [NAME_INDEX_NAME]: string;
      [CACHED_AT_INDEX_NAME]: number;
      [LAST_ACCESSED_AT_INDEX_NAME]: number;
    };
  };
  [SEARCH_HISTORY_STORE_NAME]: {
    key: number;
    value: SearchHistoryRecord;
    indexes: {
      [ACCESSED_AT_INDEX_NAME]: number;
      [KIKANSI_CODE_INDEX_NAME]: string;
      [QUERY_INDEX_NAME]: string;
    };
  };
  [SEARCH_STORE_NAME]: {
    key: string;
    value: SearchCacheRecord;
    indexes: {
      [EXPIRES_AT_INDEX_NAME]: number;
      [LAST_ACCESSED_AT_INDEX_NAME]: number;
    };
  };
}

export class PmdaCache {
  private readonly maxBytes: number;

  private readonly now: () => number;

  private readonly dbPromise: Promise<IDBPDatabase<PmdaCacheDatabase>>;

  constructor(options: PmdaCacheOptions = {}) {
    this.maxBytes = options.maxBytes ?? PMDA_CACHE_MAX_BYTES;
    this.now = options.now ?? (() => Date.now());
    this.dbPromise = openPmdaCacheDb(options.dbName ?? PMDA_CACHE_DB_NAME);
  }

  async getDrugIndex(kikansiCode: string): Promise<DrugIndex | null> {
    const key = normalizeCacheKey(kikansiCode);

    if (!key) {
      return null;
    }

    const db = await this.dbPromise;
    const record = await db.get(DRUG_INDEX_STORE_NAME, key);

    if (!record) {
      return null;
    }

    await this.touchDrugIndex(record);

    return toDrugIndex(record);
  }

  async putDrugIndex(input: DrugIndexInput): Promise<void> {
    const key = normalizeCacheKey(input.kikansiCode);
    const now = this.now();

    if (!key) {
      return;
    }

    const recordWithoutSize: DrugIndexRecord = {
      kikansiCode: key,
      name: input.name.trim(),
      companyName: input.companyName.trim(),
      pdfUrl: normalizeNullableUrl(input.pdfUrl),
      cachedAt: input.cachedAt ?? now,
      lastAccessedAt: now,
      sizeBytes: 0,
    };
    const record = withEstimatedSize(recordWithoutSize);
    const db = await this.dbPromise;

    await db.put(DRUG_INDEX_STORE_NAME, record);
    await this.enforceCapacity();
  }

  async searchDrugIndexByName(query: string, limit = 20): Promise<DrugIndex[]> {
    const normalizedQuery = normalizeSearchKeyword(query);

    if (!normalizedQuery || limit <= 0) {
      return [];
    }

    const db = await this.dbPromise;
    const records = await db.getAll(DRUG_INDEX_STORE_NAME);

    return records
      .filter((record) => {
        const values = [record.name, record.companyName, record.kikansiCode].map(normalizeSearchKeyword);
        return values.some((value) => value.includes(normalizedQuery));
      })
      .sort((left, right) => right.cachedAt - left.cachedAt)
      .slice(0, limit)
      .map(toDrugIndex);
  }

  async getSearch(keyword: string): Promise<PmdaSearchResponse | null> {
    const lookup = await this.getSearchWithMetadata(keyword);

    return lookup && !lookup.isExpired ? lookup.value : null;
  }

  async getSearchWithMetadata(keyword: string): Promise<PmdaCacheLookup<PmdaSearchResponse> | null> {
    const key = normalizeSearchKeyword(keyword);

    if (!key) {
      return null;
    }

    const db = await this.dbPromise;
    const record = await db.get(SEARCH_STORE_NAME, key);

    if (!record) {
      return null;
    }

    const touchedRecord = await this.touchSearch(record);

    return toLookup(toSearchResponse(touchedRecord), touchedRecord, this.now());
  }

  async putSearch(keyword: string, response: PmdaSearchResponse): Promise<void> {
    await this.putSearchRecord({
      keyword: normalizeSearchKeyword(keyword),
      results: response.results,
      total: response.total,
    });

    if (response.results.length > 0) {
      await this.recordSearchHistory(keyword, response.results[0].kikansiCode);
    }
  }

  async recordSearchHistory(query: string, kikansiCode: string, accessedAt = this.now()): Promise<void> {
    const normalizedQuery = normalizeCacheKey(query);
    const normalizedKikansiCode = normalizeCacheKey(kikansiCode);

    if (!normalizedQuery || !normalizedKikansiCode) {
      return;
    }

    const recordWithoutSize = {
      query: normalizedQuery,
      kikansiCode: normalizedKikansiCode,
      accessedAt,
      sizeBytes: 0,
    };
    const record = withEstimatedSize(recordWithoutSize);
    const db = await this.dbPromise;

    await db.add(SEARCH_HISTORY_STORE_NAME, record as SearchHistoryRecord);
    await this.enforceCapacity();
  }

  async getRecentSearchHistory(limit = 20): Promise<SearchHistory[]> {
    if (limit <= 0) {
      return [];
    }

    const db = await this.dbPromise;
    const records = await db.getAll(SEARCH_HISTORY_STORE_NAME);

    return records
      .sort((left, right) => right.accessedAt - left.accessedAt)
      .slice(0, limit)
      .map(({ id, query, kikansiCode, accessedAt }) => ({ id, query, kikansiCode, accessedAt }));
  }

  async clearExpired(): Promise<void> {
    const db = await this.dbPromise;
    const now = this.now();
    const searchRecords = await db.getAll(SEARCH_STORE_NAME);

    await Promise.all(
      searchRecords.filter((record) => isExpired(record, now)).map((record) => db.delete(SEARCH_STORE_NAME, record.keyword)),
    );
  }

  async getUsage(): Promise<PmdaCacheUsage> {
    const db = await this.dbPromise;
    const [drugIndexRecords, searchRecords, historyRecords] = await Promise.all([
      db.getAll(DRUG_INDEX_STORE_NAME),
      db.getAll(SEARCH_STORE_NAME),
      db.getAll(SEARCH_HISTORY_STORE_NAME),
    ]);
    const allRecords = [...drugIndexRecords, ...searchRecords, ...historyRecords];

    return {
      totalBytes: allRecords.reduce((sum, record) => sum + record.sizeBytes, 0),
      drugIndexCount: drugIndexRecords.length,
      searchCount: searchRecords.length,
      historyCount: historyRecords.length,
      storageEstimate: await getStorageEstimate(),
    };
  }

  private async putSearchRecord(input: SearchCacheInput): Promise<void> {
    const key = normalizeSearchKeyword(input.keyword);
    const now = this.now();
    const cachedAt = input.cachedAt ?? now;

    if (!key) {
      return;
    }

    const recordWithoutSize: SearchCacheRecord = {
      keyword: key,
      results: input.results,
      total: input.total,
      cachedAt,
      expiresAt: input.expiresAt ?? cachedAt + SEARCH_CACHE_TTL_MS,
      lastAccessedAt: now,
      sizeBytes: 0,
    };
    const record = withEstimatedSize(recordWithoutSize);
    const db = await this.dbPromise;

    await db.put(SEARCH_STORE_NAME, record);
    await Promise.all(input.results.map((result) => this.putDrugIndexFromSearchResult(result, cachedAt)));
    await this.enforceCapacity();
  }

  private async putDrugIndexFromSearchResult(result: PmdaSearchResult, cachedAt: number): Promise<void> {
    await this.putDrugIndex({
      kikansiCode: result.kikansiCode,
      name: result.name,
      companyName: result.companyName,
      pdfUrl: result.insertUrl,
      cachedAt,
    });
  }

  private async touchDrugIndex(record: DrugIndexRecord): Promise<DrugIndexRecord> {
    const db = await this.dbPromise;
    const touchedRecord = {
      ...record,
      lastAccessedAt: this.now(),
    };

    await db.put(DRUG_INDEX_STORE_NAME, touchedRecord);

    return touchedRecord;
  }

  private async touchSearch(record: SearchCacheRecord): Promise<SearchCacheRecord> {
    const db = await this.dbPromise;
    const touchedRecord = {
      ...record,
      lastAccessedAt: this.now(),
    };

    await db.put(SEARCH_STORE_NAME, touchedRecord);

    return touchedRecord;
  }

  private async enforceCapacity(): Promise<void> {
    if (this.maxBytes <= 0) {
      return;
    }

    await this.clearExpired();

    const db = await this.dbPromise;
    const [drugIndexRecords, searchRecords, historyRecords] = await Promise.all([
      db.getAll(DRUG_INDEX_STORE_NAME),
      db.getAll(SEARCH_STORE_NAME),
      db.getAll(SEARCH_HISTORY_STORE_NAME),
    ]);
    let totalBytes = [...drugIndexRecords, ...searchRecords, ...historyRecords].reduce(
      (sum, record) => sum + record.sizeBytes,
      0,
    );

    if (totalBytes <= this.maxBytes) {
      return;
    }

    const usageEntries: UsageEntry[] = [
      ...drugIndexRecords.map((record) => ({
        storeName: DRUG_INDEX_STORE_NAME as CacheStoreName,
        key: record.kikansiCode,
        lastAccessedAt: record.lastAccessedAt,
        sizeBytes: record.sizeBytes,
      })),
      ...searchRecords.map((record) => ({
        storeName: SEARCH_STORE_NAME as CacheStoreName,
        key: record.keyword,
        lastAccessedAt: record.lastAccessedAt,
        sizeBytes: record.sizeBytes,
      })),
      ...historyRecords.map((record) => ({
        storeName: SEARCH_HISTORY_STORE_NAME as CacheStoreName,
        key: record.id,
        lastAccessedAt: record.accessedAt,
        sizeBytes: record.sizeBytes,
      })),
    ].sort((left, right) => left.lastAccessedAt - right.lastAccessedAt);

    for (const entry of usageEntries) {
      if (totalBytes <= this.maxBytes) {
        break;
      }

      await deleteUsageEntry(db, entry);
      totalBytes -= entry.sizeBytes;
    }
  }
}

export const pmdaCache = new PmdaCache();

async function getStorageEstimate(): Promise<PmdaStorageEstimate> {
  const storage = globalThis.navigator?.storage;

  if (!storage || typeof storage.estimate !== 'function') {
    return { supported: false };
  }

  try {
    const estimate = await storage.estimate();
    const usage = estimate.usage;
    const quota = estimate.quota;

    return {
      supported: true,
      usage,
      quota,
      usageRatio: usage !== undefined && quota ? usage / quota : undefined,
    };
  } catch {
    return { supported: false };
  }
}

function openPmdaCacheDb(dbName: string): Promise<IDBPDatabase<PmdaCacheDatabase>> {
  return openDB<PmdaCacheDatabase>(dbName, PMDA_CACHE_DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion > 0 && oldVersion < 2) {
        if (db.objectStoreNames.contains(SEARCH_STORE_NAME)) {
          db.deleteObjectStore(SEARCH_STORE_NAME);
        }
      }

      if (!db.objectStoreNames.contains(DRUG_INDEX_STORE_NAME)) {
        const store = db.createObjectStore(DRUG_INDEX_STORE_NAME, { keyPath: 'kikansiCode' });

        store.createIndex(NAME_INDEX_NAME, 'name');
        store.createIndex(CACHED_AT_INDEX_NAME, 'cachedAt');
        store.createIndex(LAST_ACCESSED_AT_INDEX_NAME, 'lastAccessedAt');
      }

      if (!db.objectStoreNames.contains(SEARCH_HISTORY_STORE_NAME)) {
        const store = db.createObjectStore(SEARCH_HISTORY_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        store.createIndex(ACCESSED_AT_INDEX_NAME, 'accessedAt');
        store.createIndex(KIKANSI_CODE_INDEX_NAME, 'kikansiCode');
        store.createIndex(QUERY_INDEX_NAME, 'query');
      }

      if (!db.objectStoreNames.contains(SEARCH_STORE_NAME)) {
        const store = db.createObjectStore(SEARCH_STORE_NAME, { keyPath: 'keyword' });

        store.createIndex(EXPIRES_AT_INDEX_NAME, 'expiresAt');
        store.createIndex(LAST_ACCESSED_AT_INDEX_NAME, 'lastAccessedAt');
      }
    },
  });
}

async function deleteUsageEntry(db: IDBPDatabase<PmdaCacheDatabase>, entry: UsageEntry): Promise<void> {
  if (entry.storeName === DRUG_INDEX_STORE_NAME) {
    await db.delete(DRUG_INDEX_STORE_NAME, entry.key as string);
    return;
  }

  if (entry.storeName === SEARCH_STORE_NAME) {
    await db.delete(SEARCH_STORE_NAME, entry.key as string);
    return;
  }

  await db.delete(SEARCH_HISTORY_STORE_NAME, entry.key as number);
}

function normalizeCacheKey(value: string): string {
  return value.trim();
}

function normalizeSearchKeyword(value: string): string {
  return normalizeCacheKey(value).toLocaleLowerCase('ja-JP');
}

function normalizeNullableUrl(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

function isExpired(record: { expiresAt: number }, now: number): boolean {
  return record.expiresAt <= now;
}

function withEstimatedSize<TRecord extends { sizeBytes: number }>(record: TRecord): TRecord {
  const recordWithFreshSize = {
    ...record,
    sizeBytes: 0,
  };

  return {
    ...recordWithFreshSize,
    sizeBytes: estimateRecordSize(recordWithFreshSize),
  };
}

function estimateRecordSize(value: unknown): number {
  const json = JSON.stringify(value);

  if (typeof TextEncoder === 'undefined') {
    return json.length * 2;
  }

  return new TextEncoder().encode(json).byteLength;
}

function toLookup<TValue>(
  value: TValue,
  record: { cachedAt: number; expiresAt: number },
  now: number,
): PmdaCacheLookup<TValue> {
  return {
    value,
    cachedAt: record.cachedAt,
    expiresAt: record.expiresAt,
    isExpired: isExpired(record, now),
  };
}

function toDrugIndex(record: DrugIndexRecord): DrugIndex {
  return {
    kikansiCode: record.kikansiCode,
    name: record.name,
    companyName: record.companyName,
    pdfUrl: record.pdfUrl,
    cachedAt: record.cachedAt,
  };
}

function toSearchResponse(record: SearchCacheRecord): PmdaSearchResponse {
  return {
    total: record.total,
    results: record.results,
  };
}
