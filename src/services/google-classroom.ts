import { google } from "googleapis";

export async function getClassroomData(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const classroom = google.classroom({ version: "v1", auth });

  try {
    const coursesRes = await classroom.courses.list({ 
      courseStates: ["ACTIVE", "PROVISIONED"] 
    });
    const courses = coursesRes.data.courses || [];
    
    if (courses.length === 0) return [];

    const allData = [];
    for (const course of courses) {
      try {
        const [cwRes, annRes, matRes] = await Promise.allSettled([
          classroom.courses.courseWork.list({ courseId: course.id!, pageSize: 100 }),
          classroom.courses.announcements.list({ courseId: course.id!, pageSize: 100 }),
          classroom.courses.courseWorkMaterials.list({ courseId: course.id!, pageSize: 100 })
        ]);

        // 共通のキーワード判別関数
        const classify = (title: string) => {
          return /課題|レポート|宿題|提出|制作|演習|テスト|小テスト|試験|フォーム|アンケート|振り返り|評価|コメント|ワーク/.test(title) 
            ? "課題" : "連絡";
        };

        // 1. 課題
        if (cwRes.status === "fulfilled") {
          const items = (cwRes.value.data.courseWork || []).map(cw => {
            const materialLinks = extractLinks(cw.materials);
            const title = cw.title || "無題";
            return {
              id: cw.id,
              title: title,
              courseName: course.name,
              content: (cw.description || "") + (materialLinks ? "\n\n【添付資料・リンク】\n" + materialLinks : ""),
              date: cw.updateTime || cw.creationTime,
              dueDate: cw.dueDate,
              source: classify(title),
              url: cw.alternateLink,
            };
          });
          allData.push(...items);
        }

        // 2. お知らせ
        if (annRes.status === "fulfilled") {
          const items = (annRes.value.data.announcements || []).map(ann => {
            const materialLinks = extractLinks(ann.materials);
            const text = ann.text || "";
            const firstLine = text.split('\n')[0];
            return {
              id: ann.id,
              title: classify(firstLine) === "課題" ? firstLine.substring(0, 40) : "お知らせ",
              courseName: course.name,
              content: text + (materialLinks ? "\n\n【添付資料・リンク】\n" + materialLinks : ""),
              date: ann.updateTime || ann.creationTime,
              source: classify(text),
              url: ann.alternateLink,
            };
          });
          allData.push(...items);
        }

        // 3. 資料
        if (matRes.status === "fulfilled") {
          const items = (matRes.value.data.courseWorkMaterial || []).map(mat => {
            const materialLinks = extractLinks(mat.materials);
            const title = mat.title || "資料";
            return {
              id: mat.id,
              title: title,
              courseName: course.name,
              content: (mat.description || "") + (materialLinks ? "\n\n【添付資料・リンク】\n" + materialLinks : ""),
              date: mat.updateTime || mat.creationTime,
              source: classify(title),
              url: mat.alternateLink,
            };
          });
          allData.push(...items);
        }
      } catch (e) {
        console.error(`[Classroom] Error for ${course.name}:`, e);
      }
    }

    return allData.sort((a, b) => 
      new Date(b.date!).getTime() - new Date(a.date!).getTime()
    );
  } catch (error) {
    console.error("[Classroom] Global Error:", error);
    return [];
  }
}

function extractLinks(materials: any[] | undefined) {
  if (!materials) return "";
  return materials.map(m => {
    if (m.link) return m.link.url;
    if (m.driveFile) return m.driveFile.driveFile.alternateLink;
    if (m.youtubeVideo) return m.youtubeVideo.alternateLink;
    if (m.form) return m.form.formUrl;
    return null;
  }).filter(Boolean).join("\n");
}
