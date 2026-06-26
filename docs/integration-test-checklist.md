# Extension Integration Test Checklist / 拡張機能結合テストチェックリスト

**English:** This checklist covers representative smoke checks for the released PMDA Quick Looker extension.

**日本語:** このチェックリストは、リリース済み PMDA Quick Looker 拡張機能の代表的なスモークテストを対象にします。

## Automated E2E scope / 自動E2E範囲

Run / 実行コマンド:

```bash
npm run build
npm test
npm run test:e2e
```

The Playwright tests open the built popup with a mocked Chrome extension runtime and mocked API responses. / Playwright テストは、モックした Chrome 拡張ランタイムと API レスポンスでビルド済みポップアップを開きます。

They verify / 確認項目:

- A manual search renders candidates in the popup. / 手動検索でポップアップに候補が表示される。
- Selecting a candidate exposes the package insert PDF URL through the viewer. / 候補選択によりビューアで添付文書PDF URL が確認できる。
- A zero-hit response shows the empty state. / 0件レスポンスで空状態が表示される。

## Manual browser smoke test / ブラウザ手動スモークテスト

| Step | English | 日本語 |
| --- | --- | --- |
| 1 | Build the extension with `npm run build`. | `npm run build` で拡張機能をビルドします。 |
| 2 | Open `chrome://extensions/`. | `chrome://extensions/` を開きます。 |
| 3 | Enable Developer mode. | デベロッパーモードを有効にします。 |
| 4 | Load the generated `dist/` directory as an unpacked extension. | 生成された `dist/` ディレクトリを未パッケージ拡張機能として読み込みます。 |
| 5 | Open a representative web UI that contains visible drug-name text. | 薬剤名テキストが見える代表的なWeb UIを開きます。 |
| 6 | Select a drug name such as `アムロジピン`. | `アムロジピン` などの薬剤名を選択します。 |
| 7 | Run the context menu item **PMDAで添付文書を調べる**. | 右クリックメニューの **PMDAで添付文書を調べる** を実行します。 |
| 8 | Open the extension popup or Side Panel. | 拡張機能ポップアップまたは Side Panel を開きます。 |
| 9 | Confirm that candidates appear within about two seconds. | 約2秒以内に候補が表示されることを確認します。 |
| 10 | Click a candidate and confirm that the PDF link or fallback PDF-unavailable state is visible. | 候補をクリックし、PDFリンクまたはPDF未取得時の代替状態が見えることを確認します。 |

## Representative UI matrix / 代表UIマトリクス

| Target UI | Test text location | Expected result | 対象UI | テストテキスト位置 | 期待結果 |
| --- | --- | --- | --- | --- | --- |
| Order entry style page | Prescription/order drug-name cell | Context menu search updates the popup or Side Panel and shows candidates. | オーダー入力風ページ | 処方/オーダー薬剤名セル | 右クリック検索でポップアップまたは Side Panel が更新され、候補が表示される。 |
| Prescription view style page | Medication list row | Context menu search updates the popup or Side Panel and shows candidates. | 処方表示風ページ | 薬剤リスト行 | 右クリック検索でポップアップまたは Side Panel が更新され、候補が表示される。 |
| Generic web page | Plain selected text | Context menu search updates the popup or Side Panel and shows candidates. | 一般Webページ | 通常の選択テキスト | 右クリック検索でポップアップまたは Side Panel が更新され、候補が表示される。 |

## Notes / 注意事項

- The automated tests use mocks and do not call the live API. / 自動テストはモックを使用し、実際の API は呼び出しません。
- Real customer environments should be checked manually because deployments and DOM structures vary by installation. / 実環境は、導入形態や DOM 構造が異なるため手動確認してください。
- Do not paste or test with patient-identifying information. Use public sample drug names only. / 患者識別情報を貼り付けたりテストに使ったりしないでください。公開サンプル薬剤名のみを使用してください。
