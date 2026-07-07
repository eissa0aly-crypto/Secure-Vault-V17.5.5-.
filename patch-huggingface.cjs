const fs = require('fs');
let code = fs.readFileSync('src/pages/HuggingFace.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { Search, Download, Heart, Cpu, ExternalLink } from \"lucide-react\";",
  "import { Search, Download, Heart, Cpu, ExternalLink, Plus, X } from \"lucide-react\";\nimport CustomFieldsEditor from '../components/CustomFieldsEditor';\nimport { addItem } from '../lib/db';"
);

// Add state
code = code.replace(
  "const [searchTerm, setSearchTerm] = useState(\"\");",
  "const [searchTerm, setSearchTerm] = useState(\"\");\n  const [showAddForm, setShowAddForm] = useState(false);\n  const [newResource, setNewResource] = useState({ name: '', spaceId: '', type: 'model', customFields: [] });"
);

// Add handle function
code = code.replace(
  "useEffect(() => {",
  "const handleAddResource = (e) => {\n    e.preventDefault();\n    addItem('huggingface', { ...newResource, status: 'active', likes: 0, downloads: 0 });\n    setResources(getCollection('huggingface'));\n    setShowAddForm(false);\n    setNewResource({ name: '', spaceId: '', type: 'model', customFields: [] });\n  };\n\n  useEffect(() => {"
);

// Replace search box
const searchBoxStr = `<div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
          />
          <Search size={18} className="absolute top-2.5 right-3 text-gray-400" />
        </div>
      </div>`;

const patchStr = `        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
            />
            <Search size={18} className="absolute top-2.5 right-3 text-gray-400" />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(250,204,21,0.1)] text-yellow-400 rounded-lg hover:bg-[rgba(250,204,21,0.2)] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            إضافة مورد
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass card-glow border border-yellow-400 rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">إضافة مورد Hugging Face</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddResource} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">الاسم</label>
              <input required type="text" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">المعرف (Space/Model ID)</label>
              <input required type="text" value={newResource.spaceId} onChange={e => setNewResource({...newResource, spaceId: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" placeholder="e.g. meta-llama/Llama-3.2-3B" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">النوع</label>
              <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white">
                <option value="model">نموذج (Model)</option>
                <option value="space">مساحة (Space)</option>
                <option value="dataset">مجموعة بيانات (Dataset)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <CustomFieldsEditor 
                customFields={newResource.customFields} 
                onChange={(fields) => setNewResource({...newResource, customFields: fields})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-300 transition-colors">
                حفظ المورد
              </button>
            </div>
          </form>
        </div>
      )}`;

code = code.replace(searchBoxStr, patchStr);

fs.writeFileSync('src/pages/HuggingFace.tsx', code);
