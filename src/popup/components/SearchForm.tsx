import { FormEvent } from 'react';

interface SearchFormProps {
  keyword: string;
  isLoading: boolean;
  onKeywordChange: (keyword: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SearchForm({ keyword, isLoading, onKeywordChange, onSubmit }: SearchFormProps) {
  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={onSubmit}
    >
      <label className="text-sm font-bold text-slate-700" htmlFor="keyword">
        薬品名
      </label>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          id="keyword"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="例：アムロジピン"
          type="search"
        />
        <button
          className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? '検索中' : '検索'}
        </button>
      </div>
    </form>
  );
}
