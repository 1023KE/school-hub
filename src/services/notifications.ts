import { getClassroomData } from "./google-classroom";
import { getGraphData } from "./microsoft-graph";

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

  try {
    const rawData = await getClassroomData(session.accessToken);
    const now = new Date();

    return rawData.map((item: any) => {
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
    }) as NotificationItem[];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}
