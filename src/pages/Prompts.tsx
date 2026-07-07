import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Cloud, Edit2, Globe, RefreshCw } from 'lucide-react';
import { getAccessToken } from '../lib/firebase';

export default function Prompts() {
  const [copied, setCopied] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<'ar' | 'en'>('ar');

  const englishPrompt = `You are an expert AI Developer. Your task is to build and clone a fully functional, highly polished React & TypeScript web application named "Secure Vault" (Version 17.5.5). This application acts as a comprehensive portal and database for developers to store, manage, encrypt, and organize credentials, AI model agents, hosting servers, free hosting platforms, useful bookmarks, and Hugging Face resources.

### Tech Stack & Design Requirements
1. **Frontend**: React (v19 or similar) with Vite, TypeScript for absolute type-safety, and Tailwind CSS.
2. **Icons**: Import all icons strictly from "lucide-react".
3. **Animations**: Use simple transitions and micro-interactions on hover and modal display.
4. **Styling & Aesthetics**:
   - **Neon Dark Cyberpunk Theme** (Default): Pure futuristic dark background (#050510) combined with translucent glass cards ("glass" class with backdrop-blur, subtle white borders \`border-white/10\`), and cyan/purple glowing neon elements.
   - **Classic Light Theme**: Sleek off-white backgrounds, pristine high-contrast borders, and professional grid layouts.
   - **Arabic First RTL Layout**: By default, the application is tailored for right-to-left languages (Arabic), with clear alignments, robust Arabic copywriting, and intuitive spacing.
5. **Modularity**: Split code cleanly into directories: \`/src/components/\`, \`/src/pages/\`, \`/src/lib/\`, and \`/src/types.ts\`. Avoid bundling all logic into \`App.tsx\`.

---

### Core Database & Crypto Architecture (\`/src/lib/\`)
1. **Local State Engine (\`db.ts\`)**:
   - Provide a persistent local database wrapper utilizing the browser's \`localStorage\`.
   - Standard collections to initialize: \`credentials\`, \`ai_agents\`, \`servers\`, \`free_servers\`, \`huggingface\`, \`links\`, \`activity_log\`, and \`settings\`.
   - Expose CRUD helpers: \`getCollection<T>(key)\`, \`addItem<T>(key, item)\`, \`updateItem<T>(key, id, updatedFields)\`, \`deleteItem<T>(key, id)\`, and \`getCollectionStats()\`.
   - Seed database with a rich set of preloaded dummy data on the first run (e.g., standard AI providers, free hosting services, and preloaded system logs) to ensure a high-fidelity starting experience.
2. **Crypto Helpers (\`crypto.ts\`)**:
   - Create a lightweight encryption and decryption utility (e.g., dynamic password-based simulation or custom base64-AES transformations) to secure sensitive tokens.
   - Credentials saved by users must have their primary token encrypted before saving in \`localStorage\`, and decrypted only on demand (on-click reveal or clipboard copy) for safety.

---

### Main Views & Pages (\`/src/pages/\`)

#### 1. Login Gate (\`Login.tsx\`)
- A secure splash gateway protecting the application.
- Prompt the user for a secure PIN or password.
- Store authentication state inside \`sessionStorage\` (\`vault_auth\`) to safeguard data during a browser session.
- Stylish background with grid elements and futuristic key graphics.

#### 2. Layout & Drawer Wrapper (\`Layout.tsx\`)
- Persistent sidebar navigation containing Arabic options:
  - Dashboard (لوحة التحكم)
  - Manage Keys (إدارة المفاتيح)
  - AI Agents (الوكلاء الذكيون)
  - Servers (الخوادم)
  - Useful Links (الروابط)
  - Hugging Face (هانجينج فيس)
  - Free Platforms (الخوادم المجانية)
  - Prompts Page (البرومبتات)
  - Settings (الإعدادات)
- A header holding a responsive mobile-menu drawer toggle, a theme switcher (Sun/Moon), and system version indicator (V17.5.5).

#### 3. Analytics Dashboard (\`Dashboard.tsx\`)
- Dynamic metric summary counters: Saved Credentials, AI Agents, Active Servers, Bookmarked Links, HF Resources, and Free Hosting Platforms.
- **Data Visualizations** (powered by Recharts):
  - **Pie Chart**: Visualizing the distribution of hosting platforms by type (Static, Backend, Database, AI/ML, Container, etc.).
  - **Bar Chart**: A 7-day chronological bar chart displaying daily developer activity volumes (additions, credential lookups, changes).
- **Recent Activities Log**: Scrollable feed showing recent operations (timestamps, entity category, description) fetched dynamically from the database.

#### 4. Credentials Manager (\`Credentials.tsx\`)
- A detailed listing table for API Keys, databases, and passwords.
- Real-time search filter and category classification tags.
- Secure token viewing: Masked characters ("••••••••••••") decrypted on-the-fly and revealed via an eye toggle icon, or copied to the clipboard with visual success feedback.
- "Add Credential" modal/inline form including: Name, Primary Token, Category, and a reusable **Custom Fields Editor** (enabling users to append custom key-value pairs to each item).

#### 5. AI Agents Panel (\`AIAgents.tsx\`)
- Showcase 33+ preloaded AI model providers in a gorgeous grid.
- Each card holds model developer name, primary endpoint URL, underlying model tags (e.g., Llama, Gemini Pro, GPT-4), active status toggle, and custom metadata fields.
- Full CRUD wrapper to add/edit customizable AI agents.

#### 6. Servers Manager (\`Servers.tsx\`)
- Grid cards for developer VPS/Bare-metal machines.
- Features: Host IP address, custom SSH port, root/username, Operating System, and online/offline status glowing bullet indicators.
- Simulated interactive action button like opening a terminal view (SSH trigger) or reloading stats.
- Integrated Custom Fields Editor to attach private parameters.

#### 7. Free Hosting Platforms (\`FreeServers.tsx\`)
- A reference tracker log for free deployment environments.
- Fields: Provider name, deployment type (Static, Container, Serverless Database, etc.), descriptions, direct signup links, free-tier limitations (e.g., 500MB RAM, 100GB Bandwidth), active status, and custom fields.

#### 8. Hugging Face Directory (\`HuggingFace.tsx\`)
- Curate favorite Models, Spaces, or Datasets from Hugging Face.
- Track resource namespace identifiers, total community downloads, likes count, category tags, and custom fields.

#### 9. Links Bookmark Vault (\`Links.tsx\`)
- Centralized hub for developer documentation, standard tools, and code repositories.
- Categorized search, tags, rapid redirection links, click count tracker, and custom metadata entries.

#### 10. Developer Prompts Portal (\`Prompts.tsx\`)
- A dedicated layout allowing users to read, copy, edit, and download this exact markdown configuration script.
- Support options to save as a \`.txt\` file or open/upload directly to cloud workspaces (like Google Drive).

#### 11. Core Configuration & Safety (\`Settings.tsx\`)
- Manage active theme properties and interface configurations.
- **Database Backup Engine**:
  - **Export JSON**: One-click handler compiling the entire database state into a downloadable JSON backup.
  - **Import JSON**: File upload input allowing developers to restore/import databases to easily duplicate or backup their system instantly.

---

### Reusable Utilities & Components (\`/src/components/\`)
1. **Custom Fields Editor (\`CustomFieldsEditor.tsx\`)**:
   - An interactive component rendering a list of key-value pairs.
   - Provides a fast interface to add, edit, or delete additional attributes dynamically for any entity form (Credentials, AI Agents, Servers, Links, etc.).
`;

  const [appPrompt, setAppPrompt] = useState(englishPrompt);
  const [savingToDrive, setSavingToDrive] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(appPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([appPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Secure_Vault_System_Clone_Prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert(uiLanguage === 'ar' 
        ? 'يرجى تسجيل الدخول أولاً في صفحة بوابة السحابة وWorkspace!' 
        : 'Please sign in first on the Cloud & Workspace Portal page!');
      return;
    }
    setSavingToDrive(true);
    try {
      const metadata = {
        name: 'Secure_Vault_Clone_Prompt.txt',
        mimeType: 'text/plain'
      };
      const fileBlob = new Blob([appPrompt], { type: 'text/plain' });
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', fileBlob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        alert(uiLanguage === 'ar' 
          ? 'تم حفظ البرومبت بنجاح في Google Drive!' 
          : 'Prompt successfully saved to Google Drive!');
      } else {
        const err = await res.json();
        throw new Error(err.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      alert(uiLanguage === 'ar' 
        ? `فشل حفظ الملف في درايف: ${err.message}` 
        : `Failed to save file to Drive: ${err.message}`);
    } finally {
      setSavingToDrive(false);
    }
  };

  const translations = {
    ar: {
      title: 'برومبت استنساخ البرنامج الشامل',
      desc: 'البرومبت (Prompt) المطور بالكامل باللغة الإنجليزية، والمصمم لتمكين أي وكيل ذكاء اصطناعي آخر من بناء وتكرار هذا البرنامج بجميع ميزاته وخصائصه بدقة.',
      copyBtn: 'نسخ البرومبت',
      downloadBtn: 'تحميل كملف .txt',
      googleDriveBtn: 'حفظ في Google Drive',
      editableLabel: 'هذا البرومبت قابل للتعديل والتخصيص',
      fileName: 'Secure_Vault_Clone_Prompt.txt'
    },
    en: {
      title: 'Comprehensive App Cloning Prompt',
      desc: 'The fully structured English system prompt designed to empower any other AI agent to clone and build this application with all its features and modules accurately.',
      copyBtn: 'Copy Prompt',
      downloadBtn: 'Download as .txt',
      googleDriveBtn: 'Save to Google Drive',
      editableLabel: 'This prompt text is editable and customizable',
      fileName: 'Secure_Vault_Clone_Prompt.txt'
    }
  };

  const t = translations[uiLanguage];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <button
              onClick={() => setUiLanguage(uiLanguage === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 text-gray-300 transition-colors"
              title="تغيير لغة الواجهة / Toggle UI Language"
            >
              <Globe size={14} className="text-[var(--color-neon-blue)]" />
              <span>{uiLanguage === 'ar' ? 'English UI' : 'الواجهة العربية'}</span>
            </button>
          </div>
          <p className="text-gray-400 mt-1 text-sm max-w-2xl leading-relaxed">{t.desc}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2 bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] rounded-lg hover:bg-[rgba(0,255,255,0.2)] transition-colors whitespace-nowrap font-bold"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {t.copyBtn}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2 bg-[rgba(139,92,246,0.1)] text-[var(--color-neon-purple)] rounded-lg hover:bg-[rgba(139,92,246,0.2)] transition-colors whitespace-nowrap font-bold"
          >
            <Download size={18} />
            {t.downloadBtn}
          </button>
        </div>
      </div>

      <div className="glass card-glow border border-white/10 rounded-2xl overflow-hidden flex flex-col light:bg-light-card light:border-gray-200 animate-fadeIn">
        <div className="bg-black/40 light:bg-gray-100 border-b border-white/10 light:border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-300 light:text-gray-600 font-mono text-sm">
            <FileText size={16} className="text-[var(--color-neon-blue)]" />
            <span>{t.fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSaveToDrive}
              disabled={savingToDrive}
              className="flex items-center justify-center gap-2 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-2 sm:py-1.5 rounded-lg transition-all border border-cyan-500/20"
              title="حفظ البرومبت مباشرة في Google Drive الخاص بك"
            >
              {savingToDrive ? (
                <RefreshCw size={14} className="animate-spin text-cyan-400" />
              ) : (
                <Cloud size={14} className="text-cyan-400 animate-pulse" />
              )}
              <span>{t.googleDriveBtn}</span>
            </button>
          </div>
        </div>
        <div className="p-0 relative group">
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="flex items-center gap-1 text-xs bg-black/50 text-gray-400 px-2 py-1 rounded">
              <Edit2 size={12} /> {t.editableLabel}
            </span>
          </div>
          <textarea 
            value={appPrompt}
            onChange={(e) => setAppPrompt(e.target.value)}
            className="w-full h-[60vh] min-h-[400px] bg-[#0A0A15]/80 light:bg-white text-gray-300 light:text-gray-800 font-mono text-sm sm:text-base p-6 focus:outline-none resize-y leading-relaxed"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
