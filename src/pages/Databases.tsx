import React, { useState, useEffect } from "react";
import { getCollection, addItem, updateItem, deleteItem } from "../lib/db";
import { CloudDatabase, DBTable } from "../types";
import {
  Search,
  Database,
  Plus,
  X,
  Copy,
  Check,
  QrCode,
  Trash2,
  AlertTriangle,
  HardDrive,
  Layers,
  Sparkles,
  Cpu,
  Terminal,
  Download,
  Key,
  ChevronRight,
  Play,
  ArrowRightLeft,
  Server
} from "lucide-react";
import QRCodeModal from "../components/QRCodeModal";

export default function Databases() {
  const [databases, setDatabases] = useState<CloudDatabase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"monitor" | "ai-agent">("monitor");

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState({ text: "", title: "", category: "" });

  // Copy success indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New database form fields
  const [newDb, setNewDb] = useState({
    name: "",
    provider: "supabase" as CloudDatabase["provider"],
    connectionString: "",
    dbName: "",
    username: "",
    password: "",
    maxStorageMB: 500,
    usedStorageMB: 0,
    notes: "",
    tagsString: "",
    tables: [] as DBTable[]
  });

  // Table form field (to add a table to the new db)
  const [tempTable, setTempTable] = useState({
    name: "",
    recordsCount: 0,
    sizeMB: 0,
    description: ""
  });

  // AI SQL Agent States
  const [aiPrompt, setAiPrompt] = useState("");
  const [targetDbType, setTargetDbType] = useState("postgresql");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [generatedResult, setGeneratedResult] = useState<{
    success: boolean;
    provider?: string;
    sql?: string;
    attempts?: { provider: string; status: string; error?: string }[];
  } | null>(null);

  // AI API Keys stored locally
  const [aiKeys, setAiKeys] = useState({
    gemini: "",
    groq: "",
    openai: "",
    kimi: ""
  });

  // Providers fallback sequence configuration (order of execution)
  const [providerSequence, setProviderSequence] = useState<string[]>([
    "gemini",
    "groq",
    "openai",
    "kimi"
  ]);

  useEffect(() => {
    setDatabases(getCollection<CloudDatabase>("databases"));
    
    // Load saved API keys from localStorage safely
    const savedKeys = localStorage.getItem("vault_ai_agent_keys");
    if (savedKeys) {
      try {
        setAiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error("Error loading AI keys", e);
      }
    }

    // Load provider sequence if saved
    const savedSeq = localStorage.getItem("vault_ai_provider_sequence");
    if (savedSeq) {
      try {
        setProviderSequence(JSON.parse(savedSeq));
      } catch (e) {
        console.error("Error loading sequence", e);
      }
    }
  }, []);

  const saveKeysToStorage = (newKeys: typeof aiKeys) => {
    setAiKeys(newKeys);
    localStorage.setItem("vault_ai_agent_keys", JSON.stringify(newKeys));
  };

  const saveSequenceToStorage = (newSeq: string[]) => {
    setProviderSequence(newSeq);
    localStorage.setItem("vault_ai_provider_sequence", JSON.stringify(newSeq));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQR = (db: CloudDatabase) => {
    setQrModalData({
      text: db.connectionString,
      title: db.name,
      category: `${db.provider.toUpperCase()} | ${db.dbName}`
    });
    setQrModalOpen(true);
  };

  const handleAddTableToForm = () => {
    if (!tempTable.name) return;
    setNewDb(prev => ({
      ...prev,
      tables: [...prev.tables, { ...tempTable }],
      usedStorageMB: prev.usedStorageMB + Number(tempTable.sizeMB)
    }));
    setTempTable({ name: "", recordsCount: 0, sizeMB: 0, description: "" });
  };

  const handleRemoveTableFromForm = (index: number) => {
    setNewDb(prev => {
      const removedSize = prev.tables[index].sizeMB;
      return {
        ...prev,
        tables: prev.tables.filter((_, i) => i !== index),
        usedStorageMB: Math.max(0, prev.usedStorageMB - removedSize)
      };
    });
  };

  const handleAddDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDb.name || !newDb.dbName) return;

    const tags = newDb.tagsString
      ? newDb.tagsString.split(",").map(t => t.trim()).filter(Boolean)
      : [newDb.provider];

    const dbPayload = {
      name: newDb.name,
      provider: newDb.provider,
      connectionString: newDb.connectionString,
      dbName: newDb.dbName,
      username: newDb.username || undefined,
      password: newDb.password || undefined,
      maxStorageMB: Number(newDb.maxStorageMB) || 500,
      usedStorageMB: Number(newDb.usedStorageMB) || 0,
      tables: newDb.tables,
      status: (Number(newDb.usedStorageMB) / (Number(newDb.maxStorageMB) || 500) >= 0.95) ? "full" as const : "active" as const,
      notes: newDb.notes,
      tags,
      isFavorite: false,
      isPinned: false
    };

    await addItem<CloudDatabase>("databases", dbPayload);
    setDatabases(getCollection<CloudDatabase>("databases"));
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setNewDb({
      name: "",
      provider: "supabase",
      connectionString: "",
      dbName: "",
      username: "",
      password: "",
      maxStorageMB: 500,
      usedStorageMB: 0,
      notes: "",
      tagsString: "",
      tables: []
    });
    setTempTable({ name: "", recordsCount: 0, sizeMB: 0, description: "" });
  };

  const handleDeleteDatabase = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف قاعدة البيانات هذه نهائياً؟")) {
      deleteItem("databases", id);
      setDatabases(getCollection<CloudDatabase>("databases"));
    }
  };

  const handleUpdateStorage = async (dbId: string, usedMB: number) => {
    const db = databases.find(d => d.id === dbId);
    if (!db) return;
    const status = (usedMB / db.maxStorageMB >= 0.95) ? "full" : "active";
    await updateItem<CloudDatabase>("databases", dbId, { usedStorageMB: usedMB, status });
    setDatabases(getCollection<CloudDatabase>("databases"));
  };

  // Run AI SQL Generation with Automatic Failover proxy
  const handleGenerateSQL = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setGeneratedResult(null);
    setGenerationLogs([]);

    const log = (msg: string) => {
      setGenerationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`🚀 بدء عملية التوليد لقاعدة بيانات من نوع (${targetDbType.toUpperCase()})`);
    log(`🔗 تسلسل التنقل والوكلاء النشطين: ${providerSequence.join(" ➔ ")}`);

    try {
      // Step through active providers in sequence to check if they have keys configured
      const requestKeys: Record<string, string> = {};
      providerSequence.forEach(provider => {
        if (aiKeys[provider as keyof typeof aiKeys]) {
          requestKeys[provider] = aiKeys[provider as keyof typeof aiKeys];
        }
      });

      log(`📡 جاري إرسال الطلب إلى السيرفر لتمريره إلى الوكلاء بالترتيب...`);

      const response = await fetch("/api/generate-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          dbType: targetDbType,
          providers: providerSequence,
          keys: requestKeys
        })
      });

      const data = await response.json();

      if (data.attempts) {
        data.attempts.forEach((attempt: any) => {
          if (attempt.status === "success") {
            log(`✅ نجح الوكيل [${attempt.provider.toUpperCase()}] في توليد الكود بنجاح.`);
          } else {
            log(`❌ فشل الوكيل [${attempt.provider.toUpperCase()}]: ${attempt.error || "خطأ غير معروف"}`);
            log(`🔄 جاري الانتقال التلقائي للوكيل التالي في تسلسل الاحتياط...`);
          }
        });
      }

      if (response.ok && data.success) {
        setGeneratedResult(data);
        log(`🎉 اكتمل التوليد بنجاح عبر الوكيل: ${data.provider.toUpperCase()}`);
      } else {
        setGeneratedResult({ success: false, attempts: data.attempts });
        log(`🚨 فشلت جميع المحاولات! يرجى التحقق من مفاتيح الـ API المزودة وصلاحية الرصيد.`);
      }
    } catch (error: any) {
      console.error(error);
      log(`🚨 خطأ في الاتصال بالسيرفر: ${error.message || String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const moveProviderUp = (index: number) => {
    if (index === 0) return;
    const newSeq = [...providerSequence];
    const temp = newSeq[index];
    newSeq[index] = newSeq[index - 1];
    newSeq[index - 1] = temp;
    saveSequenceToStorage(newSeq);
  };

  const moveProviderDown = (index: number) => {
    if (index === providerSequence.length - 1) return;
    const newSeq = [...providerSequence];
    const temp = newSeq[index];
    newSeq[index] = newSeq[index + 1];
    newSeq[index + 1] = temp;
    saveSequenceToStorage(newSeq);
  };

  const filtered = databases.filter(db => {
    const matchesSearch =
      db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.dbName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = providerFilter === "all" || db.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  // Stats calculation
  const totalDbs = databases.length;
  const fullDbs = databases.filter(d => (d.usedStorageMB / d.maxStorageMB) >= 0.95).length;
  const warningDbs = databases.filter(d => {
    const ratio = d.usedStorageMB / d.maxStorageMB;
    return ratio >= 0.8 && ratio < 0.95;
  }).length;
  const totalStorageUsed = databases.reduce((acc, d) => acc + d.usedStorageMB, 0);
  const totalStorageCapacity = databases.reduce((acc, d) => acc + d.maxStorageMB, 0);
  const overallUsagePercent = totalStorageCapacity > 0 ? (totalStorageUsed / totalStorageCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("monitor")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "monitor"
              ? "border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Database size={16} />
          <span>قواعد البيانات النشطة والمراقبة</span>
        </button>
        <button
          onClick={() => setActiveTab("ai-agent")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "ai-agent"
              ? "border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Cpu size={16} />
          <span>مساعد SQL والوكلاء الذكيون (Failover)</span>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-1.5 py-0.5 rounded-full">واقعي 100%</span>
        </button>
      </div>

      {activeTab === "monitor" ? (
        <>
          {/* Header and Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Database className="text-[var(--color-neon-cyan)] animate-pulse" size={26} />
                <span>نظام مراقبة وإدارة قواعد البيانات</span>
              </h2>
              <p className="text-gray-400 mt-1">تابع قواعد بياناتك المجانية النشطة على الإنترنت، وحجم التخزين الفعلي، والبيانات والجدوال المحفوظة داخلها</p>
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              {/* Provider Filter */}
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] cursor-pointer"
              >
                <option value="all">كل المزودين</option>
                <option value="supabase">Supabase</option>
                <option value="firebase">Firebase</option>
                <option value="neon">Neon (Postgres)</option>
                <option value="mongodb">MongoDB Atlas</option>
                <option value="upstash">Upstash (Redis)</option>
                <option value="planetscale">PlanetScale</option>
                <option value="cockroach">CockroachDB</option>
                <option value="other">أخرى</option>
              </select>

              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="بحث باسم قاعدة البيانات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-card border border-white/10 rounded-lg py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
                />
                <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
              </div>

              {/* Add DB Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,255,255,0.1)] hover:bg-[rgba(0,255,255,0.2)] text-[var(--color-neon-blue)] rounded-lg transition-colors text-sm font-semibold border border-[rgba(0,255,255,0.2)] cursor-pointer"
              >
                <Plus size={16} />
                <span>تسجيل قاعدة بيانات</span>
              </button>
            </div>
          </div>

          {/* Stats Summary Panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-xl border border-white/10 flex items-center gap-4">
              <div className="p-3 bg-[rgba(0,240,255,0.1)] rounded-lg text-[var(--color-neon-cyan)]">
                <Database size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400">إجمالي قواعد البيانات</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{totalDbs}</h3>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-white/10 flex items-center gap-4">
              <div className="p-3 bg-[rgba(57,255,20,0.1)] rounded-lg text-[var(--color-neon-green)]">
                <HardDrive size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">حجم الاستهلاك الكلي</p>
                <div className="flex justify-between items-baseline mt-0.5">
                  <h3 className="text-lg font-bold text-white">
                    {totalStorageUsed.toFixed(1)} <span className="text-xs text-gray-400">ميجابايت</span>
                  </h3>
                  <span className="text-xs text-gray-400">من {totalStorageCapacity} MB</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-[var(--color-neon-green)] h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, overallUsagePercent)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-orange-500/20 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400">قواعد شارفت على الامتلاء</p>
                <h3 className="text-xl font-bold text-orange-400 mt-0.5">{warningDbs} <span className="text-xs text-gray-400 font-normal">(&gt; 80%)</span></h3>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-red-500/20 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                <AlertTriangle className="animate-bounce" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400">قواعد ممتلئة تماماً</p>
                <h3 className="text-xl font-bold text-red-400 mt-0.5">{fullDbs} <span className="text-xs text-gray-400 font-normal">(&gt; 95%)</span></h3>
              </div>
            </div>
          </div>

          {/* Add Database Form Collapsible */}
          {showAddForm && (
            <div className="glass border border-[var(--color-neon-blue)] rounded-2xl p-6 relative shadow-2xl animate-in slide-in-from-top duration-300">
              <button
                onClick={() => setShowAddForm(false)}
                className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Database className="text-[var(--color-neon-cyan)]" size={20} />
                <span>تسجيل ومراقبة قاعدة بيانات حقيقية جديدة</span>
              </h3>

              <form onSubmit={handleAddDatabase} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Database custom name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">الاسم التعريفي لقاعدة البيانات</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: تطبيق المتجر - الإنتاج"
                      value={newDb.name}
                      onChange={e => setNewDb(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
                    />
                  </div>

                  {/* Provider Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">مزود الخدمة (سحابي مجاني)</label>
                    <select
                      value={newDb.provider}
                      onChange={e => setNewDb(prev => ({ ...prev, provider: e.target.value as CloudDatabase["provider"] }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] cursor-pointer"
                    >
                      <option value="supabase">Supabase (500MB Free)</option>
                      <option value="firebase">Firebase Firestore (1GB Free)</option>
                      <option value="neon">Neon Serverless Postgres (500MB Free)</option>
                      <option value="mongodb">MongoDB Atlas (512MB Free)</option>
                      <option value="upstash">Upstash Serverless Redis (256MB/10K requests)</option>
                      <option value="planetscale">PlanetScale MySQL</option>
                      <option value="cockroach">CockroachDB Serverless</option>
                      <option value="other">أخرى / مخصص</option>
                    </select>
                  </div>

                  {/* Exact Database Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">اسم قاعدة البيانات الفرعي (Schema/Db Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: custom_shop_db"
                      value={newDb.dbName}
                      onChange={e => setNewDb(prev => ({ ...prev, dbName: e.target.value }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Connection String */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">رابط الاتصال (Connection String) أو مفتاح الـ API</label>
                    <input
                      type="text"
                      required
                      placeholder="postgresql://username:password@hostname:port/dbname"
                      value={newDb.connectionString}
                      onChange={e => setNewDb(prev => ({ ...prev, connectionString: e.target.value }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* Tags and Custom Labels */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">الوسوم والكلمات الدلالية (مفصولة بفاصلة)</label>
                    <input
                      type="text"
                      placeholder="مثال: users, production, static"
                      value={newDb.tagsString}
                      onChange={e => setNewDb(prev => ({ ...prev, tagsString: e.target.value }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Max Free Storage Limit */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">الحد الأقصى للتخزين المجاني (MB)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newDb.maxStorageMB}
                      onChange={e => setNewDb(prev => ({ ...prev, maxStorageMB: Number(e.target.value) }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] text-left"
                      dir="ltr"
                    />
                  </div>

                  {/* Database Credentials (Username) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">اسم المستخدم (اختياري)</label>
                    <input
                      type="text"
                      placeholder="admin / postgres"
                      value={newDb.username}
                      onChange={e => setNewDb(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* Database Credentials (Password) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">كلمة المرور (اختياري)</label>
                    <input
                      type="password"
                      placeholder="كلمة مرور سرية"
                      value={newDb.password}
                      onChange={e => setNewDb(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] text-left"
                      dir="ltr"
                    />
                  </div>

                  {/* Current Storage Used */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">المساحة المستخدمة البدئية (MB)</label>
                    <input
                      type="number"
                      min="0"
                      value={newDb.usedStorageMB}
                      onChange={e => setNewDb(prev => ({ ...prev, usedStorageMB: Number(e.target.value) }))}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Sub-Tables/Collections Management */}
                <div className="bg-slate-900/40 rounded-xl p-4 border border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers size={16} className="text-[var(--color-neon-cyan)]" />
                    <span>الجداول / المجموعات المحفوظة وتفاصيلها بالتفصيل (Schema tables)</span>
                  </h4>

                  {/* Add Table fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">اسم الجدول/المجموعة</label>
                      <input
                        type="text"
                        placeholder="مثال: users / articles"
                        value={tempTable.name}
                        onChange={e => setTempTable(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">عدد السجلات (Records)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="1200"
                        value={tempTable.recordsCount || ""}
                        onChange={e => setTempTable(prev => ({ ...prev, recordsCount: Number(e.target.value) }))}
                        className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">المساحة المستهلكة (MB)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="15"
                        value={tempTable.sizeMB || ""}
                        onChange={e => setTempTable(prev => ({ ...prev, sizeMB: Number(e.target.value) }))}
                        className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] text-gray-400 mb-1">وصف البيانات المحفوظة</label>
                        <input
                          type="text"
                          placeholder="بيانات ملفات المستخدمين..."
                          value={tempTable.description}
                          onChange={e => setTempTable(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTableToForm}
                        className="bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-cyan)] border border-[rgba(0,255,255,0.2)] hover:bg-[rgba(0,255,255,0.2)] px-3 py-1.5 rounded-lg text-xs font-semibold h-9 cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>

                  {/* Display added tables in new database */}
                  {newDb.tables.length > 0 ? (
                    <div className="overflow-x-auto border border-white/5 rounded-lg">
                      <table className="w-full text-xs text-right text-gray-300">
                        <thead className="bg-white/5 text-gray-400">
                          <tr>
                            <th className="py-2 px-3">اسم الجدول</th>
                            <th className="py-2 px-3">عدد السجلات</th>
                            <th className="py-2 px-3">الحجم (MB)</th>
                            <th className="py-2 px-3">الوصف</th>
                            <th className="py-2 px-3 text-center">حذف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {newDb.tables.map((tbl, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2 px-3 font-mono text-[var(--color-neon-cyan)]">{tbl.name}</td>
                              <td className="py-2 px-3">{tbl.recordsCount.toLocaleString()} سجل</td>
                              <td className="py-2 px-3">{tbl.sizeMB} MB</td>
                              <td className="py-2 px-3 text-gray-400">{tbl.description}</td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTableFromForm(idx)}
                                  className="text-red-400 hover:text-red-500 p-1 cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">لم تقم بإضافة جداول/مجموعات فرعية بعد. أضفها في الحقول أعلاه لتظهر هنا.</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">ملاحظات وتعليمات هامة لقاعدة البيانات</label>
                  <textarea
                    rows={2}
                    placeholder="تفاصيل إضافية مثل: فترات النسخ الاحتياطي التلقائي، حسابات المشرفين، مفاتيح الوصول ومسارات التطبيقات المرتبطة بها..."
                    value={newDb.notes}
                    onChange={e => setNewDb(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[var(--color-neon-blue)] hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-sm cursor-pointer"
                  >
                    حفظ وتسجيل قاعدة البيانات
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid List of Databases */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filtered.map(db => {
                const usagePercent = Math.min(100, (db.usedStorageMB / db.maxStorageMB) * 100);
                const isCritical = usagePercent >= 95;
                const isWarning = usagePercent >= 80 && usagePercent < 95;
                
                let statusColor = "bg-[var(--color-neon-green)]";
                let textColor = "text-[var(--color-neon-green)]";
                let borderColor = "border-white/10 hover:border-white/20";
                
                if (isCritical) {
                  statusColor = "bg-red-500 animate-pulse";
                  textColor = "text-red-400";
                  borderColor = "border-red-500/30 hover:border-red-500/50";
                } else if (isWarning) {
                  statusColor = "bg-orange-500";
                  textColor = "text-orange-400";
                  borderColor = "border-orange-500/30 hover:border-orange-500/50";
                }

                return (
                  <div 
                    key={db.id} 
                    className={`glass rounded-2xl p-6 border ${borderColor} transition-all duration-300 relative group flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <Database className="text-[var(--color-neon-cyan)]" size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-white leading-tight">{db.name}</h3>
                              {isCritical && (
                                <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  ممتلئة!
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-mono">
                              <span className="text-[var(--color-neon-cyan)] uppercase font-semibold">{db.provider}</span>
                              <span>•</span>
                              <span>{db.dbName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleShowQR(db)}
                            className="p-1.5 text-gray-400 hover:text-[var(--color-neon-cyan)] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            title="مسح رمز الـ QR بالهاتف المحمول"
                          >
                            <QrCode size={18} />
                          </button>
                          <button
                            onClick={() => handleCopy(db.id, db.connectionString)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative cursor-pointer"
                            title="نسخ رابط الاتصال"
                          >
                            {copiedId === db.id ? (
                              <Check size={18} className="text-[var(--color-neon-green)]" />
                            ) : (
                              <Copy size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteDatabase(db.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            title="حذف قاعدة البيانات"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Storage indicator gauge */}
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-4">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-gray-400 font-semibold">حالة استهلاك مساحة التخزين</span>
                          <span className={`font-semibold ${textColor}`}>{usagePercent.toFixed(1)}%</span>
                        </div>

                        {/* Linear Gauge Progress */}
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${statusColor}`} 
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1.5 font-mono">
                          <span>{db.usedStorageMB.toFixed(1)} MB مستخدم</span>
                          <span>سعة {db.maxStorageMB} MB قصوى</span>
                        </div>

                        {/* Interactive storage override (simulation for real-time monitoring) */}
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5 justify-between">
                          <span className="text-[10px] text-gray-500">تحديث الاستهلاك الحالي يدوياً:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max={db.maxStorageMB}
                              value={db.usedStorageMB}
                              onChange={(e) => handleUpdateStorage(db.id, Number(e.target.value))}
                              className="w-24 accent-[var(--color-neon-cyan)] cursor-pointer"
                            />
                            <span className="text-[11px] font-mono text-gray-300">{Math.round(db.usedStorageMB)} MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Connection Credentials summary */}
                      <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-4 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">رابط الاتصال السري (مشفر محلياً):</span>
                          <span className="text-[10px] bg-white/5 text-gray-300 font-mono py-0.5 px-2 rounded border border-white/5">
                            {db.provider.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-mono text-gray-300 select-all overflow-x-auto whitespace-nowrap text-left scrollbar-thin py-1" dir="ltr">
                          {db.connectionString}
                        </p>
                        {db.username && (
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
                            <div>
                              <span>المستخدم: </span>
                              <span className="text-gray-300 font-mono select-all" dir="ltr">{db.username}</span>
                            </div>
                            {db.password && (
                              <div className="text-left">
                                <span>كلمة المرور: </span>
                                <span className="text-gray-300 font-mono select-all">••••••••</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Schema Internal Tables */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                          <Layers size={14} className="text-cyan-400" />
                          <span>المحفوظات بالتفصيل ({db.tables.length} جداول/مجموعات فرعية)</span>
                        </h4>

                        {db.tables.length > 0 ? (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                            {db.tables.map((table, idx) => (
                              <div 
                                key={idx}
                                className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-2.5 rounded-lg border border-white/5 transition-colors text-xs"
                              >
                                <div className="flex flex-col gap-0.5 min-w-[120px]">
                                  <span className="font-mono text-[var(--color-neon-cyan)] font-bold truncate">{table.name}</span>
                                  <span className="text-[10px] text-gray-400 truncate">{table.description || "لا يوجد وصف"}</span>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                  <div className="text-right">
                                    <p className="text-gray-300 font-semibold">{table.recordsCount.toLocaleString()}</p>
                                    <p className="text-[9px] text-gray-400 font-medium">سجل</p>
                                  </div>
                                  <div className="text-left font-mono">
                                    <p className="text-gray-300 font-semibold">{table.sizeMB}</p>
                                    <p className="text-[9px] text-gray-400 font-medium">MB</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">لا توجد جداول أو مجموعات فرعية مسجلة حالياً لهذه الخدمة.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Extra Notes & Tags */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      {db.notes && (
                        <p className="text-xs text-gray-400 leading-relaxed mb-3 italic">
                          💡 {db.notes}
                        </p>
                      )}
                      {db.tags && db.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {db.tags.map((tag, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] bg-slate-800/80 text-cyan-300 border border-cyan-500/10 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass border border-dashed border-white/10 rounded-2xl p-12 text-center">
              <Database size={48} className="mx-auto text-gray-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-white mb-2">لا توجد قواعد بيانات مسجلة</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                سجل قواعد بياناتك السحابية المجانية (Supabase, Firebase, Neon, MongoDB, Redis) لمراقبة نسب الامتلاء وعدد السجلات بسهولة فائقة.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2.5 bg-[var(--color-neon-blue)] hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-sm cursor-pointer"
              >
                إضافة أول قاعدة بيانات مجانية الآن
              </button>
            </div>
          )}

          {/* Embedded Guide explaining Free Cloud Databases on Internet */}
          <div className="glass border border-[var(--color-neon-blue)]/20 rounded-2xl p-6 bg-slate-900/30">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} size={18} />
              <span>دليلك إلى قواعد البيانات السحابية المجانية المتاحة على الإنترنت</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-gray-300">
              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                  <span>Supabase (PostgreSQL)</span>
                </h4>
                <p className="leading-relaxed text-gray-400">
                  بديل قوي جداً ومفتوح المصدر لـ Firebase. يوفر خادم PostgreSQL حقيقي مع واجهة ويب جميلة لإدارة الجداول ومجموعات الأمان والتحقق.
                </p>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-400 pl-2">
                  <li>السعة المجانية: 500 ميجابايت</li>
                  <li>الحد الأقصى: مشروعين نشطين</li>
                  <li>الربط: ممتاز مع React و Node.js</li>
                </ul>
              </div>

              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                  <span>Neon Tech (Serverless Postgres)</span>
                </h4>
                <p className="leading-relaxed text-gray-400">
                  خادم Postgres سحابي مبتكر يتميز بخاصية الإغلاق التلقائي عند عدم وجود تصفح لتقليل التكاليف ومزامنة الفروع البرمجية بشكل فوري.
                </p>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-400 pl-2">
                  <li>السعة المجانية: 500 ميجابايت</li>
                  <li>الميزات: إمكانية تفرع البيانات (Branching)</li>
                  <li>الربط: مثالي لـ Next.js و C# و Node</li>
                </ul>
              </div>

              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
                  <span>Firebase (NoSQL Firestore)</span>
                </h4>
                <p className="leading-relaxed text-gray-400">
                  الخدمة الشهيرة من جوجل التي تتيح مزامنة البيانات في الوقت الفعلي ومصممة للتطبيقات سريعة الاستجابة للهواتف والمتصفح.
                </p>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-400 pl-2">
                  <li>السعة المجانية: 1 جيجابايت</li>
                  <li>الميزات: مزامنة فورية (Real-time sync)</li>
                  <li>الربط: ممتاز لتطبيقات المحادثة المباشرة</li>
                </ul>
              </div>

              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  <span>MongoDB Atlas (NoSQL Document)</span>
                </h4>
                <p className="leading-relaxed text-gray-400">
                  قاعدة بيانات NoSQL الرائدة التي تحفظ البيانات على هيئة مستندات شبيهة بـ JSON. مثالية للنماذج البرمجية والمشاريع المتغيرة باستمرار.
                </p>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-400 pl-2">
                  <li>السعة المجانية: 512 ميجابايت</li>
                  <li>الميزات: مرونة هائلة وتغيير لحظي لتركيبة الحقول</li>
                  <li>الربط: ركيزة أساسية لمطوري Node/MERN Stack</li>
                </ul>
              </div>

              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                  <span>Upstash (Serverless Redis)</span>
                </h4>
                <p className="leading-relaxed text-gray-400">
                  قاعدة بيانات سريعة للغاية تعمل في الذاكرة ومثالية لحفظ الكاش، والحد من الاستخدام الزائد للـ API، وإدارة الجلسات السريعة.
                </p>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-400 pl-2">
                  <li>السعة المجانية: 256 ميجابايت أو 10 آلاف طلب يومياً</li>
                  <li>الميزات: سرعة استجابة ميكروثانية فائقة</li>
                  <li>الربط: رائع مع Serverless Edge functions</li>
                </ul>
              </div>

              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                <Sparkles className="text-[var(--color-neon-blue)] animate-bounce mb-2" size={24} />
                <h5 className="font-bold text-white">إدارة ذكية ومحمية محلياً</h5>
                <p className="text-[11px] text-gray-400 leading-relaxed px-2">
                  كل الروابط وكلمات المرور مشفرة تماماً ومحفوظة على جهازك بشكل آمن ولا تمر عبر خوادم وسيطة لحماية معلومات المطورين الحساسة.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* SQL AI Agent Generator Tab with Automatic Failover */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Settings & Configuration Panel (Col 1) */}
          <div className="space-y-6">
            <div className="glass p-5 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                <Key className="text-[var(--color-neon-purple)]" size={18} />
                <span>مفاتيح الـ API السرية</span>
              </h3>
              
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
                <p className="text-[11px] text-orange-400 leading-relaxed">
                  ⚠️ <strong>ملاحظة هامة:</strong> لتفعيل التوليد الحقيقي والوكلاء بالكامل، يرجى ملء مفاتيحك الخاصة أدناه. يتم تخزينها في متصفحك محلياً ولا تُرسل لأي طرف ثالث خارجي.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AI Studio / Google Cloud Key"
                    value={aiKeys.gemini}
                    onChange={e => saveKeysToStorage({ ...aiKeys, gemini: e.target.value })}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white text-left font-mono"
                    dir="ltr"
                  />
                  <p className="text-[9px] text-gray-500 mt-0.5">إذا تُرك فارغاً، سيتم استخدام مفتاح السيرفر الافتراضي لـ Gemini.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold">Groq API Key</label>
                  <input
                    type="password"
                    placeholder="gsk_************************"
                    value={aiKeys.groq}
                    onChange={e => saveKeysToStorage({ ...aiKeys, groq: e.target.value })}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold">OpenAI API Key</label>
                  <input
                    type="password"
                    placeholder="sk-proj-************************"
                    value={aiKeys.openai}
                    onChange={e => saveKeysToStorage({ ...aiKeys, openai: e.target.value })}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold">Kimi / Moonshot API Key</label>
                  <input
                    type="password"
                    placeholder="sk-************************"
                    value={aiKeys.kimi}
                    onChange={e => saveKeysToStorage({ ...aiKeys, kimi: e.target.value })}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* AI Fallback Sequence / Failover Manager */}
            <div className="glass p-5 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <ArrowRightLeft className="text-[var(--color-neon-cyan)]" size={18} />
                <span>تسلسل التبديل التلقائي (Failover)</span>
              </h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                حدد تسلسل الأولوية للوكلاء. في حال حدوث خطأ أو انتهاء الرصيد بالوكيل الأعلى، سيتحول النظام للوكيل الذي يليه تلقائياً.
              </p>

              <div className="space-y-2">
                {providerSequence.map((provider, idx) => {
                  const hasKey = provider === "gemini" || aiKeys[provider as keyof typeof aiKeys];
                  return (
                    <div 
                      key={provider}
                      className="flex items-center justify-between bg-black/30 border border-white/5 p-2.5 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-400">#{idx + 1}</span>
                        <span className="uppercase font-bold text-white font-mono">{provider}</span>
                        {hasKey ? (
                          <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                            مُهيّأ
                          </span>
                        ) : (
                          <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                            فارغ (مُتجاوز)
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => moveProviderUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-white bg-white/5 disabled:opacity-30 rounded cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveProviderDown(idx)}
                          disabled={idx === providerSequence.length - 1}
                          className="p-1 text-gray-400 hover:text-white bg-white/5 disabled:opacity-30 rounded cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generator Interface (Col 2 & 3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-400 animate-pulse" size={20} />
                <span>مساعد الوكلاء الفائق لتوليد وتصميم قواعد البيانات</span>
              </h3>
              <p className="text-gray-400 text-xs mb-6">
                اكتب فكرتك وتطبيقك باللغة الطبيعية، وسيقوم الوكيل الذكي بكتابة الأكواد والـ SQL والتركيبات الكاملة ويزودك بالتعليمات الدقيقة والبيانات التجريبية لتشغيلها.
              </p>

              <div className="space-y-4">
                {/* Select DB Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">نظام قاعدة البيانات المستهدف (Database Engine)</label>
                  <select
                    value={targetDbType}
                    onChange={e => setTargetDbType(e.target.value)}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] cursor-pointer"
                  >
                    <option value="postgresql">Supabase / Neon / Postgres (SQL كامل)</option>
                    <option value="mongodb">MongoDB Atlas (كود وجداول NoSQL JSON)</option>
                    <option value="firebase">Firebase Firestore Collections & Rules (NoSQL)</option>
                    <option value="mysql">PlanetScale / MySQL DDL Schema</option>
                    <option value="redis">Upstash / Redis Key-Value Schema structure</option>
                  </select>
                </div>

                {/* Prompt Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">وصف هيكلية قاعدة البيانات والبيانات المطلوب حفظها</label>
                  <textarea
                    rows={5}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="مثال: نظام متجر إلكتروني متكامل يحتوي على جدول مستخدمين، منشورات، تعليقات، طلبات شراء، وعلاقات مفاتيح أجنبية وعدادات للتخزين، مع بيانات تجريبية واضحة لإظهار محتويات قاعدة البيانات بالتفصيل."
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)] leading-relaxed"
                  />
                </div>

                {/* Generate Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGenerateSQL}
                    disabled={isGenerating || !aiPrompt}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--color-neon-blue)] text-black hover:bg-cyan-400 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>جاري توليد الكود والتبديل بين الوكلاء...</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="black" />
                        <span>توليد كود قاعدة البيانات الحقيقي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Generation Terminal / Live Logs Console */}
            {(isGenerating || generationLogs.length > 0) && (
              <div className="glass p-5 rounded-2xl border border-white/10 bg-black/60 font-mono text-xs">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-xs border-b border-white/5 pb-2">
                  <Terminal size={14} className="text-green-400 animate-pulse" />
                  <span>كونسول تتبع اتصالات الوكلاء التلقائي (Automatic Failover Logs)</span>
                </h4>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-left select-text scrollbar-thin" dir="ltr">
                  {generationLogs.map((log, i) => (
                    <p key={i} className="text-green-400 leading-relaxed whitespace-pre-wrap">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Output result */}
            {generatedResult && (
              <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Check className="text-[var(--color-neon-green)]" size={18} />
                      <span>الكود الفعلي المولد جاهز للاستخدام</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      تم التوليد بنجاح بواسطة الوكيل: <span className="text-[var(--color-neon-cyan)] uppercase font-bold font-mono">{generatedResult.provider}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy("result", generatedResult.sql || "")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
                    >
                      {copiedId === "result" ? (
                        <>
                          <Check size={14} className="text-[var(--color-neon-green)]" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>نسخ الكود</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([generatedResult.sql || ""], { type: "text/plain" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `database-schema-${targetDbType}.sql`;
                        link.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                      <span>حفظ كملف</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Display */}
                <div className="text-xs text-gray-300 leading-relaxed space-y-4 bg-slate-900/40 border border-white/5 rounded-xl p-5 overflow-x-auto text-right" dir="rtl">
                  <div className="whitespace-pre-wrap font-sans">
                    {generatedResult.sql}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Scan Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        text={qrModalData.text}
        title={qrModalData.title}
        category={qrModalData.category}
      />
    </div>
  );
}
