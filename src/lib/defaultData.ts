import { AIAgent, FreeServer, Server, Link, HuggingFaceResource, Credential, CloudDatabase } from "../types";

export const defaultFreeServers: Partial<FreeServer>[] = [
  { name: "Hugging Face Spaces", type: "ai_ml", description: "Host web applications and ML demos for free", signupUrl: "https://huggingface.co/join", docsUrl: "https://huggingface.co/docs", website: "https://huggingface.co/spaces", freeTierDetails: "Free CPU instances, 50GB ephemeral storage, public spaces", limits: { storage: "50GB", bandwidth: "Unlimited", requests: "Unlimited", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["ml", "python", "gradio", "streamlit"] },
  { name: "Replit", type: "fullstack", description: "Browser-based IDE and hosting", signupUrl: "https://replit.com/signup", docsUrl: "https://docs.replit.com", website: "https://replit.com", freeTierDetails: "Free public repls", limits: { storage: "Varies", bandwidth: "Limited", requests: "Limited", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["ide", "node", "python"] },
  { name: "Lovable.dev", type: "fullstack", description: "AI-powered fullstack generation", signupUrl: "https://lovable.dev", docsUrl: "https://lovable.dev", website: "https://lovable.dev", freeTierDetails: "Free tier available", limits: { storage: "Varies", bandwidth: "Varies", requests: "Varies", builds: "Varies" }, status: "active", isFavorite: false, tags: ["ai", "react"] },
  { name: "BrewPage", type: "static", description: "Static site builder", signupUrl: "https://brewpage.app", docsUrl: "https://brewpage.app", website: "https://brewpage.app", freeTierDetails: "Free basic tier", limits: { storage: "Varies", bandwidth: "Varies", requests: "Varies", builds: "Varies" }, status: "active", isFavorite: false, tags: ["static"] },
  { name: "V0 by Vercel", type: "fullstack", description: "Generative UI", signupUrl: "https://v0.dev", docsUrl: "https://v0.dev/docs", website: "https://v0.dev", freeTierDetails: "Free tier with credits", limits: { storage: "N/A", bandwidth: "N/A", requests: "N/A", builds: "N/A" }, status: "active", isFavorite: false, tags: ["ui", "ai", "react"] },
  { name: "Bolt.new", type: "fullstack", description: "AI Web dev in browser", signupUrl: "https://bolt.new", docsUrl: "https://bolt.new", website: "https://bolt.new", freeTierDetails: "Free usage available", limits: { storage: "Browser", bandwidth: "N/A", requests: "N/A", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["ai", "ide"] },
  { name: "StackBlitz", type: "fullstack", description: "Online IDE", signupUrl: "https://stackblitz.com", docsUrl: "https://developer.stackblitz.com", website: "https://stackblitz.com", freeTierDetails: "Free public projects", limits: { storage: "Browser", bandwidth: "N/A", requests: "N/A", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["ide", "node"] },
  { name: "CodeSandbox", type: "fullstack", description: "Online code editor", signupUrl: "https://codesandbox.io", docsUrl: "https://codesandbox.io/docs", website: "https://codesandbox.io", freeTierDetails: "Free public sandboxes", limits: { storage: "Browser", bandwidth: "N/A", requests: "N/A", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["ide", "react"] },
  { name: "Render", type: "fullstack", description: "Cloud platform", signupUrl: "https://render.com", docsUrl: "https://render.com/docs", website: "https://render.com", freeTierDetails: "Free static sites & web services (spins down)", limits: { storage: "Ephemeral", bandwidth: "100GB", requests: "Unlimited", builds: "500h/mo" }, status: "active", isFavorite: false, tags: ["cloud", "docker"] },
  { name: "Koyeb", type: "fullstack", description: "Serverless platform", signupUrl: "https://www.koyeb.com", docsUrl: "https://www.koyeb.com/docs", website: "https://www.koyeb.com", freeTierDetails: "One free Eco instance", limits: { storage: "Ephemeral", bandwidth: "100GB", requests: "Unlimited", builds: "Varies" }, status: "active", isFavorite: false, tags: ["serverless", "docker"] },
  { name: "Railway", type: "fullstack", description: "Deployment platform", signupUrl: "https://railway.app", docsUrl: "https://docs.railway.app", website: "https://railway.app", freeTierDetails: "$5 free credit one-time", limits: { storage: "Varies", bandwidth: "Varies", requests: "Varies", builds: "Varies" }, status: "active", isFavorite: false, tags: ["cloud", "docker"] },
  { name: "PythonAnywhere", type: "backend", description: "Python hosting", signupUrl: "https://www.pythonanywhere.com", docsUrl: "https://help.pythonanywhere.com", website: "https://www.pythonanywhere.com", freeTierDetails: "Free beginner account", limits: { storage: "512MB", bandwidth: "Limited", requests: "Limited", builds: "N/A" }, status: "active", isFavorite: false, tags: ["python", "django"] },
  { name: "Deno Deploy", type: "backend", description: "Edge hosting for Deno", signupUrl: "https://deno.com/deploy", docsUrl: "https://docs.deno.com/deploy", website: "https://deno.com/deploy", freeTierDetails: "Free tier available", limits: { storage: "N/A", bandwidth: "100GB", requests: "100k/day", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["deno", "edge"] },
  { name: "Northflank", type: "fullstack", description: "Cloud hosting", signupUrl: "https://northflank.com", docsUrl: "https://northflank.com/docs", website: "https://northflank.com", freeTierDetails: "Free tier for developers", limits: { storage: "Varies", bandwidth: "Varies", requests: "Varies", builds: "Varies" }, status: "active", isFavorite: false, tags: ["cloud", "docker"] },
  { name: "Fly.io", type: "fullstack", description: "Deploy app servers close to users", signupUrl: "https://fly.io", docsUrl: "https://fly.io/docs", website: "https://fly.io", freeTierDetails: "Free allowances", limits: { storage: "3GB", bandwidth: "160GB", requests: "Unlimited", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["edge", "docker"] },
  { name: "GitHub Pages", type: "static", description: "Hosting for static sites", signupUrl: "https://pages.github.com", docsUrl: "https://docs.github.com/en/pages", website: "https://pages.github.com", freeTierDetails: "Free for public repos", limits: { storage: "1GB", bandwidth: "100GB", requests: "Unlimited", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["static", "git"] },
  { name: "Cloudflare Pages", type: "static", description: "JAMstack platform", signupUrl: "https://pages.cloudflare.com", docsUrl: "https://developers.cloudflare.com/pages", website: "https://pages.cloudflare.com", freeTierDetails: "Generous free tier", limits: { storage: "Unlimited", bandwidth: "Unlimited", requests: "Unlimited", builds: "500/mo" }, status: "active", isFavorite: false, tags: ["static", "edge"] },
  { name: "Netlify", type: "static", description: "Web development platform", signupUrl: "https://www.netlify.com", docsUrl: "https://docs.netlify.com", website: "https://www.netlify.com", freeTierDetails: "Starter free tier", limits: { storage: "100GB", bandwidth: "100GB", requests: "Unlimited", builds: "300m/mo" }, status: "active", isFavorite: false, tags: ["static", "serverless"] },
  { name: "Vercel", type: "static", description: "Frontend cloud", signupUrl: "https://vercel.com", docsUrl: "https://vercel.com/docs", website: "https://vercel.com", freeTierDetails: "Hobby tier", limits: { storage: "N/A", bandwidth: "100GB", requests: "Unlimited", builds: "100/day" }, status: "active", isFavorite: false, tags: ["static", "nextjs"] },
  { name: "Surge.sh", type: "static", description: "Static web publishing", signupUrl: "https://surge.sh", docsUrl: "https://surge.sh/help", website: "https://surge.sh", freeTierDetails: "Unlimited free publishing", limits: { storage: "Unlimited", bandwidth: "Unlimited", requests: "Unlimited", builds: "Unlimited" }, status: "active", isFavorite: false, tags: ["static", "cli"] },
  { name: "Appwrite", type: "fullstack", description: "Backend as a service", signupUrl: "https://appwrite.io", docsUrl: "https://appwrite.io/docs", website: "https://appwrite.io", freeTierDetails: "Cloud starter plan", limits: { storage: "2GB", bandwidth: "10GB", requests: "750k/mo", builds: "Varies" }, status: "active", isFavorite: false, tags: ["baas", "auth", "db"] },
  { name: "Supabase", type: "database", description: "Open source Firebase alt", signupUrl: "https://supabase.com", docsUrl: "https://supabase.com/docs", website: "https://supabase.com", freeTierDetails: "Free tier (2 projects)", limits: { storage: "500MB", bandwidth: "5GB", requests: "Unlimited", builds: "N/A" }, status: "active", isFavorite: false, tags: ["baas", "postgres"] },
  { name: "Neon", type: "database", description: "Serverless Postgres", signupUrl: "https://neon.tech", docsUrl: "https://neon.tech/docs", website: "https://neon.tech", freeTierDetails: "Free tier (1 project)", limits: { storage: "500MB", bandwidth: "Varies", requests: "Varies", builds: "N/A" }, status: "active", isFavorite: false, tags: ["database", "postgres"] },
  { name: "Firebase", type: "database", description: "Google's app dev platform", signupUrl: "https://firebase.google.com", docsUrl: "https://firebase.google.com/docs", website: "https://firebase.google.com", freeTierDetails: "Spark plan", limits: { storage: "1GB", bandwidth: "10GB", requests: "50k/day", builds: "N/A" }, status: "active", isFavorite: false, tags: ["baas", "nosql"] },
];

export const defaultServers: Partial<Server>[] = [
  { name: "Production Web", type: "vps", provider: "DigitalOcean", ipAddress: "134.209.12.34", port: 22, username: "root", status: "online", os: "Ubuntu 22.04" },
  { name: "Database Primary", type: "cloud", provider: "AWS", ipAddress: "ec2-54-12-34-56.compute-1.amazonaws.com", port: 22, username: "ubuntu", status: "online", os: "Amazon Linux" },
  { name: "Local Dev", type: "local", provider: "Local", ipAddress: "127.0.0.1", port: 2222, username: "eissa", status: "offline", os: "Debian" }
];

export const defaultLinks: Partial<Link>[] = [
  { name: "GitHub Repository", url: "https://github.com", type: "github", category: "Code", tags: ["git", "source"], visits: 142, isFavorite: true },
  { name: "Tailwind CSS Docs", url: "https://tailwindcss.com", type: "docs", category: "Frontend", tags: ["css", "framework"], visits: 85, isFavorite: false },
  { name: "React Documentation", url: "https://react.dev", type: "docs", category: "Frontend", tags: ["react", "js"], visits: 312, isFavorite: true },
  { name: "Hugging Face Models", url: "https://huggingface.co/models", type: "huggingface", category: "AI", tags: ["ml", "llm"], visits: 56, isFavorite: false }
];

export const defaultHuggingFace: Partial<HuggingFaceResource>[] = [
  { name: "Llama 3.2 3B", spaceId: "meta-llama/Llama-3.2-3B", type: "model", status: "active", likes: 1245, downloads: 450000 },
  { name: "Qwen 2.5 72B", spaceId: "Qwen/Qwen2.5-72B", type: "model", status: "active", likes: 3400, downloads: 890000 },
  { name: "DeepSeek R1", spaceId: "deepseek-ai/DeepSeek-R1", type: "model", status: "active", likes: 8500, downloads: 2100000 },
  { name: "Gemma 2 9B", spaceId: "google/gemma-2-9b", type: "model", status: "active", likes: 2100, downloads: 560000 },
  { name: "Mistral 7B v0.3", spaceId: "mistralai/Mistral-7B-v0.3", type: "model", status: "active", likes: 4500, downloads: 1200000 }
];
export const defaultAIAgents: Partial<AIAgent>[] = [
  { name: "Google AI Studio", provider: "Google", url: "https://aistudio.google.com", modelName: "Gemini 3.5 Flash", status: "active", isFavorite: true },
  { name: "OpenRouter", provider: "OpenRouter", url: "https://openrouter.ai/keys", modelName: "Auto", status: "active", isFavorite: false },
  { name: "Groq", provider: "Groq", url: "https://console.groq.com", modelName: "Llama 3.3 70B", status: "active", isFavorite: true },
  { name: "NVIDIA NIM", provider: "NVIDIA", url: "https://build.nvidia.com", modelName: "DeepSeek V4", status: "active", isFavorite: false },
  { name: "GitHub Models", provider: "GitHub", url: "https://github.com/marketplace/models", modelName: "GPT-5", status: "active", isFavorite: false },
  { name: "Mistral AI", provider: "Mistral", url: "https://console.mistral.ai", modelName: "Codestral", status: "active", isFavorite: false },
  { name: "Cohere", provider: "Cohere", url: "https://dashboard.cohere.com", modelName: "Command A", status: "active", isFavorite: false },
  { name: "Cerebras", provider: "Cerebras", url: "https://cloud.cerebras.ai", modelName: "GPT-OSS 120B", status: "active", isFavorite: false },
  { name: "Cloudflare Workers AI", provider: "Cloudflare", url: "https://dash.cloudflare.com", modelName: "Llama", status: "active", isFavorite: false },
  { name: "DeepSeek", provider: "DeepSeek", url: "https://platform.deepseek.com", modelName: "DeepSeek V3", status: "active", isFavorite: true },
  { name: "SambaNova", provider: "SambaNova", url: "https://sambanova.ai", modelName: "Llama 3.1 405B", status: "active", isFavorite: false },
  { name: "Hugging Face", provider: "Hugging Face", url: "https://huggingface.co", modelName: "Open models", status: "active", isFavorite: false },
  { name: "AI21 Labs", provider: "AI21 Labs", url: "https://studio.ai21.com", modelName: "Jamba", status: "active", isFavorite: false },
  { name: "Z AI", provider: "Zhipu AI", url: "https://z.ai", modelName: "GLM-5", status: "active", isFavorite: false },
  { name: "OVHcloud AI", provider: "OVHcloud", url: "https://endpoints.ai.cloud.ovh.net", modelName: "Qwen", status: "active", isFavorite: false },
  { name: "SiliconFlow", provider: "SiliconFlow", url: "https://cloud.siliconflow.cn", modelName: "Qwen", status: "active", isFavorite: false },
  { name: "xAI (Grok)", provider: "xAI", url: "https://github.com/marketplace/models", modelName: "Grok 3", status: "active", isFavorite: false },
  { name: "ModelScope", provider: "ModelScope", url: "https://modelscope.cn", modelName: "Qwen", status: "active", isFavorite: false },
  { name: "Nebius", provider: "Nebius", url: "https://nebius.ai", modelName: "Llama", status: "active", isFavorite: false },
  { name: "Nscale", provider: "Nscale", url: "https://nscale.com", modelName: "Llama", status: "active", isFavorite: false },
  { name: "LLM7.io", provider: "LLM7", url: "https://llm7.io", modelName: "Open models", status: "active", isFavorite: false },
  { name: "Aion Labs", provider: "Aion Labs", url: "https://aionlabs.ai", modelName: "Custom models", status: "active", isFavorite: false },
  { name: "OpenCode Zen", provider: "OpenCode Zen", url: "https://opencodezen.com", modelName: "Code models", status: "active", isFavorite: false },
  { name: "Glhf.chat", provider: "Glhf", url: "https://glhf.chat", modelName: "Chat models", status: "active", isFavorite: false },
  { name: "Chutes.ai", provider: "Chutes", url: "https://chutes.ai", modelName: "Workflow models", status: "active", isFavorite: false },
  { name: "Agnes AI", provider: "Agnes AI", url: "https://agnes.ai", modelName: "Agnes 2.0 Flash", status: "active", isFavorite: false },
  { name: "Kilo Code", provider: "Kilo Code", url: "https://kilocode.com", modelName: "Code generation", status: "active", isFavorite: false },
  { name: "Ollama Cloud", provider: "Ollama", url: "https://ollama.com", modelName: "Local models", status: "active", isFavorite: false },
  { name: "AG2", provider: "AG2", url: "https://ag2.ai", modelName: "Multi-agent", status: "active", isFavorite: false },
  { name: "AutoGen", provider: "Microsoft", url: "https://microsoft.github.io/autogen", modelName: "Agent Framework", status: "active", isFavorite: false },
  { name: "CrewAI", provider: "CrewAI", url: "https://crewai.com", modelName: "Agent orchestration", status: "active", isFavorite: false },
  { name: "LangChain", provider: "LangChain", url: "https://langchain.com", modelName: "LLM orchestration", status: "active", isFavorite: false },
  { name: "LlamaIndex", provider: "LlamaIndex", url: "https://llamaindex.ai", modelName: "Data framework", status: "active", isFavorite: false }
];

export const defaultDatabases: Partial<CloudDatabase>[] = [
  {
    name: "قاعدة بيانات المستخدمين الأساسية",
    provider: "supabase",
    connectionString: "postgresql://postgres:********@db.supabase.co:5432/postgres",
    dbName: "prod-users-db",
    username: "postgres",
    maxStorageMB: 500,
    usedStorageMB: 420, // 84% full
    status: "active",
    notes: "تحتوي على معلومات المستخدمين والتحقق والتوثيق والملفات الشخصية الأساسية.",
    isFavorite: true,
    isPinned: true,
    tags: ["users", "postgres", "auth"],
    tables: [
      { name: "profiles", recordsCount: 12500, sizeMB: 180, description: "بيانات الملفات الشخصية للمستخدمين" },
      { name: "user_roles", recordsCount: 240, sizeMB: 15, description: "أدوار وصلاحيات المستخدمين والمشرفين" },
      { name: "auth_tokens", recordsCount: 45000, sizeMB: 225, description: "رموز الدخول النشطة والمنتهية للجلسات" }
    ]
  },
  {
    name: "سجلات النشاط والتقارير",
    provider: "neon",
    connectionString: "postgresql://neon_owner:********@ep-neon-12345.us-east-2.aws.neon.tech/neondb",
    dbName: "telemetry-db",
    username: "neon_owner",
    maxStorageMB: 500,
    usedStorageMB: 495, // 99% full - warning!
    status: "full",
    notes: "سجلات الأحداث المجمعة من عملاء الذكاء الاصطناعي ومستودعات الأكواد.",
    isFavorite: false,
    isPinned: false,
    tags: ["logs", "postgres", "analytics"],
    tables: [
      { name: "api_requests_log", recordsCount: 240000, sizeMB: 380, description: "سجلات طلبات API والتفاصيل الفنية للمطورين" },
      { name: "error_traces", recordsCount: 12000, sizeMB: 115, description: "الأخطاء البرمجية المسجلة وتفاصيل بيئات العمل" }
    ]
  },
  {
    name: "تطبيق المدونة والتعليقات",
    provider: "mongodb",
    connectionString: "mongodb+srv://admin:********@cluster0.mongodb.net/blog-app",
    dbName: "blog-app",
    username: "admin",
    maxStorageMB: 512,
    usedStorageMB: 120, // 23%
    status: "active",
    notes: "قاعدة بيانات NoSQL لتخزين المقالات والتعليقات والوسوم بشكل مرن.",
    isFavorite: true,
    isPinned: false,
    tags: ["content", "nosql", "mongodb"],
    tables: [
      { name: "articles", recordsCount: 450, sizeMB: 35, description: "المقالات والمسودات ومحتوى التدوينات" },
      { name: "comments", recordsCount: 8900, sizeMB: 75, description: "تعليقات الزوار والردود والتقييمات" },
      { name: "tags", recordsCount: 35, sizeMB: 10, description: "تصنيفات ووسوم المقالات" }
    ]
  },
  {
    name: "مخزن الإعدادات المؤقتة",
    provider: "upstash",
    connectionString: "redis://default:********@us1-redis.upstash.io:32145",
    dbName: "cache-store",
    maxStorageMB: 256,
    usedStorageMB: 12, // 4.6%
    status: "active",
    notes: "خادم Redis سحابي مجاني ومتاح لإدارة الجلسات السريعة وحفظ الكاش المؤقت.",
    isFavorite: false,
    isPinned: false,
    tags: ["cache", "redis", "key-value"],
    tables: [
      { name: "session_cache", recordsCount: 150, sizeMB: 2, description: "بيانات جلسات التصفح السريعة" },
      { name: "api_rate_limit", recordsCount: 1200, sizeMB: 10, description: "عدادات الحد من معدل استخدام واجهات البرمجة" }
    ]
  }
];

