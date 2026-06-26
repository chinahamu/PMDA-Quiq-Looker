# PMDA Quick Looker User Guide / ユーザーガイド

## English

PMDA Quick Looker is a Chrome extension for quickly searching package insert PDF links and related drug information from selected drug names.

### Basic search

1. Select a drug name on a web page.
2. Right-click and choose **PMDAで添付文書を調べる**.
3. The popup or Side Panel displays candidate package inserts, depending on the configured display mode.
4. Open the PDF link or review the drug information from the selected candidate.

### Popup search

1. Click the PMDA Quick Looker icon in the Chrome toolbar.
2. Enter a drug name in the search field.
3. Select the desired candidate from the result list.
4. Open the PDF link.

### Side Panel

The Side Panel shows candidates, package insert PDF links, and drug information returned by the API next to the current tab.

When available, the Side Panel can display:

- Brand name, company name, drug price code, and item code.
- Package insert PDF URL.
- Indications, dosage, warnings, contraindications, precautions, interactions, and side effects.

The Side Panel also supports bookmarks, the preferred display mode for right-click searches (Side Panel or popup), and font-size settings.

### Storage

Search result cache data, the local candidate index, bookmarks, and display settings stay in the user's browser.

### Permissions

| Permission | Purpose |
| --- | --- |
| `contextMenus` | Add a right-click lookup action for selected drug names. |
| `storage` | Store search state, search-result cache data, bookmarks, and display settings. |
| `sidePanel` | Display search results in the Chrome Side Panel. |
| `https://drugwiki.meta-alchemist.co.jp/*` | Connect to the drug search API. |
| `https://www.pmda.go.jp/*` | Access PMDA package insert pages and PDFs. |

### Privacy

- The extension does not collect patient names, chart IDs, full page contents, or browsing history.
- The extension does not use Google Analytics or other tracking SDKs.
- Search-result cache data and bookmarks stay in the user's browser.
- Selected text is used for lookup only after the user explicitly starts a search action.

### Support

Please use GitHub Issues for bug reports and feature requests. See [`support.md`](support.md) for voluntary project support.

---

## 日本語

PMDA Quick Looker は、Web画面上で選択した薬剤名から、添付文書PDFリンクと関連する薬剤情報を素早く検索・参照するための Chrome 拡張機能です。

### 基本的な使い方

1. Webページ上で薬剤名を選択します。
2. 右クリックして **PMDAで添付文書を調べる** を選択します。
3. 設定された表示モードに応じて、Side Panel またはポップアップに候補一覧が表示されます。
4. 候補から添付文書PDFリンクや薬剤情報を確認します。

### ポップアップ検索

1. Chromeツールバーの PMDA Quick Looker アイコンをクリックします。
2. 検索欄に薬剤名を入力します。
3. 候補一覧から目的の品目を選択します。
4. PDFリンクから添付文書を確認します。

### Side Panel

Side Panel では、候補一覧、添付文書PDFリンク、APIレスポンスに含まれる薬剤情報を画面横で確認できます。

表示対象になる情報は、取得できた範囲で以下の項目です。

- 販売名、製造販売業者、薬価基準収載医薬品コード、YJコード
- 添付文書PDF URL
- 効能・効果、用法・用量、警告、禁忌、使用上の注意、相互作用、副作用

Side Panel では、よく見る薬剤のブックマーク、右クリック時の表示先（Side Panel / ポップアップ）、文字サイズも変更できます。

### ストレージ

検索結果キャッシュ、候補表示用のローカル索引、ブックマーク、表示設定は、ユーザーのブラウザ内に保存されます。

### 権限

| 権限 | 用途 |
| --- | --- |
| `contextMenus` | 選択した薬剤名を右クリックメニューから検索するため |
| `storage` | 検索状態、検索結果キャッシュ、ブックマーク、表示設定を保存するため |
| `sidePanel` | Chrome Side Panel に検索結果を表示するため |
| `https://drugwiki.meta-alchemist.co.jp/*` | 薬剤検索APIへの接続 |
| `https://www.pmda.go.jp/*` | PMDA添付文書ページ・PDFの参照 |

### プライバシー

- 患者氏名、カルテ番号、ページ全文、閲覧履歴を収集しません。
- Google Analytics などのトラッキングを使いません。
- 検索結果キャッシュとブックマークはユーザーのブラウザ内に保存されます。
- 選択テキストは、ユーザーが明示的に検索操作を行った場合のみ検索処理に使われます。

### サポート

不具合報告や改善要望は GitHub Issues へ登録してください。プロジェクト支援については [`support.md`](support.md) を参照してください。
