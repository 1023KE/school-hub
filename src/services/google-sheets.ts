import { google } from "googleapis";

export async function getSheetsData(accessToken: string, spreadsheetId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A1:Z", // 1行目のヘッダーを含めて広めに取得
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    const findIndex = (name: string, fallback: number) => {
      const idx = headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));
      return idx === -1 ? fallback : idx;
    };

    const titleIdx = findIndex("Title", 0);
    const contentIdx = findIndex("Content", 1);
    const dateIdx = findIndex("Date", 2);
    const sourceIdx = findIndex("Source", 3);
    const urlIdx = findIndex("URL", 4);
    const summaryIdx = findIndex("Summary", 5);

    // Classroomと同じキーワード判別ロジック
    const classify = (text: string) => {
      return /課題|レポート|宿題|提出|制作|演習|テスト|小テスト|試験|フォーム|アンケート|振り返り|評価|コメント|ワーク/.test(text) 
        ? "課題" : "連絡";
    };

    return rows.slice(1).map((row, index) => {
      const title = row[titleIdx] || "";
      const content = row[contentIdx] || "";
      const rawDate = row[dateIdx];
      const rawSource = row[sourceIdx] || "Outlook/Teams";
      const url = row[urlIdx] || "";
      const summary = row[summaryIdx] || "";

      let date = new Date().toISOString();
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString();
        }
      }

      return {
        id: `sheet-${index}-${Date.now()}`,
        title: title || "無題",
        content: content,
        date: date,
        // タイトルまたは内容から「課題」か「連絡」かを判別
        source: classify(title + content),
        url: url,
        summary: summary,
        courseName: rawSource, // 表示名（Outlook, Teamsなど）
      };
    });
  } catch (error: any) {
    console.error("[Sheets API Error]", error);
    // エラー情報を画面に表示するためのダミーデータ（デバッグ用）
    return [{
      id: "error-sheet",
      title: "シート取得エラー",
      content: `エラー内容: ${error.message || "不明なエラー"}。シートIDや権限を確認してください。`,
      date: new Date().toISOString(),
      source: "連絡",
      url: "",
      courseName: "System Error",
    }];
  }
}
