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
    const findIndex = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));

    const titleIdx = findIndex("Title");
    const contentIdx = findIndex("Content");
    const dateIdx = findIndex("Date");
    const sourceIdx = findIndex("Source");
    const urlIdx = findIndex("URL");

    // Classroomと同じキーワード判別ロジック
    const classify = (text: string) => {
      return /課題|レポート|宿題|提出|制作|演習|テスト|小テスト|試験|フォーム|アンケート|振り返り|評価|コメント|ワーク/.test(text) 
        ? "課題" : "連絡";
    };

    return rows.slice(1).map((row, index) => {
      const rawDate = row[dateIdx];
      let date = new Date().toISOString();
      
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString();
        }
      }

      const title = row[titleIdx] || row[0] || "無題";
      const content = row[contentIdx] || row[1] || "";
      const rawSource = row[sourceIdx] || "Outlook/Teams";

      return {
        id: `sheet-${index}-${Date.now()}`,
        title: title,
        content: content,
        date: date,
        // タイトルまたは内容から「課題」か「連絡」かを判別
        source: classify(title + content),
        url: row[urlIdx] || "",
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
