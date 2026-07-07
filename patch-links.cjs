const fs = require('fs');
let code = fs.readFileSync('src/pages/Links.tsx', 'utf8');

// Add import
if (!code.includes('CustomFieldsEditor')) {
  code = code.replace(
    "import { Search, Link as LinkIcon, ExternalLink, Bookmark, Github, BookOpen, Code, TerminalSquare, Plus, X } from \"lucide-react\";",
    "import { Search, Link as LinkIcon, ExternalLink, Bookmark, Github, BookOpen, Code, TerminalSquare, Plus, X } from \"lucide-react\";\nimport CustomFieldsEditor from '../components/CustomFieldsEditor';"
  );
}

// Add state
code = code.replace(
  "const [newLink, setNewLink] = useState({ name: '', url: '', type: 'docs', category: 'Frontend', tags: '' });",
  "const [newLink, setNewLink] = useState({ name: '', url: '', type: 'docs', category: 'Frontend', tags: '', customFields: [] });"
);

// Add to handle function
code = code.replace(
  "isFavorite: false",
  "isFavorite: false,\n      customFields: newLink.customFields"
);
code = code.replace(
  "setNewLink({ name: '', url: '', type: 'docs', category: 'Frontend', tags: '' });",
  "setNewLink({ name: '', url: '', type: 'docs', category: 'Frontend', tags: '', customFields: [] });"
);

// Add custom fields editor to form
const beforeSubmit = `<div className="md:col-span-2 flex justify-end">`;
const customFieldsJSX = `<div className="md:col-span-2">
              <CustomFieldsEditor 
                customFields={newLink.customFields} 
                onChange={(fields) => setNewLink({...newLink, customFields: fields})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">`;
code = code.replace(beforeSubmit, customFieldsJSX);

fs.writeFileSync('src/pages/Links.tsx', code);
