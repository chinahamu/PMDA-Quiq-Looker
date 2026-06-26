# PMDA Quick Looker 開発者ガイド / Developer Guide

## 日本語

このガイドは、リリース済みの PMDA Quick Looker 拡張機能を開発、検証、保守、更新するための手順です。

### 1. 技術スタック

- Chrome Extension Manifest V3
- TypeScript
- React
- Vite
- IndexedDB (`idb`)
- Vitest
- Playwright

### 2. セットアップ

```bash
npm install
npm run lint
npm test
npm run test:e2e
npm run build
```

Node.js 22 以降、npm 10 以降、Google Chrome 116 以降を前提とします。

### 3. ディレクトリ構成

```text
src/
├── background/    # Service Worker、APIクライアント、検索キャッシュ
├── popup/         # ポップアップUI
├── shared/        # 共通型、定数、検索正規化
├── sidepanel/     # Side Panel UI
└── manifest.json
tests/
├── e2e/
└── unit/
docs/
└── リリース済み製品ドキュメントとストア資料
```

### 4. 開発サーバー

```bash
npm run dev
```

Chrome拡張として実機確認する場合は、開発サーバーではなく本番ビルドを使います。

```bash
npm run build
```

その後、Chrome の `chrome://extensions/` から `dist/` を読み込みます。

### 5. ビルドと検証

更新公開前に以下を実行してください。

```bash
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

### 6. API・キャッシュ設計

- 薬剤検索は `https://drugwiki.meta-alchemist.co.jp` の検索APIを利用します。
- `src/background/pmda-client.ts` は `/api/iyakuSearch/` と `/api/iyakuDetail/` を呼び出し、候補一覧、PDF URL、取得できる薬剤情報を正規化します。
- 選択または入力された薬剤名は、検索キーワードとして API に送信されます。
- `drugwiki.meta-alchemist.co.jp` 側の標準的なサーバーログには、セキュリティ監視・不具合調査目的で IP アドレス、User-Agent、アクセス時刻、リクエストURL、HTTPステータス、検索キーワードが含まれる場合があります。
- 検索結果、候補表示用の品目インデックス、検索履歴は IndexedDB に保存します。
- ブックマーク、表示モード、文字サイズは `chrome.storage.local` に保存します。
- 直近の検索状態は `chrome.storage.session` に保存します。

### 7. Chrome Web Store 更新手順

1. `main` を最新化します。
2. バージョン番号を `package.json`、`package-lock.json`、`src/manifest.json`、`CHANGELOG.md` で整合させます。
3. `src/manifest.json` に不要な `content_scripts` や `<all_urls>` がないことを確認します。
4. `npm run lint && npm run format:check && npm test && npm run test:e2e && npm run build` を実行します。
5. `dist/` の内容を確認します。
6. リリースタグ `vX.Y.Z` を作成して GitHub Release のzip生成を確認します。
7. `docs/store-listing.ja.md` と `docs/store-listing.en.md` の掲載文を確認します。
8. 公開中のプライバシーポリシーURLが `docs/privacy-policy.ja.md` と `docs/privacy-policy.en.md` に一致していることを確認します。
9. Chrome Web Store Developer Dashboard にzip、説明文、スクリーンショット、アイコン、プライバシーポリシーURLを登録します。
10. 更新提出前に `docs/release-checklist.md` を完了させます。

### 8. Pull Request の基準

- 変更理由と影響範囲が説明されていること。
- UI変更はスクリーンショットまたは簡単な確認手順があること。
- 新しいロジックには単体テストまたは手動確認手順があること。
- `npm run lint` と `npm run build` が通ること。

---

## English

This guide describes how to develop, test, maintain, and ship updates for the released PMDA Quick Looker extension.

### 1. Stack

- Chrome Extension Manifest V3
- TypeScript
- React
- Vite
- IndexedDB (`idb`)
- Vitest
- Playwright

### 2. Setup

```bash
npm install
npm run lint
npm test
npm run test:e2e
npm run build
```

Node.js 22 or later, npm 10 or later, and Google Chrome 116 or later are expected.

### 3. Directory structure

```text
src/
├── background/    # Service Worker, API client, search cache
├── popup/         # Popup UI
├── shared/        # Shared types, constants, search normalization
├── sidepanel/     # Side Panel UI
└── manifest.json
tests/
├── e2e/
└── unit/
docs/
└── released product documentation and store materials
```

### 4. Development server

```bash
npm run dev
```

For Chrome extension testing, use the production build instead of the Vite development server.

```bash
npm run build
```

Then load `dist/` from `chrome://extensions/`.

### 5. Build and verification

Run the following before publishing an update:

```bash
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

### 6. API and cache design

- Drug lookup uses the search API at `https://drugwiki.meta-alchemist.co.jp`.
- `src/background/pmda-client.ts` calls `/api/iyakuSearch/` and `/api/iyakuDetail/`, then normalizes candidates, PDF URLs, and any drug information returned by the API.
- The selected or entered drug name is transmitted as a search keyword to the API.
- Standard server logs on `drugwiki.meta-alchemist.co.jp` may include IP address, user agent, access time, request URL, HTTP status, and search keyword for security monitoring and troubleshooting.
- Search results, the local candidate index, and search history are stored in IndexedDB.
- Bookmarks, display mode, and font-size preferences are stored in `chrome.storage.local`.
- The latest search state is stored in `chrome.storage.session`.

### 7. Chrome Web Store update flow

1. Sync from the latest `main` branch.
2. Keep `package.json`, `package-lock.json`, `src/manifest.json`, and `CHANGELOG.md` versions aligned.
3. Confirm that `src/manifest.json` does not include unnecessary `content_scripts` or `<all_urls>` access.
4. Run `npm run lint && npm run format:check && npm test && npm run test:e2e && npm run build`.
5. Inspect the generated `dist/` directory.
6. Create a `vX.Y.Z` tag and confirm that GitHub Release packaging works.
7. Review `docs/store-listing.ja.md` and `docs/store-listing.en.md`.
8. Confirm the public privacy policy URL matches `docs/privacy-policy.ja.md` and `docs/privacy-policy.en.md`.
9. Upload the package, description, screenshots, icon, and privacy policy URL to the Chrome Web Store Developer Dashboard.
10. Complete `docs/release-checklist.md` before submitting the update.

### 8. Pull Request expectations

- Explain why the change is needed and what it affects.
- Include screenshots or manual verification steps for UI changes.
- Add unit tests or manual verification steps for new logic.
- Ensure `npm run lint` and `npm run build` pass.
