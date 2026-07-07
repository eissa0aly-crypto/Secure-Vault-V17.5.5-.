import React, { useState, useEffect, useRef } from "react";
import { getCollection, addItem, deleteItem } from "../lib/db";
import { AIAgent, Credential } from "../types";
import { decryptText } from "../lib/crypto";
import {
  Search,
  ExternalLink,
  Bot,
  CheckCircle2,
  Star,
  ShieldAlert,
  Plus,
  X,
  MessageSquare,
  Music,
  Film,
  Image as ImageIcon,
  Send,
  Sparkles,
  Cpu,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Play,
  Pause,
  Sliders,
  Paintbrush,
  AlertCircle,
  Video
} from "lucide-react";
import CustomFieldsEditor from '../components/CustomFieldsEditor';

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', provider: '', url: '', modelName: '', apiKey: '', customFields: [] });
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"directory" | "studio">("studio");
  const [studioSubTab, setStudioSubTab] = useState<"chat" | "music" | "video" | "image">("chat");

  // --- STATE 1: CHAT AGENT ---
  const [chatModel, setChatModel] = useState("free-chat");
  const [systemPreset, setSystemPreset] = useState("general");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCopiedId, setChatCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- CREDENTIALS INTEG STATE ---
  const [storedKeys, setStoredKeys] = useState<Record<string, { key: string; name: string; id: string }>>({});
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);

  const loadStoredKeys = async () => {
    try {
      const creds = getCollection<Credential>("credentials");
      const foundKeys: Record<string, { key: string; name: string; id: string }> = {};
      
      for (const cred of creds) {
        const nameLower = (cred.name || "").toLowerCase();
        const catLower = (cred.category || "").toLowerCase();
        
        let providerKey = "";
        if (nameLower.includes("groq") || catLower.includes("groq")) {
          providerKey = "groq";
        } else if (nameLower.includes("kimi") || nameLower.includes("moonshot") || catLower.includes("kimi") || catLower.includes("moonshot")) {
          providerKey = "kimi";
        } else if (nameLower.includes("openai") || catLower.includes("openai")) {
          providerKey = "openai";
        } else if (nameLower.includes("gemini") || catLower.includes("gemini")) {
          providerKey = "gemini";
        } else if (nameLower.includes("openrouter") || catLower.includes("openrouter")) {
          providerKey = "openrouter";
        }
        
        if (providerKey) {
          try {
            const decrypted = await decryptText(cred.token);
            foundKeys[providerKey] = {
              key: decrypted,
              name: cred.name,
              id: cred.id
            };
          } catch (e) {
            console.error("Failed to decrypt stored credential", e);
          }
        }
      }
      setStoredKeys(foundKeys);
    } catch (err) {
      console.error("Failed loading stored keys", err);
    }
  };

  const presetsInstructions: Record<string, string> = {
    general: "أنت مساعد ذكي ومتعاون وخبير برمجي شامل تجيب بدقة عالية وباللغة العربية الفصحى المبسطة.",
    coder: "أنت خبير هندسة برمجيات ومراجع كود متمرس. قم بتحليل الأخطاء وكتابة أكواد نظيفة وآمنة بلغة TypeScript وReact وقواعد البيانات مع شرح منطقي مبسط.",
    copywriter: "أنت كاتب محتوى إبداعي ومسوق رقمي متميز. قم بصياغة مقالات جذابة ومنشورات ترويجية تلفت الأنظار وتدعم محركات البحث SEO.",
    translator: "أنت مترجم فوري لغوي محترف. ترجم النصوص بدقة متناهية مع الحفاظ على السياق اللغوي والثقافي بين اللغات المختلفة."
  };

  // --- STATE 2: MUSIC STUDIO ---
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicModel, setMusicModel] = useState("lyria-3-clip-preview");
  const [musicImgBase64, setMusicImgBase64] = useState<string>("");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<{
    audioUrl: string;
    lyrics: string;
    mimeType: string;
  } | null>(null);

  // --- STATE 3: MOVIE & VIDEO MAKER ---
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [videoStartImg, setVideoStartImg] = useState<string>("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoOpName, setVideoOpName] = useState("");
  const [videoProgressMsg, setVideoProgressMsg] = useState("");
  const [videoProgressPercent, setVideoProgressPercent] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [videoError, setVideoError] = useState("");

  const progressSteps = [
    { percent: 15, text: "🔍 جاري قراءة وتخيل المشهد النصي وتوزيع الألوان السينمائية..." },
    { percent: 40, text: "🎥 جاري تحريك زوايا الكاميرا وحساب المتجهات الفيزيائية للإضاءة..." },
    { percent: 65, text: "⚡ جاري رندرة الإطارات الفردية بدقة فائقة وتطبيق الظلال الواقعية..." },
    { percent: 85, text: "⚙️ جاري دمج وتشفير ملف الـ MP4 النهائي وبث البكسلات السحابية..." }
  ];

  // --- STATE 4: IMAGE STUDIO ---
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgAspectRatio, setImgAspectRatio] = useState("1:1");
  const [imgSize, setImgSize] = useState("1K");
  const [imgModel, setImgModel] = useState("free-image");
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string>("");
  const [imgError, setImgError] = useState("");
  const [musicError, setMusicError] = useState("");
  const [editImgError, setEditImgError] = useState("");
  
  const isPaidOrQuotaError = (errMsg: string) => {
    if (!errMsg) return false;
    const lower = errMsg.toLowerCase();
    return lower.includes("quota") || lower.includes("exhausted") || lower.includes("429") || lower.includes("billing") || lower.includes("payment") || lower.includes("rate limit") || lower.includes("limit: 0");
  };

  const renderErrorState = (errMsg: string) => {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-right space-y-3 max-w-md mx-auto">
        <div className="flex items-start gap-2.5 text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">فشل الطلب السحابي:</p>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">{errMsg}</p>
          </div>
        </div>
        
        {isPaidOrQuotaError(errMsg) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2 text-xs text-amber-300">
            <p className="font-bold flex items-center gap-1">
              <Sparkles size={14} className="text-amber-400" />
              <span>ملاحظة حول الحساب والمفاتيح السحابية:</span>
            </p>
            <p className="leading-relaxed text-gray-200">
              توليد الصور، الأفلام، والموسيقى بدقة فائقة يتطلب مفتاح API مدفوع مفعل الفوترة فيه (Paid Billing) من Google AI Studio، حيث أن حد الاستخدام المجاني لهذه الموديلات مغلق افتراضياً.
            </p>
            <p className="text-[11px] text-gray-400">
              لقد قمنا بتشغيل إعدادات الدفع لفتح هذه الخدمات لك. يرجى تفعيل مفتاح الدفع المخصص السحابي من المنصة للاستخدام الفوري.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Image Edit State
  const [isEditingImg, setIsEditingImg] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editSourceImg, setEditSourceImg] = useState("");
  const [editedResultImg, setEditedResultImg] = useState("");

  useEffect(() => {
    setAgents(getCollection<AIAgent>("ai_agents"));
    loadStoredKeys();
    
    // Welcome message for chat
    setChatHistory([
      {
        id: "welcome",
        role: "model",
        text: "مرحباً بك! أنا وكيلك الذكي المتكامل. كيف يمكنني مساعدتك اليوم؟ يمكنني كتابة كود برمجى، ترجمة نصوص، أو إعداد خطط عمل. يمكنك أيضاً استخدام التبويبات الجانبية لصناعة الموسيقى والأفلام والصور الواقعية 100%!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle Agents Directory CRUD
  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    addItem('ai_agents', { ...newAgent, status: 'active', isFavorite: false });
    setAgents(getCollection('ai_agents'));
    setShowAddForm(false);
    setNewAgent({ name: '', provider: '', url: '', modelName: '', apiKey: '', customFields: [] });
  };

  const handleDeleteAgent = (id: string) => {
    if (window.confirm("هل تريد حذف هذا الوكيل من القائمة بالفعل؟")) {
      deleteItem('ai_agents', id);
      setAgents(getCollection('ai_agents'));
    }
  };

  const handleSaveCustomKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      let credName = "";
      if (chatModel === "groq") credName = "Groq Cloud API Key";
      else if (chatModel === "kimi") credName = "Kimi Moonshot API Key";
      else if (chatModel === "openai") credName = "OpenAI Production Key";
      else if (chatModel === "openrouter") credName = "OpenRouter API Key";
      else if (chatModel === "gemini-custom") credName = "Custom Gemini Studio Key";
      
      const credData = {
        name: credName,
        token: customKeyInput.trim(),
        category: "ذكاء اصطناعي",
        subcategory: chatModel,
        description: `مفتاح API خاص بوكيل ${chatModel} المدمج`,
        expiryDate: "",
        isFavorite: true,
        isPinned: true,
        status: "active" as const,
        tags: ["ai", chatModel],
        lastUsed: null,
        usageCount: 0,
        notes: "تم التنشيط والربط التلقائي عبر صفحة وكلاء الذكاء الاصطناعي",
        customFields: []
      };
      
      await addItem("credentials", credData);
      await loadStoredKeys();
      setCustomKeyInput("");
      alert("تم حفظ وتنشيط المفتاح بنجاح! الوكيل متاح للاستخدام الآن.");
    } catch (err: any) {
      alert("حدث خطأ أثناء حفظ المفتاح: " + err.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.provider.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- ACTIONS 1: CHAT AGENT ---
  const handleSendChatMessage = async () => {
    if (!chatPrompt.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: chatPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatPrompt("");
    setIsChatLoading(true);

    try {
      // Map history to server payload format
      const serverMessages = chatHistory.concat(userMsg).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      let providerName: string | undefined = undefined;
      let customApiKey: string | undefined = undefined;

      if (["groq", "kimi", "openai", "openrouter", "gemini-custom"].includes(chatModel)) {
        providerName = chatModel;
        const matchingKey = storedKeys[chatModel];
        if (!matchingKey) {
          throw new Error(`يرجى إدخال وحفظ مفتاح API الخاص بـ ${chatModel} أولاً لتفعيل هذا الوكيل.`);
        }
        customApiKey = matchingKey.key;
      }

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: serverMessages,
          systemInstruction: presetsInstructions[systemPreset],
          model: chatModel,
          provider: providerName,
          customApiKey: customApiKey
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const modelMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "model",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, modelMsg]);
      } else {
        throw new Error(data.error || "فشل الاتصال بالوكيل الذكي");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: `🚨 خطأ: ${err.message || "لا يمكن إرسال الرسالة للوكيل السحابي في الوقت الحالي. تحقق من إعدادات المفتاح السري."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyChatText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setChatCopiedId(id);
    setTimeout(() => setChatCopiedId(null), 2000);
  };

  // --- ACTIONS 2: MUSIC GENERATION ---
  const handleMusicImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMusicImgBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isGeneratingMusic) return;
    setIsGeneratingMusic(true);
    setGeneratedMusic(null);
    setMusicError("");

    try {
      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: musicPrompt,
          model: musicModel,
          referenceImage: musicImgBase64 || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Convert base64 audio data from server into a browser-playable Object URL
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
        const audioUrl = URL.createObjectURL(blob);

        setGeneratedMusic({
          audioUrl,
          lyrics: data.lyrics || "مقطوعة موسيقية سينمائية بدون كلمات.",
          mimeType: data.mimeType
        });
      } else {
        throw new Error(data.error || "خطأ سحابي في توليد الموسيقى");
      }
    } catch (err: any) {
      setMusicError(err.message || String(err));
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // --- ACTIONS 3: MOVIE & VIDEO MAKER ---
  const handleVideoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoStartImg(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setVideoError("");
    setGeneratedVideoUrl("");
    setVideoProgressPercent(5);
    setVideoProgressMsg("🚀 جاري تهيئة خوادم التوليد البصري الأسرع Veo 3.1...");

    try {
      // 1. Start generation
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          resolution: videoResolution,
          aspectRatio: videoAspectRatio,
          startingImage: videoStartImg || undefined
        })
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.success) {
        throw new Error(startData.error || "فشل بدء مهمة توليد الفيديو.");
      }

      const operationName = startData.operationName;
      setVideoOpName(operationName);

      // 2. Poll progress loop
      let done = false;
      let attempt = 0;

      while (!done) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempt++;

        // Shift progress steps to reassure the user
        const step = progressSteps[Math.min(attempt - 1, progressSteps.length - 1)];
        setVideoProgressPercent(step.percent);
        setVideoProgressMsg(step.text);

        const statusRes = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName })
        });

        const statusData = await statusRes.json();
        if (statusRes.ok && statusData.success) {
          if (statusData.done) {
            done = true;
            setVideoProgressPercent(95);
            setVideoProgressMsg("⚡ اكتمل الرندرة والتحريك! جاري تجهيز دفق التحميل السينمائي...");
          }
        } else {
          throw new Error(statusData.error || "فشل متابعة رندرة الفيلم السحابي.");
        }
      }

      // 3. Download/Stream video back
      const downloadRes = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName })
      });

      if (!downloadRes.ok) {
        throw new Error("فشل خادم التمرير في تجميع حزم الـ MP4 لتشغيلها.");
      }

      const blob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoUrl);
      setVideoProgressPercent(100);
      setVideoProgressMsg("🎉 تم التوليد بنجاح! فيلمك السينمائي جاهز للعرض والتحميل.");
    } catch (err: any) {
      console.error(err);
      setVideoError(err.message || String(err));
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // --- ACTIONS 4: IMAGE GENERATION & EDITING ---
  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || isGeneratingImg) return;
    setIsGeneratingImg(true);
    setGeneratedImg("");
    setImgError("");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt,
          aspectRatio: imgAspectRatio,
          imageSize: imgSize,
          model: imgModel
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedImg(data.imageUrl);
      } else {
        throw new Error(data.error || "فشل الاتصال بمزود Imagen.");
      }
    } catch (err: any) {
      setImgError(err.message || String(err));
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // Edit Image handles
  const handleEditImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditSourceImg(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !editSourceImg || isEditingImg) return;
    setIsEditingImg(true);
    setEditedResultImg("");
    setEditImgError("");

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editPrompt,
          base64Image: editSourceImg
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditedResultImg(data.imageUrl);
      } else {
        throw new Error(data.error || "فشل تعديل الصورة عبر الخادم.");
      }
    } catch (err: any) {
      setEditImgError(err.message || String(err));
    } finally {
      setIsEditingImg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="text-[var(--color-neon-purple)] animate-pulse" size={26} />
            <span>استوديو الوسائط والذكاء الاصطناعي التوليدي</span>
          </h2>
          <p className="text-gray-400 mt-1">توليد الدردشة الفورية والبرمجية، وتحميل الموسيقى، وصناعة مقاطع الأفلام، والصور الفنية واقعياً 100%</p>
        </div>

        {/* Outer Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === "studio"
                ? "bg-[rgba(139,92,246,0.15)] text-[var(--color-neon-purple)] border border-[rgba(139,92,246,0.2)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles size={16} />
            <span>استوديو الإنتاج التوليدي (الواقعي)</span>
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === "directory"
                ? "bg-[rgba(139,92,246,0.15)] text-[var(--color-neon-purple)] border border-[rgba(139,92,246,0.2)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Bot size={16} />
            <span>دليل ووكلاء الموديلات الخارجية</span>
          </button>
        </div>
      </div>

      {activeTab === "directory" ? (
        <>
          {/* Classic directory code with CRUD */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold">دليل وقائمة مزودي الموديلات السحابية</h3>
              <p className="text-xs text-gray-400">سجل إعدادات ومفاتيح الوصول السرية للوكلاء الخارجيين</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="بحث في الوكلاء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-card border border-white/10 rounded-lg py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[var(--color-neon-purple)]"
                />
                <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
              </div>
              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[rgba(139,92,246,0.1)] text-[var(--color-neon-purple)] rounded-lg hover:bg-[rgba(139,92,246,0.2)] transition-colors whitespace-nowrap text-xs font-bold border border-[rgba(139,92,246,0.1)] cursor-pointer"
              >
                <Plus size={16} />
                <span>إضافة إعداد</span>
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="glass card-glow border border-[var(--color-neon-purple)] rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">تسجيل مفاتيح ووكيل ذكاء اصطناعي جديد</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الاسم التعريفي</label>
                  <input required type="text" placeholder="مثال: Groq Llama 3" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">المزود (Provider)</label>
                  <input required type="text" placeholder="مثال: groq / openai / anthropic" value={newAgent.provider} onChange={e => setNewAgent({...newAgent, provider: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الرابط المرجعي (URL)</label>
                  <input type="url" placeholder="https://..." value={newAgent.url} onChange={e => setNewAgent({...newAgent, url: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">اسم الموديل (Model Name)</label>
                  <input type="text" placeholder="llama3-8b-8192" value={newAgent.modelName} onChange={e => setNewAgent({...newAgent, modelName: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left text-sm" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">مفتاح API الأساسي (مشفر ومحمي محلياً)</label>
                  <input type="password" placeholder="sk-..." value={newAgent.apiKey} onChange={e => setNewAgent({...newAgent, apiKey: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left text-sm" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                  <CustomFieldsEditor 
                    customFields={newAgent.customFields} 
                    onChange={(fields) => setNewAgent({...newAgent, customFields: fields})} 
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 border-t border-white/10 pt-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm">إلغاء</button>
                  <button type="submit" className="bg-[var(--color-neon-purple)] text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-500 transition-colors text-sm">
                    حفظ وإدراج الوكيل
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((agent, index) => (
              <div
                key={agent.id}
                className="glass border border-[rgba(255,255,255,0.05)] rounded-xl p-5 card-glow group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[var(--color-neon-purple)] relative">
                      <Bot size={22} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="حذف"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base mb-1 group-hover:text-[var(--color-neon-purple)] transition-colors">
                    {agent.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded text-gray-300 font-bold">
                      {agent.provider}
                    </span>
                    <span className="text-[10px] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded text-gray-300 font-mono">
                      {agent.modelName}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1 text-gray-400">
                    <CheckCircle2 size={12} className="text-[var(--color-neon-green)]" />
                    <span>متاح ومسجل</span>
                  </span>
                  {agent.url && (
                    <a
                      href={agent.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-neon-purple)] hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>الموقع</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ================== AI STUDIO WORKSPACE ================== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Studio Left sidebar navigation */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pr-2">اختيار نوع الاستوديو</p>
            
            <button
              onClick={() => setStudioSubTab("chat")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-right cursor-pointer ${
                studioSubTab === "chat"
                  ? "bg-purple-500/10 text-[var(--color-neon-purple)] border border-purple-500/20 shadow-lg"
                  : "bg-slate-900/40 border border-transparent text-gray-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${studioSubTab === "chat" ? "bg-purple-500/20" : "bg-black/20"}`}>
                <MessageSquare size={16} />
              </div>
              <div className="flex-1">
                <p className="leading-none">💬 الدردشة والمساعد الذكي</p>
                <span className="text-[10px] text-gray-400 font-normal">Gemini 3.5 Flash Chat</span>
              </div>
            </button>

            <button
              onClick={() => setStudioSubTab("music")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-right cursor-pointer ${
                studioSubTab === "music"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg"
                  : "bg-slate-900/40 border border-transparent text-gray-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${studioSubTab === "music" ? "bg-cyan-500/20" : "bg-black/20"}`}>
                <Music size={16} />
              </div>
              <div className="flex-1">
                <p className="leading-none">🎵 توليد وتلحين الموسيقى</p>
                <span className="text-[10px] text-gray-400 font-normal">Google Lyria Engine</span>
              </div>
            </button>

            <button
              onClick={() => setStudioSubTab("video")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-right cursor-pointer ${
                studioSubTab === "video"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg"
                  : "bg-slate-900/40 border border-transparent text-gray-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${studioSubTab === "video" ? "bg-emerald-500/20" : "bg-black/20"}`}>
                <Film size={16} />
              </div>
              <div className="flex-1">
                <p className="leading-none">🎬 صناعة الأفلام والفيديو</p>
                <span className="text-[10px] text-gray-400 font-normal">Google Veo Cinematic Video</span>
              </div>
            </button>

            <button
              onClick={() => setStudioSubTab("image")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-right cursor-pointer ${
                studioSubTab === "image"
                  ? "bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-lg"
                  : "bg-slate-900/40 border border-transparent text-gray-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${studioSubTab === "image" ? "bg-pink-500/20" : "bg-black/20"}`}>
                <ImageIcon size={16} />
              </div>
              <div className="flex-1">
                <p className="leading-none">🎨 صالة توليد وتعديل الصور</p>
                <span className="text-[10px] text-gray-400 font-normal">Google Imagen Studio</span>
              </div>
            </button>

            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 text-xs space-y-2 mt-4">
              <p className="font-bold text-gray-300 flex items-center gap-1">
                <AlertCircle size={14} className="text-yellow-400" />
                <span>حول مفاتيح التشغيل:</span>
              </p>
              <p className="text-gray-400 leading-relaxed">
                يستخدم هذا الاستوديو مفتاح <code className="font-mono text-xs bg-slate-950 px-1 py-0.5 rounded text-purple-300">GEMINI_API_KEY</code> السحابي المخزن في لوحة إدارة الـ Secrets لتوليد المحتويات بشكل حقيقي على خوادم جوجل الرعدية.
              </p>
            </div>
          </div>

          {/* Studio Workspace Content (Right 3 cols) */}
          <div className="lg:col-span-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6 min-h-[550px] flex flex-col justify-between">
            
            {/* === TAB 1: AI CHAT AGENT === */}
            {studioSubTab === "chat" && (
              <div className="flex flex-col h-full justify-between gap-4">
                {/* Chat Top settings panel */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">شخصية المساعد:</span>
                    <select
                      value={systemPreset}
                      onChange={(e) => setSystemPreset(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="general">💬 مساعد فني عام ومتعاون</option>
                      <option value="coder">💻 خبير برمجيات ومصحح كود</option>
                      <option value="copywriter">✍️ كاتب وصانع محتوى إبداعي</option>
                      <option value="translator">🌐 مترجم لغوي محترف دقيق</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">موديل الذكاء:</span>
                    <select
                      value={chatModel}
                      onChange={(e) => setChatModel(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-white focus:outline-none focus:border-purple-500 cursor-pointer font-bold text-xs"
                    >
                      <optgroup label="الوكلاء المجانيون الافتراضيون (بدون مفاتيح)">
                        <option value="free-chat">🤖 Pollinations AI (مجاني وسريع 100%)</option>
                      </optgroup>
                      <optgroup label="الوكلاء السحابيون الافتراضيون">
                        <option value="gemini-3.5-flash">✨ Gemini 3.5 Flash (سحابي مدفوع)</option>
                      </optgroup>
                      <optgroup label="وكلاء مخصصون (بالمفاتيح المحفوظة)">
                        <option value="groq">
                          ⚡ Groq Llama 3.3 {storedKeys.groq ? " (نشط ✅)" : " (مطلوب مفتاح 🔑)"}
                        </option>
                        <option value="kimi">
                          🌙 Kimi Moonshot {storedKeys.kimi ? " (نشط ✅)" : " (مطلوب مفتاح 🔑)"}
                        </option>
                        <option value="openai">
                          🌐 OpenAI GPT-4o Mini {storedKeys.openai ? " (نشط ✅)" : " (مطلوب مفتاح 🔑)"}
                        </option>
                        <option value="openrouter">
                          🔮 OpenRouter Llama {storedKeys.openrouter ? " (نشط ✅)" : " (مطلوب مفتاح 🔑)"}
                        </option>
                        <option value="gemini-custom">
                          ✨ Gemini Studio {storedKeys.gemini ? " (نشط ✅)" : " (مطلوب مفتاح 🔑)"}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Quick Add Custom Key Form */}
                {["groq", "kimi", "openai", "openrouter", "gemini-custom"].includes(chatModel) && !storedKeys[chatModel] && (
                  <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 text-right space-y-3">
                    <div className="flex items-start gap-2.5 text-purple-300 text-xs font-bold">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">مفتاح الوصول غير متوفر للوكيل المختار:</p>
                        <p className="text-gray-300 font-normal mt-1 leading-relaxed">
                          يرجى إدخال مفتاح API الخاص بـ {chatModel === "groq" ? "Groq" : chatModel === "kimi" ? "Kimi/Moonshot" : chatModel === "openai" ? "OpenAI" : chatModel === "openrouter" ? "OpenRouter" : "Gemini"} لتنشيطه فوراً والبدء في المحادثة. سيتم حفظه وتشفيره تلقائياً بأمان تام داخل لوحة المفاتيح والرموز الخاصة بك.
                        </p>
                      </div>
                    </div>
                    <form onSubmit={handleSaveCustomKey} className="flex gap-2">
                      <input
                        required
                        type="password"
                        placeholder={`أدخل مفتاح API الخاص بـ ${chatModel} هنا...`}
                        value={customKeyInput}
                        onChange={(e) => setCustomKeyInput(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        disabled={isSavingKey}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        {isSavingKey ? "جاري الحفظ والتنشيط..." : "حفظ وتنشيط 🔑"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Messages Display Board */}
                <div className="flex-1 bg-black/15 border border-white/5 rounded-2xl p-4 max-h-[380px] overflow-y-auto space-y-4 scrollbar-thin">
                  {chatHistory.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${isUser ? "mr-auto flex-row-reverse" : "ml-auto"}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          isUser ? "bg-purple-600/20 text-purple-300" : "bg-slate-800 text-cyan-300"
                        }`}>
                          {isUser ? "أنت" : <Bot size={14} />}
                        </div>
                        <div className="space-y-1">
                          <div className={`p-3.5 rounded-2xl leading-relaxed text-sm ${
                            isUser 
                              ? "bg-purple-600 text-white rounded-tr-none text-right font-medium" 
                              : "bg-slate-800/80 text-gray-200 rounded-tl-none text-right"
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] text-gray-500 ${isUser ? "justify-start" : "justify-end"}`}>
                            <span>{msg.timestamp}</span>
                            {!isUser && (
                              <button
                                onClick={() => handleCopyChatText(msg.id, msg.text)}
                                className="text-gray-500 hover:text-white transition-colors p-0.5 cursor-pointer"
                                title="نسخ الرد"
                              >
                                {chatCopiedId === msg.id ? (
                                  <Check size={10} className="text-green-400" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isChatLoading && (
                    <div className="flex gap-3 max-w-[80%] ml-auto">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs shrink-0 text-cyan-300 animate-spin">
                        <RefreshCw size={14} />
                      </div>
                      <div className="bg-slate-800/40 text-gray-400 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                        <span className="text-xs">جاري التفكير والتوليد الفعلي...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Controls */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اكتب رسالتك أو استفسارك هنا..."
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendChatMessage();
                    }}
                    className="flex-1 bg-black/35 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isChatLoading || !chatPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-white font-bold p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* === TAB 2: AI MUSIC STUDIO === */}
            {studioSubTab === "music" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Music className="text-cyan-400" size={18} />
                    <span>مطبخ تلحين وصناعة الموسيقى الرقمية (Lyria)</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">اكتب الوصف الموسيقي بدقة لتوليد مقطوعات غنائية أو سينمائية عالية الجودة</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-bold">نموذج التوليد الموسيقي:</label>
                      <select
                        value={musicModel}
                        onChange={(e) => setMusicModel(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white cursor-pointer"
                      >
                        <option value="lyria-3-clip-preview">🎵 Lyria Clip - مقاطع قصيرة (حتى 30 ثانية)</option>
                        <option value="lyria-3-pro-preview">🎹 Lyria Pro - معزوفات وتراكات كاملة ممتازة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-bold">صف المقطوعة المطلوبة بالتفصيل:</label>
                      <textarea
                        rows={3}
                        placeholder="مثال: لحن بيانو هادئ مع موسيقى سينمائية أوركسترالية تعطي إحساساً بالحماس والإنجاز..."
                        value={musicPrompt}
                        onChange={(e) => setMusicPrompt(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Optional Reference Image to inspire the melody */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-bold">صورة ملهمة للحن (اختياري):</label>
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-gray-200 cursor-pointer border border-white/5">
                          <Upload size={14} />
                          <span>رفع صورة مرجعية</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleMusicImageUpload}
                            className="hidden"
                          />
                        </label>
                        {musicImgBase64 && (
                          <div className="relative">
                            <img
                              src={musicImgBase64}
                              alt="Melody reference"
                              className="w-10 h-10 object-cover rounded-lg border border-cyan-400"
                            />
                            <button
                              onClick={() => setMusicImgBase64("")}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateMusic}
                      disabled={isGeneratingMusic || !musicPrompt.trim()}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800/40 disabled:text-gray-500 text-black font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isGeneratingMusic ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          <span>جاري تلحين وبث المقطوعة السحابية...</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          <span>توليد وبث اللحن الموسيقي الآن</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column Results Display */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                    {isGeneratingMusic ? (
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400 animate-pulse">
                          <Music className="animate-bounce" size={28} />
                        </div>
                        <p className="text-sm text-cyan-300 font-bold">جاري تأليف الكود الصوتي الرقمي...</p>
                        <p className="text-xs text-gray-500">يتطلب هذا بعض الوقت لتجهيز قنوات الصوت وبناء دفق الـ Wav</p>
                      </div>
                    ) : generatedMusic ? (
                      <div className="w-full space-y-4">
                        <span className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full">
                          تم توليد المعزوفة الصوتية بنجاح!
                        </span>

                        {/* Beautiful audio layout player */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-white/10 w-full space-y-3">
                          <p className="text-xs text-gray-400 font-mono">الخوارزمية المشغلة: Google Lyria-3-Clip</p>
                          <audio
                            src={generatedMusic.audioUrl}
                            controls
                            className="w-full accent-cyan-400 h-10"
                          />
                        </div>

                        {/* Generated Lyrics / Theme block */}
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-right space-y-2">
                          <p className="text-xs font-bold text-cyan-400">📝 كلمات الأغنية المرافقة أو الثيم الإيحائي:</p>
                          <p className="text-xs text-gray-300 leading-relaxed italic whitespace-pre-line">
                            "{generatedMusic.lyrics}"
                          </p>
                        </div>

                        <a
                          href={generatedMusic.audioUrl}
                          download="ai_generated_melody.wav"
                          className="flex items-center justify-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg"
                        >
                          <Download size={14} />
                          <span>تحميل الملف الصوتي بجودة عالية WAV</span>
                        </a>
                      </div>
                    ) : musicError ? (
                      <div className="space-y-4 w-full">
                        {renderErrorState(musicError)}
                        <button
                          onClick={() => setMusicError("")}
                          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500 space-y-2">
                        <Music size={40} className="mx-auto opacity-30" />
                        <p className="text-sm">لم تقم بتوليد أي مقطوعات صوتية بعد.</p>
                        <p className="text-xs max-w-xs leading-relaxed">
                          اكتب وصف اللحن على اليسار واضغط على زر التوليد لتأليف تراك صوتي حقيقي قابل للتشغيل والتحميل فوراً.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* === TAB 3: AI MOVIE & VIDEO MAKER === */}
            {studioSubTab === "video" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Film className="text-emerald-400" size={18} />
                    <span>استوديو صناعة الأفلام والسينما الرقمية (Google Veo)</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">قم بتوليد مقاطع سينمائية خلابة بدقة ممتازة وزوايا تحرك ديناميكية</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-bold">وصف المشهد السينمائي بالتفصيل:</label>
                      <textarea
                        rows={3}
                        placeholder="مثال: لقطة مقربة لسيارة مستقبلية تسير بسرعة جنونية في شوارع مدينة نيوم مع إضاءات نيون تنعكس على الزجاج..."
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">أبعاد الفيديو:</label>
                        <select
                          value={videoAspectRatio}
                          onChange={(e) => setVideoAspectRatio(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white cursor-pointer"
                        >
                          <option value="16:9">📐 أفقي وعريض (16:9)</option>
                          <option value="9:16">📱 رأسي للهواتف (9:16)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">الدقة والوضوح:</label>
                        <select
                          value={videoResolution}
                          onChange={(e) => setVideoResolution(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white cursor-pointer"
                        >
                          <option value="720p">📺 HD (720p)</option>
                          <option value="1080p">💎 Full HD (1080p)</option>
                        </select>
                      </div>
                    </div>

                    {/* Starting Image for Video generation */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-bold">صورة بدء المشهد (اختياري - تحريك الصور):</label>
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-gray-200 cursor-pointer border border-white/5">
                          <Upload size={14} />
                          <span>تحميل صورة البداية</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleVideoImageUpload}
                            className="hidden"
                          />
                        </label>
                        {videoStartImg && (
                          <div className="relative">
                            <img
                              src={videoStartImg}
                              alt="Video starting frame"
                              className="w-10 h-10 object-cover rounded-lg border border-emerald-400"
                            />
                            <button
                              onClick={() => setVideoStartImg("")}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateVideo}
                      disabled={isGeneratingVideo || !videoPrompt.trim()}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800/40 disabled:text-gray-500 text-black font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isGeneratingVideo ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          <span>جاري الرندرة السحابية المستمرة...</span>
                        </>
                      ) : (
                        <>
                          <Video size={16} />
                          <span>ابدأ رندرة وتوليد الفيلم السينمائي</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column Results Display */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                    {isGeneratingVideo ? (
                      <div className="w-full space-y-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-spin">
                          <RefreshCw size={24} />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-emerald-400">جاري صناعة إطارات الفيلم الرقمي</p>
                          <p className="text-[11px] text-gray-400 italic px-4 leading-relaxed min-h-[32px]">
                            {videoProgressMsg}
                          </p>
                        </div>

                        {/* Custom Progress Gauge */}
                        <div className="space-y-1 w-full max-w-xs mx-auto">
                          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                            <span>نسبة التقدم</span>
                            <span>{videoProgressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${videoProgressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : generatedVideoUrl ? (
                      <div className="w-full space-y-4">
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                          تم توليد الفيلم السينمائي بنجاح!
                        </span>

                        {/* Real HTML5 Video player */}
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl w-full aspect-video flex items-center justify-center">
                          <video
                            src={generatedVideoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <a
                          href={generatedVideoUrl}
                          download="ai_movie_maker.mp4"
                          className="flex items-center justify-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg w-full"
                        >
                          <Download size={14} />
                          <span>تحميل ملف الفيديو بصيغة MP4</span>
                        </a>
                      </div>
                    ) : videoError ? (
                      <div className="space-y-4 w-full">
                        {renderErrorState(videoError)}
                        <button
                          onClick={() => setVideoError("")}
                          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500 space-y-2">
                        <Film size={40} className="mx-auto opacity-30" />
                        <p className="text-sm">لم يتم توليد أي أفلام أو عروض فيديو بعد.</p>
                        <p className="text-xs max-w-xs leading-relaxed">
                          أدخل الوصف السينمائي على اليسار ودع خوادم Veo تنسج لك قصة بصرية ساحرة حية.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* === TAB 4: AI IMAGE STUDIO === */}
            {studioSubTab === "image" && (
              <div className="space-y-6">
                <div className="flex border-b border-white/10 pb-3 justify-between items-center">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon className="text-pink-400" size={18} />
                      <span>صالة الفنون التوليدية الفائقة (Imagen)</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">توليد لوحات تشكيلية مدهشة وتعديل الصور يدوياً بتوجيهات ذكية</p>
                  </div>

                  {/* Toggle Image Mode */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5 text-[11px] font-bold">
                    <button
                      onClick={() => setIsEditingImg(false)}
                      className={`px-3 py-1 rounded cursor-pointer ${!isEditingImg ? "bg-pink-500/20 text-pink-400" : "text-gray-400"}`}
                    >
                      🎨 توليد صور من نص
                    </button>
                    <button
                      onClick={() => setIsEditingImg(true)}
                      className={`px-3 py-1 rounded cursor-pointer ${isEditingImg ? "bg-pink-500/20 text-pink-400" : "text-gray-400"}`}
                    >
                      🖌️ تعديل صورة موجودة
                    </button>
                  </div>
                </div>

                {!isEditingImg ? (
                  /* IMAGE GENERATE MODE */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Panel */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-bold">أدخل الفكرة الفنية المراد توليدها:</label>
                        <textarea
                          rows={3}
                          placeholder="مثال: رائد فضاء يجلس على تلة في المريخ يقرأ كتاباً، مع خلفية لكوكب الأرض مضيئة بجمال مذهل..."
                          value={imgPrompt}
                          onChange={(e) => setImgPrompt(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-bold">نموذج توليد الصور الفنية:</label>
                        <select
                          value={imgModel}
                          onChange={(e) => setImgModel(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white cursor-pointer font-bold"
                        >
                          <option value="free-image">🎨 Flux Professional (مجاني وسريع 100% - بدون قيود)</option>
                          <option value="gemini-3.1-flash-image">✨ Google Imagen 3 (سحابي مدفوع)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">الأبعاد والنسب (Aspect Ratio):</label>
                          <select
                            value={imgAspectRatio}
                            onChange={(e) => setImgAspectRatio(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white cursor-pointer"
                          >
                            <option value="1:1">⬜ مربع (1:1)</option>
                            <option value="3:4">📐 عمودي بورتريه (3:4)</option>
                            <option value="4:3">📏 أفقي قياسي (4:3)</option>
                            <option value="16:9">📺 شاشات التلفاز (16:9)</option>
                            <option value="9:16">📱 ستوري للهاتف (9:16)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">جودة وحجم الملف البصري:</label>
                          <select
                            value={imgSize}
                            onChange={(e) => setImgSize(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white cursor-pointer"
                          >
                            <option value="512px">بيكسل منخفضة (512px)</option>
                            <option value="1K">جودة قياسية (1K HD)</option>
                            <option value="2K">جودة عالية (2K Ultra HD)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImg || !imgPrompt.trim()}
                        className="w-full py-3 bg-pink-500 hover:bg-pink-400 disabled:bg-pink-800/40 disabled:text-gray-500 text-black font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isGeneratingImg ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            <span>جاري إطعام ريشة الفن السحابية...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            <span>توليد ورسم لوحة فنية رائعة</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right Panel Canvas Display */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                      {isGeneratingImg ? (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-pink-500/10 rounded-full border border-pink-500/20 flex items-center justify-center mx-auto text-pink-400 animate-pulse">
                            <ImageIcon className="animate-bounce" size={24} />
                          </div>
                          <p className="text-sm text-pink-300 font-bold">جاري رصف البكسلات وتوليد التكوينات الرسومية...</p>
                        </div>
                      ) : generatedImg ? (
                        <div className="w-full space-y-4">
                          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl max-h-[300px] flex items-center justify-center">
                            <img
                              src={generatedImg}
                              alt="Generated AI artwork"
                              className="max-h-[300px] object-contain w-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex gap-2">
                            <a
                              href={generatedImg}
                              download="imagen_masterpiece.png"
                              className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white py-2 rounded-lg"
                            >
                              <Download size={14} />
                              <span>تحميل الصورة PNG</span>
                            </a>
                            <button
                              onClick={() => {
                                setEditSourceImg(generatedImg);
                                setIsEditingImg(true);
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-gray-200 border border-white/5 cursor-pointer"
                              title="استخدم هذه الصورة كقاعدة للتعديل"
                            >
                              <Paintbrush size={14} />
                            </button>
                          </div>
                        </div>
                      ) : imgError ? (
                        <div className="space-y-4 w-full">
                          {renderErrorState(imgError)}
                          <button
                            onClick={() => setImgError("")}
                            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 border border-white/10 transition-colors cursor-pointer"
                          >
                            إعادة المحاولة
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500 space-y-2">
                          <ImageIcon size={40} className="mx-auto opacity-30" />
                          <p className="text-sm">لم يتم رسم أي صور فنية بعد.</p>
                          <p className="text-xs max-w-xs leading-relaxed">
                            اكتب مشهد خيالي على اليسار ودع ريشة Imagen تبهرك بدقة تكويناتها وواقعيتها الفائقة.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* IMAGE EDIT MODE */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left panel upload and instruction */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-bold">1. رفع الصورة الأساسية المراد تعديلها:</label>
                        <div className="flex gap-4 items-center">
                          <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-gray-200 cursor-pointer border border-white/5">
                            <Upload size={14} />
                            <span>اختيار ملف الصورة</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditImgUpload}
                              className="hidden"
                            />
                          </label>
                          {editSourceImg && (
                            <span className="text-xs text-gray-400">تم رفع الصورة الأساسية بنجاح</span>
                          )}
                        </div>
                      </div>

                      {editSourceImg && (
                        <div className="relative rounded-lg overflow-hidden border border-white/5 bg-slate-950 max-h-[140px] max-w-[200px] flex items-center justify-center">
                          <img
                            src={editSourceImg}
                            alt="Edit target base"
                            className="max-h-[140px] object-cover"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-bold">2. التعليمات والتعديلات المطلوبة (Prompt):</label>
                        <textarea
                          rows={2}
                          placeholder="مثال: غيّر لون تي شيرت رائد الفضاء إلى أحمر ساطع، وأضف قطة تسبح بجانبه..."
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <button
                        onClick={handleEditImage}
                        disabled={isEditingImg || !editPrompt.trim() || !editSourceImg}
                        className="w-full py-3 bg-pink-500 hover:bg-pink-400 disabled:bg-pink-800/40 disabled:text-gray-500 text-black font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isEditingImg ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            <span>جاري تعديل اللوحة الفنية يدوياً...</span>
                          </>
                        ) : (
                          <>
                            <Paintbrush size={16} />
                            <span>تعديل الصورة وتحسينها بذكاء</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right panel result display */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                      {isEditingImg ? (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-pink-500/10 rounded-full border border-pink-500/20 flex items-center justify-center mx-auto text-pink-400 animate-pulse">
                            <Paintbrush className="animate-bounce" size={24} />
                          </div>
                          <p className="text-sm text-pink-300 font-bold">جاري تطبيق الفراشي الفنية على اللوحة...</p>
                        </div>
                      ) : editedResultImg ? (
                        <div className="w-full space-y-4">
                          <span className="bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold px-3 py-1 rounded-full">
                            تم التعديل ببراعة بالغة!
                          </span>

                          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl max-h-[300px] flex items-center justify-center">
                            <img
                              src={editedResultImg}
                              alt="Edited artwork masterpiece"
                              className="max-h-[300px] object-contain w-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <a
                            href={editedResultImg}
                            download="edited_imagen_masterpiece.png"
                            className="flex items-center justify-center gap-2 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white py-2 rounded-lg w-full"
                          >
                            <Download size={14} />
                            <span>تحميل النسخة المعدلة PNG</span>
                          </a>
                        </div>
                      ) : editImgError ? (
                        <div className="space-y-4 w-full">
                          {renderErrorState(editImgError)}
                          <button
                            onClick={() => setEditImgError("")}
                            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 border border-white/10 transition-colors cursor-pointer"
                          >
                            إعادة المحاولة
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500 space-y-2">
                          <Paintbrush size={40} className="mx-auto opacity-30" />
                          <p className="text-sm">بانتظار إجراء التعديلات البصرية.</p>
                          <p className="text-xs max-w-xs leading-relaxed">
                            قم برفع الصورة المطلوبة وأدخل التعليمات الفنية على اليسار لتعديلها بشكل احترافي رائع.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
