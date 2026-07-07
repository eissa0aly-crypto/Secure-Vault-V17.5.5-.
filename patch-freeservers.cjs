const fs = require('fs');
let code = fs.readFileSync('src/pages/FreeServers.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { Search, ExternalLink, Shield, Database, LayoutTemplate, Box, Server, CheckCircle2, XCircle, Bot } from \"lucide-react\";",
  "import { Search, ExternalLink, Shield, Database, LayoutTemplate, Box, Server, CheckCircle2, XCircle, Bot, Plus, X } from \"lucide-react\";\nimport CustomFieldsEditor from '../components/CustomFieldsEditor';\nimport { addItem } from '../lib/db';"
);

// Add state
code = code.replace(
  "const [searchTerm, setSearchTerm] = useState(\"\");",
  "const [searchTerm, setSearchTerm] = useState(\"\");\n  const [showAddForm, setShowAddForm] = useState(false);\n  const [newServer, setNewServer] = useState({ name: '', type: 'static', description: '', website: '', signupUrl: '', freeTierDetails: '', customFields: [] });"
);

// Add handle function
code = code.replace(
  "useEffect(() => {",
  "const handleAddServer = (e) => {\n    e.preventDefault();\n    addItem('free_servers', { ...newServer, status: 'active', limits: { storage: '', bandwidth: '', requests: '', builds: '' }, tags: [], isFavorite: false, notes: '', docsUrl: '' });\n    setServers(getCollection('free_servers'));\n    setShowAddForm(false);\n    setNewServer({ name: '', type: 'static', description: '', website: '', signupUrl: '', freeTierDetails: '', customFields: [] });\n  };\n\n  useEffect(() => {"
);

// Replace search box
const searchBoxStr = `<div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث عن منصة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)] focus:ring-1 focus:ring-[var(--color-neon-blue)] transition-all"
          />
          <Search size={18} className="absolute top-2.5 right-3 text-gray-400" />
        </div>
      </div>`;

const patchStr = `        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث عن منصة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)] focus:ring-1 focus:ring-[var(--color-neon-blue)] transition-all"
            />
            <Search size={18} className="absolute top-2.5 right-3 text-gray-400" />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] rounded-lg hover:bg-[rgba(0,255,255,0.2)] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            إضافة منصة
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass card-glow border border-[var(--color-neon-blue)] rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">إضافة منصة مجانية جديدة</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddServer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">الاسم</label>
              <input required type="text" value={newServer.name} onChange={e => setNewServer({...newServer, name: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">النوع</label>
              <select value={newServer.type} onChange={e => setNewServer({...newServer, type: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white">
                <option value="static">استضافة ثابتة</option>
                <option value="fullstack">تطبيقات كاملة</option>
                <option value="backend">خلفية (Backend)</option>
                <option value="database">قواعد بيانات</option>
                <option value="ai_ml">الذكاء الاصطناعي</option>
                <option value="container">حاويات (Containers)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">الوصف</label>
              <input required type="text" value={newServer.description} onChange={e => setNewServer({...newServer, description: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الموقع الإلكتروني</label>
              <input required type="url" value={newServer.website} onChange={e => setNewServer({...newServer, website: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">رابط التسجيل</label>
              <input type="url" value={newServer.signupUrl} onChange={e => setNewServer({...newServer, signupUrl: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">تفاصيل الخطة المجانية</label>
              <input required type="text" value={newServer.freeTierDetails} onChange={e => setNewServer({...newServer, freeTierDetails: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" placeholder="مثال: مساحة 500MB، باندويث 1GB/month" />
            </div>
            <div className="md:col-span-2">
              <CustomFieldsEditor 
                customFields={newServer.customFields} 
                onChange={(fields) => setNewServer({...newServer, customFields: fields})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-[var(--color-neon-blue)] text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition-colors">
                حفظ المنصة
              </button>
            </div>
          </form>
        </div>
      )}`;

code = code.replace(searchBoxStr, patchStr);

fs.writeFileSync('src/pages/FreeServers.tsx', code);
