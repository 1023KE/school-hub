"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { NotificationItem } from "@/services/notifications";
import { 
  Calendar, 
  Bell, 
  LogIn, 
  LogOut, 
  Brush, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Search,
  ExternalLink,
  AlertCircle,
  Megaphone,
  History,
  X,
  MessageSquare,
  PlusCircle,
  Link2,
  Settings
} from "lucide-react";

const stripHtml = (html: string) => {
  // HTMLタグを削除
  let text = html.replace(/<[^>]*>?/gm, '');
  // 特殊文字のデコード
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&copy;': '©',
    '&reg;': '®'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match.toLowerCase()] || match);
};

const linkify = (text: string) => {
  const cleanText = stripHtml(text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return cleanText.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all inline-flex items-center gap-1">
          {part} <ExternalLink size={12} />
        </a>
      );
    }
    return part;
  });
};

const CLEANING_DUTY = [
  { area: "1班", names: ["担当A", "担当B"] },
  { area: "2班", names: ["担当C", "担当D"] },
  { area: "3班", names: ["担当E", "担当F"] },
  { area: "4班", names: ["担当G", "担当H"] },
  { area: "5班", names: ["担当I", "担当J"] },
  { area: "6班", names: ["担当K", "担当L"] },
];

const ADMINS = ["rn26102n@st.omu.ac.jp", "rn26102@st.omu.ac.jp"];
const CLEANING_START_DATE = "2026-04-15"; // 基準となる最初の水曜日 (1班-4班)

const USEFUL_LINKS = [
  { name: "UNIPA (ポータル)", url: "https://unipa.omu.ac.jp/up/faces/login/index.jsp", icon: <Link2 size={12} /> },
  { name: "シラバス検索", url: "https://syllabus.omu.ac.jp/", icon: <Search size={12} /> },
  { name: "図書館 OMUサーチ", url: "https://lib.omu.ac.jp/", icon: <Link2 size={12} /> },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "assignments" | "announcements">("all");
  const [showExpired, setShowExpired] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [customSheetId, setCustomSheetId] = useState("");
  const [duties, setDuties] = useState<{ area: string; names: string[] }[]>(CLEANING_DUTY);
  const [showDutyEditor, setShowDutyEditor] = useState(false);
  const [skippedDates, setSkippedDates] = useState<string[]>([]);

  useEffect(() => {
    const savedId = localStorage.getItem("custom_sheet_id");
    const hasSeenTutorial = localStorage.getItem("has_seen_tutorial");
    const savedDuties = localStorage.getItem("cleaning_duties");
    const savedSkips = localStorage.getItem("cleaning_skips");
    
    if (savedId) setCustomSheetId(savedId);
    if (savedDuties) setDuties(JSON.parse(savedDuties));
    if (savedSkips) setSkippedDates(JSON.parse(savedSkips));

    // ログイン済みで、かつIDが未設定で、まだ案内を見ていない場合に表示
    if (status === "authenticated" && !savedId && !hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [status]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const closeTutorial = () => {
    localStorage.setItem("has_seen_tutorial", "true");
    setShowTutorial(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const sheetId = localStorage.getItem("custom_sheet_id");
      const url = sheetId ? `/api/notifications?sheetId=${sheetId}` : "/api/notifications";
      const res = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem("custom_sheet_id", customSheetId);
    setShowSettings(false);
    fetchData();
  };

  const getTargetWednesday = () => {
    const now = new Date();
    const day = now.getDay();
    // 水曜日(3)までの差分を計算。木曜(4)以降なら来週の水曜日を指すようにする
    let diff = (3 - day + 7) % 7;
    // 木曜、金曜、土曜なら来週へ
    if (day > 3) diff = (3 - day + 7);
    
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const date = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const targetWed = getTargetWednesday();
  const isAdmin = session?.user?.email && ADMINS.some(admin => admin.toLowerCase() === session.user?.email?.toLowerCase());

  const calculateCleaning = (targetDateStr: string) => {
    const start = new Date(CLEANING_START_DATE);
    const target = new Date(targetDateStr);
    let activeCount = 0;
    let curr = new Date(start);
    while (curr <= target) {
      if (curr.getDay() === 3) {
        const dStr = curr.toISOString().split('T')[0];
        if (!skippedDates.includes(dStr)) activeCount++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    const idx = (activeCount - 1) % 6;
    const leadIdx = idx < 0 ? 0 : idx;
    const partnerIdx = (leadIdx + 3) % 6;
    return { lead: duties[leadIdx], partner: duties[partnerIdx] };
  };

  const currentCleaning = calculateCleaning(targetWed);
  const isTargetSkipped = skippedDates.includes(targetWed);

  const toggleSkip = () => {
    let nextSkips;
    if (isTargetSkipped) {
      nextSkips = skippedDates.filter(d => d !== targetWed);
    } else {
      nextSkips = [...skippedDates, targetWed];
    }
    setSkippedDates(nextSkips);
    localStorage.setItem("cleaning_skips", JSON.stringify(nextSkips));
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "assignments") {
      return item.source === "課題" && (showExpired || !item.isExpired);
    }
    return item.source === "連絡" || (item as any).platform === "Outlook" || (item as any).platform === "Teams";
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const date = new Date(item.date);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    let label = "それ以前";
    if (isToday) label = "今日";
    else if (isYesterday) label = "昨日";

    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  if (status === "loading") return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Checking OMU Session...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-black min-h-screen text-gray-900 dark:text-gray-100 text-sm antialiased font-sans transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto p-4 md:p-6">
        {!session ? (
          <div className="min-h-[85vh] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl font-black mb-2 text-gray-900 dark:text-white tracking-tighter italic">School Hub v3</h1>
            <p className="text-gray-400 dark:text-gray-500 mb-12 text-xs font-bold uppercase tracking-widest">Connect Classroom, Outlook, Teams</p>
            
            <button 
              onClick={() => signIn("google")} 
              className="w-full max-w-xs py-5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-3xl font-black text-xs hover:opacity-90 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-gray-200 dark:shadow-none"
            >
              <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black">G</div>
              OMUアカウントでログイン
            </button>
          </div>
        ) : (
          <>
            <header className="flex justify-between items-center mb-10">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">School Hub v3</h1>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <Settings size={20} />
                </button>
                
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${session.provider === "google" ? "bg-red-500" : "bg-blue-500"}`}></span>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{session.user?.email}</span>
                  <button onClick={() => signOut()} className="p-1 text-gray-400 hover:text-red-500 transition">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* サイドバー */}
            <div className="lg:col-span-3 space-y-8">
              <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-bold flex items-center gap-2 text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <Brush size={14} /> 掃除当番
                  </h2>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button 
                        onClick={toggleSkip}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-full transition-all border ${
                          isTargetSkipped 
                          ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-900/20 dark:border-red-900/40" 
                          : "bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/40 hover:bg-blue-100"
                        }`}
                      >
                        {isTargetSkipped ? "休み解除" : "今週はなし"}
                      </button>
                    )}
                    <button 
                      onClick={() => setShowDutyEditor(true)}
                      className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors bg-gray-50 dark:bg-black rounded-lg"
                    >
                      <Settings size={12} />
                    </button>
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
                    {new Date(targetWed.replace(/-/g, '/')).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} (水)
                    {new Date(targetWed.replace(/-/g, '/')).toDateString() === new Date().toDateString() ? " (今日)" : 
                     new Date(targetWed.replace(/-/g, '/')).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? " (今週)" : " (来週)"}
                  </div>
                  
                  {isTargetSkipped ? (
                    <div className="py-4">
                      <div className="text-lg font-black text-red-400 dark:text-red-500 tracking-tighter italic">No Cleaning</div>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">今週は掃除はありません</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                          {currentCleaning.lead.area} <span className="text-blue-500 mx-1">&</span> {currentCleaning.partner.area}
                        </div>
                      </div>
                      <div className="flex gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <span>{currentCleaning.lead.names.join(", ")}</span>
                        <span>/</span>
                        <span>{currentCleaning.partner.names.join(", ")}</span>
                      </div>
                    </div>
                  )}
                </div>

                {!isTargetSkipped && (
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    <div className="flex justify-between items-center text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">
                      <span>Next week</span>
                      <span className="text-gray-400 dark:text-gray-600">
                        {calculateCleaning(new Date(new Date(targetWed).setDate(new Date(targetWed).getDate() + 7)).toISOString().split('T')[0]).lead.area} & 
                        {calculateCleaning(new Date(new Date(targetWed).setDate(new Date(targetWed).getDate() + 7)).toISOString().split('T')[0]).partner.area}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-xs font-bold flex items-center gap-2 mb-6 text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <Link2 size={14} /> 便利リンク
                </h2>
                <div className="space-y-2">
                  {USEFUL_LINKS.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black rounded-xl text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        {link.icon} {link.name}
                      </span>
                      <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </section>
            </div>

            {/* メインリスト */}
            <div className="lg:col-span-9">
              <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="flex bg-gray-50/50 dark:bg-black/50 p-1.5">
                  <button onClick={() => setActiveTab("all")} className={`flex-1 py-3 text-[11px] font-bold rounded-2xl transition-all ${activeTab === "all" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>すべて</button>
                  <button onClick={() => setActiveTab("assignments")} className={`flex-1 py-3 text-[11px] font-bold rounded-2xl transition-all ${activeTab === "assignments" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>課題</button>
                  <button onClick={() => setActiveTab("announcements")} className={`flex-1 py-3 text-[11px] font-bold rounded-2xl transition-all ${activeTab === "announcements" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>お知らせ</button>
                </div>

                <div className="p-6 flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                    <div className="relative flex-1 w-full max-w-sm">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={16} />
                      <input type="text" placeholder="タイトルや内容で検索..." className="w-full pl-11 pr-5 py-3 bg-gray-50 dark:bg-black rounded-[20px] text-xs border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                      {(activeTab === "assignments" || activeTab === "all") && (
                        <button onClick={() => setShowExpired(!showExpired)} className={`px-4 py-3 rounded-[18px] text-[10px] font-black transition-all ${showExpired ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-xl dark:shadow-none" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>期限切れを表示</button>
                      )}
                      <button onClick={fetchData} className="p-3 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors" disabled={loading}><Clock size={18} className={loading ? "animate-spin text-blue-500" : ""} /></button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {filteredItems.length === 0 && !loading ? (
                      <div className="text-center py-20 text-gray-300 dark:text-gray-700 text-xs font-black italic"><Bell size={40} className="mx-auto mb-4 opacity-10" />No Data Found</div>
                    ) : (
                      ["今日", "昨日", "それ以前"].map((group) => {
                        const groupItems = groupedItems[group];
                        if (!groupItems || groupItems.length === 0) return null;

                        return (
                          <div key={group} className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1 flex items-center gap-2">
                              {group} <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
                            </h4>
                            <div className="space-y-3">
                              {groupItems.map((item) => {
                                const isOutlook = item.courseName === "Outlook";
                                const isTeams = item.courseName === "Teams";
                                const isClassroom = !isOutlook && !isTeams;

                                const gradientClasses = isClassroom 
                                  ? "bg-gradient-to-r from-green-100/40 via-transparent to-transparent dark:from-green-900/30 dark:via-transparent dark:to-transparent border-green-100/50 dark:border-green-900/30" 
                                  : isOutlook 
                                  ? "bg-gradient-to-r from-blue-100/40 via-transparent to-transparent dark:from-blue-900/30 dark:via-transparent dark:to-transparent border-blue-100/50 dark:border-blue-900/30"
                                  : isTeams 
                                  ? "bg-gradient-to-r from-indigo-100/40 via-transparent to-transparent dark:from-indigo-900/30 dark:via-transparent dark:to-transparent border-indigo-100/50 dark:border-indigo-900/30"
                                  : "bg-white dark:bg-gray-900 border-gray-50 dark:border-gray-800";

                                return (
                                  <button 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(item)} 
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group 
                                      ${activeTab !== "all" && item.isExpired ? "opacity-40" : "hover:shadow-md dark:hover:shadow-blue-900/20 shadow-sm"}
                                      ${gradientClasses}
                                    `}
                                  >
                                    <div className="flex-1 min-w-0 pr-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1 rounded-lg ${
                                          item.source === "課題" ? "bg-red-50 dark:bg-red-900/30 text-red-500" : 
                                          isClassroom ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300" :
                                          isOutlook ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" :
                                          isTeams ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" :
                                          "bg-green-50 dark:bg-green-900/20 text-green-600"
                                        }`}>
                                          {item.source === "課題" && <CheckCircle2 size={14} />}
                                          {item.source === "連絡" && (isOutlook ? <Calendar size={14} /> : isTeams ? <MessageSquare size={14} /> : <Megaphone size={14} />)}
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-tighter">{item.source}</span>
                                        {item.dueDateString && !item.isExpired && <span className="text-[9px] font-black text-orange-500">{item.dueDateString}まで</span>}
                                        <span className={`text-[9px] font-black truncate max-w-[120px] ml-auto ${
                                          isClassroom ? "text-green-600/50 dark:text-green-400/30" :
                                          isOutlook ? "text-blue-600/50 dark:text-blue-400/30" :
                                          isTeams ? "text-indigo-600/50 dark:text-indigo-400/30" :
                                          "text-gray-300 dark:text-gray-700"
                                        }`}>{item.courseName}</span>
                                      </div>
                                      <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">{stripHtml(item.title)}</h3>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-200 dark:text-gray-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

        {selectedItem && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-800">
            <div className={`p-8 ${
              selectedItem.courseName === "Outlook" ? "bg-blue-50/20 dark:bg-blue-900/10" :
              selectedItem.courseName === "Teams" ? "bg-indigo-50/20 dark:bg-indigo-900/10" :
              "bg-green-50/20 dark:bg-green-900/10"
            }`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1 pr-8">
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                    selectedItem.courseName === "Outlook" ? "text-blue-400" :
                    selectedItem.courseName === "Teams" ? "text-indigo-400" :
                    "text-green-400"
                  }`}>{selectedItem.courseName}</div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{stripHtml(selectedItem.title)}</h2>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 bg-white/80 dark:bg-black/40 rounded-full transition-all backdrop-blur-sm"><X size={20} /></button>
              </div>
              
              <div className="bg-white dark:bg-black/40 p-6 rounded-3xl mb-8 max-h-[350px] overflow-y-auto border border-gray-100/50 dark:border-gray-800/50 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-300 shadow-inner">
                {linkify(selectedItem.content)}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black text-gray-300 dark:text-gray-600">
                  <div>UPDATED: {new Date(selectedItem.date).toLocaleDateString()}</div>
                </div>
                {selectedItem.url && (
                  <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[20px] font-black hover:opacity-90 transition-all text-xs shadow-xl shadow-gray-200 dark:shadow-none active:scale-95">
                    詳細を開く
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8">
            <h2 className="text-xl font-black mb-2 text-gray-900 dark:text-white">連携設定</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Outlook/Teams 連携用ID</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">スプレッドシートID</label>
                <input 
                  type="text" 
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  placeholder="1abc123..."
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-black rounded-2xl text-xs border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-100 dark:focus:border-blue-900 outline-none transition-all dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-[10px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  キャンセル
                </button>
                <button 
                  onClick={saveSettings}
                  className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] hover:opacity-90 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTutorial && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-10 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <PlusCircle size={32} />
            </div>
            <h2 className="text-xl font-black mb-2 text-gray-900 dark:text-white">Outlookも統合しませんか？</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
              簡単な設定で、Outlookの予定やTeamsの通知も<br/>この画面にまとめられます。
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => { setShowTutorial(false); setShowSettings(true); }}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] hover:opacity-90 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
              >
                設定ガイドを見る
              </button>
              <button 
                onClick={closeTutorial}
                className="w-full py-4 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl font-black text-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-800"
              >
                あとで設定する
              </button>
            </div>
          </div>
        </div>
      )}
      {showDutyEditor && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-10 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tighter">掃除当番の編集</h2>
            <div className="space-y-4 mb-8 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {duties.map((duty, i) => (
                <div key={i} className="space-y-3 p-5 bg-gray-50/50 dark:bg-black/50 rounded-3xl border border-gray-100 dark:border-gray-800 group relative">
                  <div className="flex justify-between items-center">
                     <input 
                        value={duty.area} 
                        onChange={(e) => {
                          const next = [...duties];
                          next[i] = { ...next[i], area: e.target.value };
                          setDuties(next);
                        }}
                        className="bg-transparent font-black text-sm text-blue-500 dark:text-blue-400 outline-none w-3/4 placeholder:text-gray-300"
                        placeholder="場所（例: 教室前）"
                     />
                     <button 
                        onClick={() => setDuties(duties.filter((_, idx) => idx !== i))} 
                        className="p-2 text-gray-200 hover:text-red-400 transition-colors"
                     >
                       <X size={16} />
                     </button>
                  </div>
                  <input 
                    value={duty.names.join(", ")} 
                    onChange={(e) => {
                      const next = [...duties];
                      next[i] = { ...next[i], names: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                      setDuties(next);
                    }}
                    className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl text-[11px] font-bold outline-none border border-gray-100 dark:border-gray-800 focus:border-blue-200 dark:focus:border-blue-900 transition-all dark:text-white placeholder:text-gray-300"
                    placeholder="担当者（カンマ区切り）"
                  />
                </div>
              ))}
              <button 
                onClick={() => setDuties([...duties, { area: "", names: [] }])}
                className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl text-[10px] font-black text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all flex items-center justify-center gap-3 bg-gray-50/20 dark:bg-black/20"
              >
                <PlusCircle size={16} /> 場所を追加
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const saved = localStorage.getItem("cleaning_duties");
                    if (saved) setDuties(JSON.parse(saved));
                    else setDuties(CLEANING_DUTY);
                    setShowDutyEditor(false);
                  }} 
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl font-black text-[11px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  キャンセル
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem("cleaning_duties", JSON.stringify(duties));
                    setShowDutyEditor(false);
                  }} 
                  className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[11px] hover:opacity-90 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
                >
                  保存
                </button>
              </div>
              <button 
                onClick={() => {
                  if (confirm("掃除当番を初期状態（1班〜6班）に戻しますか？")) {
                    setDuties(CLEANING_DUTY);
                    localStorage.removeItem("cleaning_duties");
                  }
                }}
                className="w-full py-3 text-[9px] font-black text-red-300 hover:text-red-500 transition-colors"
              >
                初期状態に戻す (1班〜6班)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
