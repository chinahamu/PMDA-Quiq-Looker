import { vi } from 'vitest';

interface StorageAreaMock {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  snapshot: () => Record<string, unknown>;
}

function createStorageAreaMock(): StorageAreaMock {
  let values: Record<string, unknown> = {};

  return {
    get: vi.fn((keys?: string | string[] | Record<string, unknown> | null, callback?: (items: Record<string, unknown>) => void) => {
      const result: Record<string, unknown> = {};

      if (keys === undefined || keys === null) {
        Object.assign(result, values);
      } else if (typeof keys === 'string') {
        result[keys] = values[keys];
      } else if (Array.isArray(keys)) {
        for (const key of keys) {
          result[key] = values[key];
        }
      } else {
        for (const [key, defaultValue] of Object.entries(keys)) {
          result[key] = values[key] ?? defaultValue;
        }
      }

      callback?.(result);
    }),
    set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
      values = { ...values, ...items };
      callback?.();
    }),
    remove: vi.fn((keys: string | string[], callback?: () => void) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete values[key];
      }

      callback?.();
    }),
    clear: vi.fn((callback?: () => void) => {
      values = {};
      callback?.();
    }),
    snapshot: () => ({ ...values }),
  };
}

function createEventMock() {
  const listeners = new Set<(...args: unknown[]) => void>();

  return {
    addListener: vi.fn((listener: (...args: unknown[]) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (...args: unknown[]) => void) => {
      listeners.delete(listener);
    }),
    hasListener: vi.fn((listener: (...args: unknown[]) => void) => listeners.has(listener)),
    dispatch: (...args: unknown[]) => {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
}

export function createChromeMock() {
  const local = createStorageAreaMock();
  const session = createStorageAreaMock();

  return {
    action: {
      setTitle: vi.fn(),
    },
    contextMenus: {
      create: vi.fn(),
      onClicked: createEventMock(),
    },
    runtime: {
      lastError: undefined,
      onInstalled: createEventMock(),
      onMessage: createEventMock(),
      onConnect: createEventMock(),
      sendMessage: vi.fn(),
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    },
    sidePanel: {
      setOptions: vi.fn(() => Promise.resolve()),
      open: vi.fn(() => Promise.resolve()),
    },
    storage: {
      local,
      session,
      onChanged: createEventMock(),
    },
  };
}

export function getExtensionPath(path: string): string {
  return new URL(`../../${path}`, import.meta.url).pathname;
}
