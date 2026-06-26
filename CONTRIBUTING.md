# Contributing to PMDA Quick Looker / コントリビューションガイド

Thank you for your interest in PMDA Quick Looker. This project is a Chrome extension for looking up PMDA package insert PDFs from selected drug names.

PMDA Quick Looker に関心を持っていただきありがとうございます。このプロジェクトは、選択した薬剤名から PMDA 添付文書PDFを参照するための Chrome 拡張機能です。

---

## English

### Scope

Contributions are welcome when they improve:

- PMDA search and package insert lookup reliability.
- IndexedDB cache performance and safety.
- Chrome extension UX, accessibility, and release readiness.
- Tests, documentation, and security hardening.

Out of scope:

- Automated diagnosis, prescription, interaction judgment, or treatment recommendations.
- Features that require collecting patient identifiers or full page contents.
- Tracking, advertising, or analytics behavior that is unrelated to extension functionality.

### Development setup

```bash
npm install
npm run lint
npm test
npm run test:e2e
npm run build
```

Use Node.js 22 or later and npm 10 or later.

### Branch and commit style

- Create a feature branch from the latest `main`.
- Use a concise branch name such as `feature/search-cache` or `fix/pdf-link-display`.
- Keep commits focused and reviewable.
- Explain user impact in the Pull Request description.

### Pull Request checklist

Before opening a Pull Request, confirm:

- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes or formatting was applied.
- [ ] `npm test` passes.
- [ ] `npm run test:e2e` passes when UI behavior changed.
- [ ] `npm run build` passes.
- [ ] New behavior is documented when user-facing.
- [ ] New permissions are justified and documented.
- [ ] No patient information, full page contents, or unnecessary identifiers are collected or transmitted.

### Security and privacy requirements

- Do not introduce dynamic external script loading.
- Do not use `eval()`.
- Avoid `innerHTML`; when unavoidable, sanitize and document the reason.
- Keep Manifest permissions minimal.
- Do not collect or transmit patient-identifying information.
- Do not add analytics or tracking without explicit review and privacy policy updates.

---

## 日本語

### 対象範囲

以下の改善を歓迎します。

- PMDA検索・添付文書参照の信頼性向上
- IndexedDBキャッシュの性能・安全性向上
- Chrome拡張のUX、アクセシビリティ、公開準備
- テスト、ドキュメント、セキュリティ強化

対象外:

- 診断、処方、相互作用判定、治療推奨の自動化
- 患者識別情報やページ全文の収集を必要とする機能
- 拡張機能の目的と無関係なトラッキング、広告、解析

### 開発セットアップ

```bash
npm install
npm run lint
npm test
npm run test:e2e
npm run build
```

Node.js 22 以降、npm 10 以降を使用してください。

### ブランチとコミット

- 最新の `main` から feature ブランチを作成します。
- `feature/search-cache` や `fix/pdf-link-display` のような簡潔なブランチ名にします。
- コミットはレビューしやすい単位に分けます。
- Pull Request にはユーザー影響と確認方法を書いてください。

### Pull Request チェックリスト

Pull Request 作成前に確認してください。

- [ ] `npm run lint` が通る。
- [ ] `npm run format:check` が通る、または整形済み。
- [ ] `npm test` が通る。
- [ ] UI変更時は `npm run test:e2e` が通る。
- [ ] `npm run build` が通る。
- [ ] ユーザー向け変更はドキュメントに反映済み。
- [ ] 新しい権限の理由が説明されている。
- [ ] 患者情報、ページ全文、不要な識別子を収集・送信していない。

### セキュリティとプライバシー要件

- 外部スクリプトの動的読み込みを追加しないでください。
- `eval()` を使用しないでください。
- `innerHTML` は避け、必要な場合はサニタイズと理由を明記してください。
- Manifest権限は必要最小限にしてください。
- 患者識別情報を収集・送信しないでください。
- 解析やトラッキングを追加する場合は、明示的なレビューとプライバシーポリシー更新が必要です。
