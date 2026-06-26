# Changelog / 変更履歴

**English:** All notable changes to PMDA Quick Looker are documented in this file.

**日本語:** PMDA Quick Looker の主な変更はこのファイルに記録します。

## [0.1.0] - 2026-06-26

### Added / 追加

- Manifest V3 Chrome extension scaffold with Vite, TypeScript, and React. / Vite、TypeScript、React による Manifest V3 Chrome 拡張の雛形を追加。
- Search/detail API client with debounce, timeout, and normalized response handling. / デバウンス、タイムアウト、レスポンス正規化に対応した検索/詳細 API クライアントを追加。
- Service Worker pipeline for context menu searches and popup-initiated searches. / 右クリック検索とポップアップ検索のための Service Worker パイプラインを追加。
- Popup UI with manual search, candidate list, PDF preview, and state panels. / 手動検索、候補一覧、PDF プレビュー、状態表示パネルを含む Popup UI を追加。
- Side Panel result display, bookmarks, display settings, and local search cache. / Side Panel 表示、ブックマーク、表示設定、ローカル検索キャッシュを追加。
- Bilingual Japanese/English wording across README and docs. / README と docs に日本語・英語の併記を追加。
- Bilingual support guidance linked from README and the documentation index. / README とドキュメント索引からリンクする日英併記の支援案内を追加。
- Japanese and English user guides. / 日本語・英語のユーザーガイドを追加。
- Japanese and English developer guides. / 日本語・英語の開発者ガイドを追加。
- Japanese and English privacy policies. / 日本語・英語プライバシーポリシーを追加。
- Chrome Web Store listing text in Japanese and English. / Chrome ウェブストア掲載文を日本語・英語で追加。
- Release/update checklist. / リリース/更新チェックリストを追加。
- Vitest unit tests. / Vitest 単体テストを追加。
- Playwright E2E tests. / Playwright E2E テストを追加。
- Integration test checklist. / 結合テストチェックリストを追加。

### Changed / 変更

- Documentation now describes the released feature set. / ドキュメントをリリース済み機能として整理。
- README and docs no longer depend on implementation planning documents. / README と docs は実装計画ドキュメントに依存しない構成に変更。
- Manifest now avoids broad content-script injection and declares Chrome 116+ for Side Panel support. / Manifest は広範な Content Script 注入を避け、Side Panel 対応のため Chrome 116 以上を明示。
- Privacy documentation now explains API server logging and search-keyword transmission. / プライバシー文書に API サーバーログと検索キーワード送信の説明を追加。

### Removed / 削除

- Unused content script entry and source file. / 未使用の Content Script エントリとソースファイルを削除。
- Implementation planning documents were removed from the documentation set. / 実装計画ドキュメントをドキュメント一式から削除。
- Scratch API test script was removed from the public-ready repository. / 公開準備のため scratch の API テストスクリプトを削除。
