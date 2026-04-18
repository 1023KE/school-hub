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

  const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID;

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

    return combinedData.sort((a, b) => 
      new Date(b.date!).getTime() - new Date(a.date!).getTime()
    );
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}
