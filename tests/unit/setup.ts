import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

import { createChromeMock } from '../utils/chrome-extension';

Object.defineProperty(globalThis, 'chrome', {
  configurable: true,
  value: createChromeMock(),
});

afterEach(() => {
  vi.restoreAllMocks();
});
