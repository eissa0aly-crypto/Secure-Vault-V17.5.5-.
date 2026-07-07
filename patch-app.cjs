const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import Prompts')) {
  code = code.replace(
    "import Settings from './pages/Settings';",
    "import Settings from './pages/Settings';\nimport Prompts from './pages/Prompts';"
  );
}

if (!code.includes('<Route path="/prompts" element={<Prompts />} />')) {
  code = code.replace(
    '<Route path="/settings" element={<Settings />} />',
    '<Route path="/settings" element={<Settings />} />\n          <Route path="/prompts" element={<Prompts />} />'
  );
}

fs.writeFileSync('src/App.tsx', code);
