const fs = require('fs');
let code = fs.readFileSync('src/pages/AIAgents.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { Search, ExternalLink, Bot, CheckCircle2, Star, ShieldAlert } from \"lucide-react\";",
  "import { Search, ExternalLink, Bot, CheckCircle2, Star, ShieldAlert, Plus, X } from \"lucide-react\";\nimport CustomFieldsEditor from '../components/CustomFieldsEditor';\nimport { addItem } from '../lib/db';"
);

// Add state
code = code.replace(
  "const [searchTerm, setSearchTerm] = useState(\"\");",
  "const [searchTerm, setSearchTerm] = useState(\"\");\n  const [showAddForm, setShowAddForm] = useState(false);\n  const [newAgent, setNewAgent] = useState({ name: '', provider: '', url: '', modelName: '', apiKey: '', customFields: [] });"
);

// Add handle function
code = code.replace(
  "useEffect(() => {",
  "const handleAddAgent = (e) => {\n    e.preventDefault();\n    addItem('ai_agents', { ...newAgent, status: 'active', isFavorite: false });\n    setAgents(getCollection('ai_agents'));\n    setShowAddForm(false);\n    setNewAgent({ name: '', provider: '', url: '', modelName: '', apiKey: '', customFields: [] });\n  };\n\n  useEffect(() => {"
);

// Replace search box
const searchBoxStr = `<div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث عن وكيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] transition-all"
          />
          <Search
            size={18}
            className="absolute top-2.5 right-3 text-gray-400"
          />
        </div>
      </div>`;

const patchStr = fs.readFileSync('patch.txt', 'utf8');
code = code.replace(searchBoxStr, patchStr);

fs.writeFileSync('src/pages/AIAgents.tsx', code);
