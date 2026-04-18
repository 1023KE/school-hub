import { google } from "googleapis";

export async function getSheetsData(accessToken: string, spreadsheetId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A2:E", // 1行目はヘッダー [Title, Content, Date, Source, URL]
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    return rows.map((row, index) => ({
      id: `sheet-${index}`,
      title: row[0] || "無題",
      content: row[1] || "",
      date: row[2] || new Date().toISOString(),
      source: row[3] || "連絡",
      url: row[4] || "",
      courseName: "Outlook/Teams",
    }));
  } catch (error) {
    console.error("[Sheets API Error]", error);
    return [];
  }
}
