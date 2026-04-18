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
  Link2
} from "lucide-react";

const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
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
  { area: "教室前", names: ["佐藤", "鈴木"] },
  { area: "教室後ろ", names: ["高橋", "田中"] },
  { area: "廊下", names: ["伊藤", "渡辺"] },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "assignments" | "announcements">("all");
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
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

  if (status === "loading") return <div className="p-8 text-center text-gray-400 font-medium">OMUアカウントを確認中...</div>;

  return (
    <div className="bg-white dark:bg-black min-h-screen text-gray-900 dark:text-gray-100 text-sm antialiased font-sans transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto p-4 md:p-6">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">School Hub</h1>
          
          {session ? (
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${session.provider === "google" ? "bg-red-500" : "bg-blue-500"}`}></span>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{session.user?.email}</span>
              <button onClick={() => signOut()} className="p-1 text-gray-400 hover:text-red-500 transition">
                <LogOut size={16} />
              </button>
            </div>
          ) : null}
        </header>

        {!session ? (
          <div className="text-center py-20 max-w-xl mx-auto">
            <h2 className="text-3xl font-black mb-4 text-gray-900 dark:text-white leading-tight">学校生活を一つにまとめよう</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-12 text-base font-medium leading-relaxed">@st.omu.ac.jp のアカウントを使って、<br/>Classroom、Outlook、Teamsを同期します。</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => signIn("google")} 
                className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-3xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200 dark:shadow-none"
              >
                <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black">G</div>
                Classroomでログイン
              </button>

              <button 
                onClick={() => signIn("azure-ad")} 
                className="w-full py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-3xl font-bold hover:border-blue-200 dark:hover:border-blue-500 transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black">M</div>
                Outlook/Teamsでログイン
              </button>
            </div>
            
            <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
              両方のボタンから順にログインすると、すべてのデータが統合されます
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* サイドバー */}
            <div className="lg:col-span-3 space-y-8">
              <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-xs font-bold flex items-center gap-2 mb-6 text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <Brush size={14} /> 掃除当番
                </h2>
                <div className="space-y-2">
                  {CLEANING_DUTY.map((duty, i) => (
                    <div key={i} className="flex justify-between p-3 bg-gray-50 dark:bg-black rounded-xl text-xs border border-transparent">
                      <span className="font-bold text-gray-700 dark:text-gray-300">{duty.area}</span>
                      <span className="text-gray-500 dark:text-gray-500 font-medium">{duty.names.join(", ")}</span>
                    </div>
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

                  <div className="space-y-3">
                    {filteredItems.length === 0 && !loading ? (
                      <div className="text-center py-20 text-gray-300 dark:text-gray-700 text-xs font-black italic"><Bell size={40} className="mx-auto mb-4 opacity-10" />No Data Found</div>
                    ) : (
                      filteredItems.map((item) => {
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
                              <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">{item.title}</h3>
                            </div>
                            <ChevronRight size={16} className="text-gray-200 dark:text-gray-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selectedItem.title}</h2>
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
    </div>
  );
}
