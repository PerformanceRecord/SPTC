const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'シート1';
const HEADERS = [
  '送信日時',
  '診断モード',
  'ニックネーム',
  'タイプコード',
  'タイプ名',
  '起点性スコア',
  '起点性記号',
  '公共性スコア',
  '公共性記号',
  'テーマ性スコア',
  'テーマ性記号',
  '本体性スコア',
  '本体性記号',
  'アーカイブ向き',
  'リアタイ向き',
  '信頼度'
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    sheet.appendRow([
      payload.submittedAt,
      payload.mode,
      payload.nickname,
      payload.code,
      payload.typeName,
      payload.originScore,
      payload.originSymbol,
      payload.publicityScore,
      payload.publicitySymbol,
      payload.themeScore,
      payload.themeSymbol,
      payload.bodyScore,
      payload.bodySymbol,
      payload.archiveCount,
      payload.realtimeCount,
      payload.confidence
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
