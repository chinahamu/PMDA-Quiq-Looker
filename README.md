# PMDA Quick Looker

**English:** PMDA Quick Looker is a released Chrome extension for quickly looking up PMDA package insert PDF links and related drug information from selected drug names in web-based clinical workflows.

**日本語:** PMDA Quick Looker は、電子カルテや医療系Web画面上で選択した薬剤名から、添付文書PDFリンクや関連する薬剤情報を素早く検索・参照するためのリリース済み Chrome 拡張機能です。

## Release status / リリース状況

**English:** The core feature set is released: context-menu lookup, popup search, Side Panel review, drug search API integration, local cache, bookmarks, display settings, privacy documentation, store listing materials, and support guidance. Repository documentation describes the released product, not a future implementation plan.

**日本語:** 主要機能はリリース済みです。右クリック検索、ポップアップ検索、Side Panel 表示、薬剤検索API連携、ローカルキャッシュ、ブックマーク、表示設定、プライバシー文書、ストア掲載資料、サポート案内を含みます。リポジトリ内のドキュメントは、将来の実装計画ではなく、リリース済み製品の内容を説明します。

- User guides / ユーザーガイド: [`docs/user-guide.ja.md`](docs/user-guide.ja.md) / [`docs/user-guide.en.md`](docs/user-guide.en.md)
- Developer guides / 開発者ガイド: [`docs/developer-guide.ja.md`](docs/developer-guide.ja.md) / [`docs/developer-guide.en.md`](docs/developer-guide.en.md)
- Privacy policies / プライバシーポリシー: [`docs/privacy-policy.ja.md`](docs/privacy-policy.ja.md) / [`docs/privacy-policy.en.md`](docs/privacy-policy.en.md)
- Store listing text / ストア掲載文: [`docs/store-listing.ja.md`](docs/store-listing.ja.md) / [`docs/store-listing.en.md`](docs/store-listing.en.md)
- Release/update checklist / リリース・更新チェックリスト: [`docs/release-checklist.md`](docs/release-checklist.md)
- Support / サポート: [`docs/support.md`](docs/support.md)
- Contribution guide / コントリビューションガイド: [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Features / 機能

| English | 日本語 |
| --- | --- |
| Context menu lookup from selected drug-name text. | 選択した薬剤名テキストから右クリックメニューで検索できます。 |
| Manual search from the extension popup. | 拡張機能ポップアップから薬剤名を直接検索できます。 |
| Side Panel result display for longer review sessions. | 長めの確認作業向けに Chrome Side Panel で検索結果を表示できます。 |
| Candidate list with package insert PDF links. | 候補一覧と添付文書PDFリンクを表示します。 |
| Structured drug information panels when the API response includes fields such as indications, dosage, warnings, contraindications, precautions, interactions, or side effects. | APIレスポンスに効能・効果、用法・用量、警告、禁忌、使用上の注意、相互作用、副作用などが含まれる場合、構造化して表示します。 |
| Side Panel bookmarks, display-mode preference, and font-size preference. | Side Panel のブックマーク、表示モード、文字サイズ設定に対応します。 |
| Search-result caching and local candidate index in the user's browser. | 検索結果キャッシュと候補表示用ローカル索引をユーザーのブラウザ内に保存します。 |
| Local logging and privacy-first storage design. | ローカルログとプライバシー重視の保存設計を採用しています。 |

## Privacy note / プライバシーに関する注意

**English:** PMDA Quick Looker does not collect patient information, page content, browsing history, analytics identifiers, or search histories on an external tracking service. Selected text is processed only after an explicit user action. The selected or entered drug name may be sent to `drugwiki.meta-alchemist.co.jp` and `www.pmda.go.jp` to provide lookup results, and standard API server logs may include IP address, user agent, request URL, access time, HTTP status, and search keyword for security and troubleshooting. Local cache/bookmark data stays in the user's browser. See the bilingual privacy policies in `docs/` for the Chrome Web Store submission text.

**日本語:** PMDA Quick Looker は、患者情報、ページ内容、閲覧履歴、解析識別子、外部トラッキングサービス上の検索履歴を収集しません。選択テキストはユーザーが明示的に検索操作を行った場合のみ処理されます。選択または入力された薬剤名は検索結果取得のため `drugwiki.meta-alchemist.co.jp` と `www.pmda.go.jp` へ送信されることがあり、標準的な API サーバーログにはセキュリティ・不具合調査目的で IP アドレス、User-Agent、リクエストURL、アクセス時刻、HTTPステータス、検索キーワードが含まれる場合があります。ローカルキャッシュやブックマークはユーザーのブラウザ内に保存されます。Chrome ウェブストア提出用の文面は `docs/` 配下のバイリンガル版プライバシーポリシーを参照してください。

## Requirements / 必要環境

- Node.js 22 or later / Node.js 22 以降
- npm 10 or later / npm 10 以降
- Google Chrome 116 or later, or a compatible Chromium-based browser / Google Chrome 116 以降、または互換 Chromium 系ブラウザ

## Setup / セットアップ

```bash
npm install
npm run lint
npm test
npm run test:e2e
npm run build
```

**English:** The build output is generated under `dist/`.

**日本語:** ビルド成果物は `dist/` 配下に生成されます。

## Local development / ローカル開発

```bash
npm run dev
```

**English:** For Chrome extension testing, use the production build.

**日本語:** Chrome 拡張機能として実機確認する場合は、本番ビルドを使用してください。

```bash
npm run build
```

**English:** Then open Chrome and load the generated `dist/` directory as an unpacked extension.

**日本語:** その後、Chrome で生成された `dist/` ディレクトリを未パッケージ拡張機能として読み込みます。

## Load in Chrome / Chrome での読み込み

| Step | English | 日本語 |
| --- | --- | --- |
| 1 | Open `chrome://extensions/`. | `chrome://extensions/` を開きます。 |
| 2 | Enable **Developer mode**. | **デベロッパーモード** を有効にします。 |
| 3 | Click **Load unpacked**. | **パッケージ化されていない拡張機能を読み込む** をクリックします。 |
| 4 | Select the generated `dist/` directory. | 生成された `dist/` ディレクトリを選択します。 |
| 5 | Select drug-name text on a web page and run **PMDAで添付文書を調べる** from the context menu. | Webページ上で薬剤名テキストを選択し、右クリックメニューから **PMDAで添付文書を調べる** を実行します。 |
| 6 | Open the popup or Side Panel to see search results and package insert PDF links. | ポップアップまたは Side Panel で検索結果と添付文書PDFリンクを確認します。 |

## Testing / テスト

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

| English | 日本語 |
| --- | --- |
| Unit tests cover PMDA API/cache behavior with mocks. | 単体テストでは、モックを使ってPMDA API/キャッシュ挙動を確認します。 |
| E2E tests cover the built extension UI with mocked Chrome extension APIs and mocked PMDA responses. | E2Eテストでは、モックした Chrome 拡張APIとPMDAレスポンスでビルド済み拡張UIを確認します。 |
| Manual integration checks are documented in [`docs/integration-test-checklist.md`](docs/integration-test-checklist.md). | 手動結合確認は [`docs/integration-test-checklist.md`](docs/integration-test-checklist.md) に記載しています。 |
| Release validation is documented in [`docs/release-checklist.md`](docs/release-checklist.md). | リリース検証は [`docs/release-checklist.md`](docs/release-checklist.md) に記載しています。 |

## Support / サポート

**English:** If you find this project useful, you can support its maintenance through the GitHub Sponsors button configured by `.github/FUNDING.yml`. Support is voluntary and does not affect issue triage, security handling, or project licensing.

**日本語:** このプロジェクトが役に立つ場合、`.github/FUNDING.yml` で設定された GitHub Sponsors ボタンからメンテナンスを支援できます。支援は任意であり、Issue対応、セキュリティ対応、ライセンス条件には影響しません。

## Project structure / プロジェクト構成

```text
src/
├── background/
├── popup/
├── shared/
├── sidepanel/
├── manifest.json
└── vite-env.d.ts
tests/
├── e2e/
└── unit/
docs/
├── assets/
├── developer-guide.en.md
├── developer-guide.ja.md
├── privacy-policy.en.md
├── privacy-policy.ja.md
├── release-checklist.md
├── store-listing.en.md
├── store-listing.ja.md
├── support.md
├── user-guide.en.md
└── user-guide.ja.md
```

## Disclaimer / 免責事項

**English:** This extension is a document lookup aid. It is not a medical device, diagnosis system, prescription decision system, or substitute for professional clinical judgment. Users must verify package insert content and clinical decisions using official PMDA information and their institution's approved workflow.

**日本語:** この拡張機能は文書参照を補助するツールです。医療機器、診断システム、処方判断システム、または専門的な臨床判断の代替ではありません。添付文書の内容や臨床判断は、PMDA公式情報および所属機関で承認された業務手順に基づいて確認してください。
