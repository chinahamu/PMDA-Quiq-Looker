# PMDA Quick Looker Release and Update Checklist / リリース・更新チェックリスト

**English:** Use this checklist for release maintenance and Chrome Web Store updates of the released PMDA Quick Looker extension.

**日本語:** リリース済みの PMDA Quick Looker 拡張機能について、リリース保守と Chrome ウェブストア更新時にこのチェックリストを使用してください。

## Repository readiness / リポジトリ準備

- [ ] Branch is based on the latest `main`. / ブランチが最新の `main` をベースにしている。
- [ ] `package.json`, `package-lock.json`, `src/manifest.json`, and `CHANGELOG.md` versions are aligned. / `package.json`、`package-lock.json`、`src/manifest.json`、`CHANGELOG.md` のバージョンが整合している。
- [ ] `CHANGELOG.md` contains the release date and notable changes. / `CHANGELOG.md` にリリース日と主な変更点が記載されている。
- [ ] User guides are up to date in Japanese and English. / ユーザーガイドが日本語・英語で最新化されている。
- [ ] Developer guides are up to date in Japanese and English. / 開発者ガイドが日本語・英語で最新化されている。
- [ ] `CONTRIBUTING.md` is present and accurate. / `CONTRIBUTING.md` が存在し、内容が正確である。
- [ ] Privacy policies are present in Japanese and English and explain API request transmission and server logs. / プライバシーポリシーが日本語・英語で存在し、APIリクエスト送信とサーバーログを説明している。
- [ ] Store listing text is present in Japanese and English and matches the privacy disclosures. / ストア掲載文が日本語・英語で存在し、プライバシー開示と一致している。
- [ ] Support guidance is linked from `README.md` and `docs/index.md`. / サポート案内が `README.md` と `docs/index.md` からリンクされている。
- [ ] No implementation planning documents, scratch scripts, local cache files, or manual test artifacts are included in the public-ready tree. / 公開準備済みツリーに実装計画文書、scratchスクリプト、ローカルキャッシュ、手動テスト成果物が含まれていない。

## Manifest and permission review / Manifest・権限確認

- [ ] `src/manifest.json` uses Manifest V3. / `src/manifest.json` が Manifest V3 を使用している。
- [ ] `minimum_chrome_version` is set for Side Panel support. / Side Panel 対応のため `minimum_chrome_version` が設定されている。
- [ ] `content_scripts` is absent unless a user-visible feature requires it. / ユーザー向け機能上必要な場合を除き、`content_scripts` が存在しない。
- [ ] `<all_urls>` is not requested. / `<all_urls>` を要求していない。
- [ ] `host_permissions` are limited to `drugwiki.meta-alchemist.co.jp` and `www.pmda.go.jp`. / `host_permissions` が `drugwiki.meta-alchemist.co.jp` と `www.pmda.go.jp` に限定されている。
- [ ] CSP does not allow external scripts or `eval`. / CSP が外部スクリプトや `eval` を許可していない。

## Automated verification / 自動検証

```bash
npm install
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

Expected results / 期待結果:

- [ ] Lint passes. / lint が成功する。
- [ ] Format check passes. / format check が成功する。
- [ ] Unit tests pass. / 単体テストが成功する。
- [ ] E2E tests pass. / E2E テストが成功する。
- [ ] Build succeeds and outputs `dist/`. / build が成功し、`dist/` が出力される。

## Manual Chrome extension verification / Chrome 拡張の手動確認

- [ ] Load `dist/` from `chrome://extensions/`. / `chrome://extensions/` から `dist/` を読み込む。
- [ ] Context menu search works from selected drug-name text. / 選択した薬剤名テキストから右クリック検索が動作する。
- [ ] Popup manual search works. / ポップアップの手動検索が動作する。
- [ ] Candidate list is displayed. / 候補一覧が表示される。
- [ ] PDF link or PDF-unavailable fallback state is displayed. / PDFリンクまたはPDF未取得時の代替状態が表示される。
- [ ] Side Panel opens and displays search state where supported. / 対応環境で Side Panel が開き、検索状態が表示される。
- [ ] Side Panel can show available drug information fields from the API response. / Side Panel で API レスポンス内の薬剤情報項目が表示される。
- [ ] Side Panel bookmark add/remove works. / Side Panel のブックマーク追加・削除が動作する。
- [ ] Display mode and font-size settings persist. / 表示モードと文字サイズ設定が保持される。
- [ ] Search cache status or network/cache fallback state is displayed. / 検索キャッシュ状態またはネットワーク/キャッシュ代替状態が表示される。
- [ ] Use only public sample drug names during testing. / テストでは公開サンプル薬剤名のみを使用する。

## Store update materials / ストア更新資料

- [ ] Extension package zip is generated from the intended commit. / 拡張機能パッケージzipが意図したコミットから生成されている。
- [ ] Listing text was copied from `docs/store-listing.*.md`. / 掲載文は `docs/store-listing.*.md` からコピーしている。
- [ ] Screenshots match the current UI. / スクリーンショットが現在のUIと一致している。
- [ ] Privacy policy URL is public and matches `docs/privacy-policy.*.md`. / プライバシーポリシーURLが公開され、`docs/privacy-policy.*.md` と一致している。
- [ ] Chrome Web Store privacy dashboard answers match the manifest, code, and privacy policy. / Chrome Web Store のプライバシーダッシュボード回答が manifest、コード、プライバシーポリシーと一致している。
- [ ] README links and support guidance match the current release. / README のリンクとサポート案内が現在のリリース内容と一致している。
