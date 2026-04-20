import { getClassroomData } from "./google-classroom";
import { getSheetsData } from "./google-sheets";

export interface NotificationItem {
  id: string;
  title: string;
  courseName: string;
  content: string;
  date: string; // 更新日
  dueDateString?: string; // 期限 (YYYY/MM/DD)
  isExpired: boolean; // 期限切れフラグ
  source: "課題" | "連絡" | "Outlook" | "Teams";
  url?: string;
}

export async function fetchAllNotifications(session: any): Promise<NotificationItem[]> {
  if (!session?.accessToken || session.provider !== "google") return [];

  const spreadsheetId = session.customSheetId;

  try {
    const classroomPromise = getClassroomData(session.accessToken);
    const sheetsPromise = spreadsheetId 
      ? getSheetsData(session.accessToken, spreadsheetId)
      : Promise.resolve([]);

    const [rawClassroomData, sheetsData] = await Promise.all([
      classroomPromise,
      sheetsPromise
    ]);

    const now = new Date();
    const classroomItems = rawClassroomData.map((item: any) => {
      let isExpired = false;
      let dueDateString = "";

      if (item.dueDate) {
        const dueDate = new Date(item.dueDate.year, item.dueDate.month - 1, item.dueDate.day, 23, 59, 59);
        isExpired = dueDate < now;
        dueDateString = `${item.dueDate.year}/${item.dueDate.month}/${item.dueDate.day}`;
      }

      return {
        ...item,
        isExpired,
        dueDateString,
      };
    });

    const combinedData = [...classroomItems, ...sheetsData];
    
    // デバッグ用: シートが空の場合にメッセージを表示
    if (spreadsheetId && sheetsData.length === 0) {
      combinedData.push({
        id: "empty-sheet",
        title: "スプレッドシートが空です",
        content: "Sheet1にデータが2行目以降に存在するか確認してください。見出しは Title, Content, Date, Source, URL です。",
        date: new Date().toISOString(),
        source: "連絡",
        courseName: "System Info",
      });
    }

    return combinedData.sort((a, b) => 
      new Date(b.date!).getTime() - new Date(a.date!).getTime()
    );
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}
