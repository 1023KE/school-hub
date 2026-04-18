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

    return rows.slice(1).map((row, index) => {
      const rawDate = row[dateIdx];
      let date = new Date().toISOString();
      
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString();
        }
      }

      // シートのSource列から取得するか、デフォルトで"連絡"にする
      const rawSource = row[sourceIdx] || "連絡";
      const source = (rawSource.includes("課題") ? "課題" : "連絡") as "課題" | "連絡";

      return {
        id: `sheet-${index}-${Date.now()}`,
        title: row[titleIdx] || row[0] || "無題", // タイトルが見つからなければ1列目を使用
        content: row[contentIdx] || row[1] || "",
        date: date,
        source: source,
        url: row[urlIdx] || "",
        courseName: rawSource || "Outlook/Teams", // 表示名としてSourceを使用
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
