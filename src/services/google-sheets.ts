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

    return rows.slice(1).map((row, index) => ({
      id: `sheet-${index}`,
      title: row[titleIdx] || "無題",
      content: row[contentIdx] || "",
      date: row[dateIdx] || new Date().toISOString(),
      source: (row[sourceIdx] || "連絡") as "課題" | "連絡",
      url: row[urlIdx] || "",
      courseName: row[sourceIdx] || "Outlook/Teams",
    }));
  } catch (error) {
    console.error("[Sheets API Error]", error);
    return [];
  }
}
