import { Client } from "@microsoft/microsoft-graph-client";

export async function getGraphData(accessToken: string) {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  try {
    // 1. Outlook Calendar Events
    const eventsRes = await client.api("/me/events")
      .select("subject,start,end,webLink")
      .top(5)
      .get();
    
    const events = (eventsRes.value || []).map((event: any) => ({
      id: event.id,
      title: `[Outlook] ${event.subject}`,
      content: `Starts: ${new Date(event.start.dateTime).toLocaleString()}`,
      date: event.start.dateTime,
      source: "Outlook",
      url: event.webLink,
    }));

    // 2. Teams Activity Feed (Recent notifications)
    // Note: ActivityFeed requires specific permissions and might not return all data
    // Alternative: List recent messages or chats
    const teamsRes = await client.api("/me/teams")
      .get();
    
    // For prototype, we combine and return
    return [...events].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("Graph API Error:", error);
    return [];
  }
}
