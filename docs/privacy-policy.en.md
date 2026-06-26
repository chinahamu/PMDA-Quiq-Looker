# PMDA Quick Looker Privacy Policy / プライバシーポリシー

Last updated / 最終更新日: 2026-06-26

## English

PMDA Quick Looker (the "Extension") is a Chrome extension that helps users search and open package insert PDF links and related drug information. This policy explains what information the Extension handles, where it is stored, and whether it is transmitted externally.

### 1. Information we do not collect

The Extension does not collect the following information:

- Patient names, chart IDs, insurance IDs, or other patient identifiers.
- Full page contents, form inputs, or complete electronic medical record screens.
- Browser history.
- Advertising IDs, analytics IDs, tracking cookies, or similar identifiers.
- Location data, contacts, or arbitrary local files.
- Google Analytics or similar tracking data.

Users should not select or enter patient names, chart IDs, or other patient-identifying information as search keywords.

### 2. Information used by the Extension

The Extension processes the following information only when the user explicitly starts a lookup action.

| Information | Purpose | Storage location |
| --- | --- | --- |
| Drug-name text selected by the user | Search for package insert candidates | Temporary processing and local search state when needed |
| Search keyword | Retrieve candidates and restore display state | Chrome extension local/session storage and lookup request transmission |
| Drug search results | Display candidates and cache lookup data | IndexedDB or local storage |
| Package insert PDF URL | Open package insert information | IndexedDB or local storage |
| Drug information returned by the API | Display drug information in the Side Panel | IndexedDB or local storage |
| Bookmarked drug records | Reopen frequently reviewed drug records | Chrome extension local storage |
| Display settings | Display mode and font-size preferences | Chrome extension local storage |
| Error information | Local troubleshooting logs | Browser only |

### 3. External transmission

The Extension sends drug-name search requests only as needed to provide lookup functionality. Requests may be sent to:

- `https://drugwiki.meta-alchemist.co.jp/*`
- `https://www.pmda.go.jp/*`

The selected or entered drug-name text is transmitted as a search keyword to retrieve candidate records, package insert PDF links, and related drug information. The Extension does not transmit full page contents, browsing history, advertising identifiers, analytics events, or intentionally collected patient information to external servers.

### 4. API server logs

The drug search API at `drugwiki.meta-alchemist.co.jp` may keep standard server logs for security monitoring, abuse prevention, and troubleshooting. These logs may include IP address, user agent, access time, request URL, HTTP status, and the search keyword included in the lookup request. These logs are used only for operating and protecting the service and are not sold to advertisers or data brokers.

Log retention is kept to the minimum period reasonably necessary for security and troubleshooting. Deletion or privacy questions can be sent through GitHub Issues when they do not contain sensitive information, or through the maintainer's public contact channel when private details are required.

### 5. Local storage

The Extension may store search results, drug index records, bookmarks, display settings, and cache metadata in the user's browser. Storage mechanisms include IndexedDB, `chrome.storage.local`, and `chrome.storage.session`.

Users can remove stored data by deleting the extension data or the relevant browser site/extension data.

### 6. Permission purposes

| Permission | Purpose |
| --- | --- |
| `contextMenus` | Provide a right-click search action for selected text. |
| `storage` | Store search state, search-result cache data, bookmarks, and display settings. |
| `sidePanel` | Display search results in the Chrome Side Panel. |
| `https://drugwiki.meta-alchemist.co.jp/*` | Connect to the drug search API. |
| `https://www.pmda.go.jp/*` | Access official PMDA information and PDFs. |

### 7. Sharing and sale of data

The Extension does not sell or share user data with advertisers, data brokers, or analytics services.

### 8. Security

- The Extension uses the Manifest V3 Service Worker model.
- Content Security Policy restricts external script execution.
- Permissions are kept to the minimum needed for the stated functionality.
- The design assumes that patient information must not be stored or transmitted.

### 9. Medical information disclaimer

The Extension is not a medical device, diagnosis support system, or prescription decision system. Displayed package insert information is for reference support only.

### 10. Contact

For bug reports, privacy questions, or data deletion questions, please contact the project through GitHub Issues or the repository maintainer's public contact channel. Do not include patient information, private medical records, credentials, or other sensitive details in public Issues.

### 11. Changes

This policy may be updated when functionality, permissions, or publication requirements change. Material changes will be announced in release notes or in the repository.

---

## 日本語

PMDA Quick Looker（以下「本拡張機能」）は、添付文書PDFリンクと関連する薬剤情報の検索・参照を補助するChrome拡張機能です。このポリシーでは、本拡張機能が扱う情報、保存場所、外部送信の有無を説明します。

### 1. 収集しない情報

本拡張機能は、以下の情報を収集しません。

- 患者氏名、カルテ番号、診察券番号、保険者番号などの患者識別情報
- 閲覧ページの全文、フォーム入力内容、電子カルテの画面全体
- ブラウザの閲覧履歴
- 個人を追跡する広告ID、解析ID、Cookie
- 位置情報、連絡先、ファイルシステム上の任意ファイル
- Google Analytics などのトラッキングデータ

検索キーワードとして、患者氏名、カルテ番号、その他の患者識別情報を選択・入力しないでください。

### 2. 利用する情報

本拡張機能は、ユーザーが明示的に検索操作を行った場合に限り、以下の情報を処理します。

| 情報 | 利用目的 | 保存場所 |
| --- | --- | --- |
| ユーザーが選択した薬剤名テキスト | 添付文書候補の検索 | 一時的な検索処理、必要に応じたローカル検索状態 |
| 検索キーワード | 候補一覧の取得、表示状態の復元 | Chrome拡張機能のローカル/セッションストレージ、検索リクエスト送信 |
| 薬剤検索結果 | 候補一覧表示、キャッシュ | IndexedDBまたはローカルストレージ |
| 添付文書PDF URL | 添付文書PDFリンクの表示 | IndexedDBまたはローカルストレージ |
| APIレスポンス内の薬剤情報 | Side Panelでの薬剤情報表示 | IndexedDBまたはローカルストレージ |
| ブックマークした薬剤情報 | よく見る薬剤の再表示 | Chrome拡張機能のローカルストレージ |
| 表示設定 | 表示モード、文字サイズ等の保持 | Chrome拡張機能のローカルストレージ |
| エラー情報 | 不具合調査のためのローカルログ | ブラウザ内のみ |

### 3. 外部送信

本拡張機能は、検索機能の提供に必要な範囲で、薬剤名検索リクエストを以下のドメインへ送信します。

- `https://drugwiki.meta-alchemist.co.jp/*`
- `https://www.pmda.go.jp/*`

選択または入力された薬剤名テキストは、候補一覧、添付文書PDFリンク、関連する薬剤情報を取得するための検索キーワードとして送信されます。本拡張機能は、ページ全文、閲覧履歴、広告識別子、解析イベント、または意図的に収集した患者情報を外部サーバーに送信しません。

### 4. APIサーバーログ

`drugwiki.meta-alchemist.co.jp` の薬剤検索APIでは、セキュリティ監視、不正利用防止、不具合調査のために標準的なサーバーログを保存することがあります。これらのログには、IPアドレス、User-Agent、アクセス時刻、リクエストURL、HTTPステータス、検索リクエストに含まれる検索キーワードが含まれる場合があります。これらのログはサービスの運用と保護のためにのみ利用し、広告会社やデータブローカーへ販売しません。

ログの保持期間は、セキュリティと不具合調査に合理的に必要な最小限の期間とします。削除方法やプライバシーに関する質問は、機微情報を含まない場合は GitHub Issues、非公開の詳細が必要な場合はメンテナの公開連絡先へ連絡してください。

### 5. ローカル保存

本拡張機能は、検索結果、品目インデックス、ブックマーク、表示設定、キャッシュメタデータをユーザーのブラウザ内に保存することがあります。保存先は Chrome 拡張機能の IndexedDB、`chrome.storage.local`、`chrome.storage.session` です。

保存データは、ユーザーがブラウザの拡張機能データまたはサイトデータを削除することで削除できます。

### 6. 権限の利用目的

| 権限 | 目的 |
| --- | --- |
| `contextMenus` | 選択テキストから検索する右クリックメニューを提供するため |
| `storage` | 検索状態、検索結果キャッシュ、ブックマーク、表示設定を保存するため |
| `sidePanel` | Chrome Side Panelで検索結果を表示するため |
| `https://drugwiki.meta-alchemist.co.jp/*` | 薬剤検索APIへ接続するため |
| `https://www.pmda.go.jp/*` | PMDA公式情報とPDFを参照するため |

### 7. 第三者提供

本拡張機能は、ユーザーデータを広告会社、データブローカー、解析サービスへ販売・提供しません。

### 8. セキュリティ

- 本拡張機能は Manifest V3 Service Worker モデルを使用します。
- Content Security Policy により外部スクリプト実行を制限します。
- 権限は機能に必要な最小限にします。
- 患者情報を保存・送信しない設計を前提とします。

### 9. 医療情報に関する免責

本拡張機能は、医療機器、診断支援システム、処方判断システムではありません。表示される添付文書情報は参照支援のためのものです。

### 10. お問い合わせ

不具合報告、プライバシーに関する問い合わせ、削除方法に関する質問は GitHub Issues またはリポジトリ管理者の公開連絡先へ連絡してください。公開Issueには、患者情報、非公開の医療記録、認証情報、その他の機微情報を含めないでください。

### 11. 変更

機能、権限、公開要件が変更された場合、このポリシーを更新することがあります。重要な変更はリリースノートまたはリポジトリで案内します。
