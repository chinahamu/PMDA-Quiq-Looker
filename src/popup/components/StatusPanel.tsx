import type { PmdaSearchState } from '../../shared/types';

interface StatusPanelProps {
  searchState: PmdaSearchState | null;
}

export function StatusPanel({ searchState }: StatusPanelProps) {
  if (!searchState) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
        <h2 className="text-base font-bold text-slate-900">準備完了</h2>
        <p className="mt-2">
          Webページ上で薬品名を選択して右クリックメニューを実行するか、薬品名を手入力して検索できます。
        </p>
      </section>
    );
  }

  if (searchState.status === 'loading') {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-600" aria-hidden="true" />
          <h2 className="text-base font-bold">検索中</h2>
        </div>
        <p className="mt-2">{searchState.keyword} をPMDAで検索しています。</p>
      </section>
    );
  }

  if (searchState.status === 'error') {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
        <h2 className="text-base font-bold">検索エラー</h2>
        <p className="mt-2">{searchState.error?.message ?? '検索中にエラーが発生しました。'}</p>
        <p className="mt-1 text-xs text-rose-700">
          エラーコード: {searchState.error?.code ?? 'UNKNOWN_ERROR'}
        </p>
      </section>
    );
  }

  const total = searchState.response?.total ?? 0;
  const shown = searchState.response?.results.length ?? 0;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
      <h2 className="text-base font-bold">検索完了</h2>
      <p className="mt-2">
        {searchState.keyword} の候補が {total} 件見つかりました。
      </p>
      <p className="mt-1 text-xs text-emerald-700">
        このポップアップでは {shown} 件を表示しています。
      </p>
    </section>
  );
}
