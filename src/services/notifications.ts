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
  if (!session?.accessToken) return [];

  try {
    if (session.provider === "google") {
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
    } else if (session.provider === "azure-ad") {
      const graphData = await getGraphData(session.accessToken);
      return graphData.map((item: any) => ({
        ...item,
        courseName: "Microsoft 365",
        isExpired: false,
        // OutlookやTeamsのデータも「連絡」または「すべて」として扱う
        source: "連絡", 
        platform: item.source // "Outlook" か "Teams" を記録しておく
      })) as NotificationItem[];
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }

  return [];
}
