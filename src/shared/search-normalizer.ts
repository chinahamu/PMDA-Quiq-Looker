const DRUG_NAME_ALIASES: Record<string, string> = {
  アムロジン: 'アムロジピン',
  ノルバスク: 'アムロジピン',
  カロナール: 'アセトアミノフェン',
  ロキソニン: 'ロキソプロフェン',
  ムコダイン: 'カルボシステイン',
  ムコソルバン: 'アンブロキソール',
  メジコン: 'デキストロメトルファン',
  フロモックス: 'セフカペン',
  メイアクト: 'セフジトレン',
  クラビット: 'レボフロキサシン',
  タケプロン: 'ランソプラゾール',
  ネキシウム: 'エソメプラゾール',
  パリエット: 'ラベプラゾール',
  ガスター: 'ファモチジン',
  アレグラ: 'フェキソフェナジン',
  ザイザル: 'レボセチリジン',
  クラリチン: 'ロラタジン',
  シングレア: 'モンテルカスト',
};

export function normalizePmdaSearchKeyword(input: string): string {
  const normalized = normalizeJapaneseDrugText(input);

  if (!normalized) {
    return '';
  }

  return DRUG_NAME_ALIASES[normalized] ?? normalized;
}

export function normalizeJapaneseDrugText(input: string): string {
  return toKatakana(input)
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\s\u3000]+/g, '')
    .replace(/[「」『』【】［］[\]（）()]/g, '')
    .trim();
}

function toKatakana(input: string): string {
  return input.replace(/[ぁ-ゖ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60),
  );
}
