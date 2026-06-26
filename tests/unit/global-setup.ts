/* eslint-disable @typescript-eslint/no-explicit-any */
export default function setup() {
  (process as any)._nativeAbortController = globalThis.AbortController;
  (process as any)._nativeAbortSignal = globalThis.AbortSignal;
  (process as any)._nativeFetch = globalThis.fetch;
}
