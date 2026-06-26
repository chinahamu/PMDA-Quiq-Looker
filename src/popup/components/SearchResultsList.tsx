import type { PmdaSearchResult } from '../../shared/types';

interface SearchResultsListProps {
  results: PmdaSearchResult[];
}

export function SearchResultsList({ results }: SearchResultsListProps) {
  if (results.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">該当なし</h2>
        <p className="mt-2">検索条件に一致する候補はありませんでした。</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">検索結果</h2>
        <p className="mt-1 text-xs text-slate-500">
          添付文書PDFを別タブで開くことができます。
        </p>
      </div>
      <ul
        className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto"
        aria-label="PMDA検索結果"
      >
        {results.map((result) => {
          return (
            <li
              key={result.kikansiCode}
              className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50 transition"
            >
              <div className="min-w-0 flex-1">
                <span
                  className="block text-sm font-bold text-slate-900 truncate"
                  title={result.name}
                >
                  {result.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500 truncate">
                  {result.companyName || '会社名未取得'} / {result.yakkaiCode || '薬価コード未取得'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {result.insertUrl ? (
                  <a
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition"
                    href={result.insertUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDFを開く
                  </a>
                ) : (
                  <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400">
                    PDFなし
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
