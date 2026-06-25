# SPTC

配信雑談16タイプ分類チェックシートです。

## 診断結果をGoogleスプレッドシートへ送信する設定

このアプリは、Google Apps ScriptのWebアプリURLへ診断結果を送信します。

### 1. Apps Scriptを作成する

1. 診断集計スプレッドシートを開く
2. メニューから「拡張機能」→「Apps Script」を開く
3. `google-apps-script.js` の内容を貼り付ける
4. シート名が `シート1` 以外の場合は、`SHEET_NAME` を実際のシート名に変更する

### 2. Webアプリとしてデプロイする

1. Apps Script画面右上の「デプロイ」→「新しいデプロイ」を選ぶ
2. 種類は「ウェブアプリ」を選ぶ
3. 「実行するユーザー」は「自分」
4. 「アクセスできるユーザー」は「全員」
5. デプロイ後に表示されるWebアプリURLをコピーする

### 3. アプリ側にURLを設定する

`script.js` の先頭にある `RESULT_ENDPOINT` に、コピーしたWebアプリURLを入れます。

```js
const RESULT_ENDPOINT = 'https://script.google.com/macros/s/xxxxx/exec';
```

設定後、診断結果を表示すると自動でスプレッドシートへ送信されます。
