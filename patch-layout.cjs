const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!code.includes("path: '/prompts'")) {
  code = code.replace(
    "import { \n  LayoutDashboard, Key, Bot, Server, Link as LinkIcon, \n  Settings, LogOut, User, Cpu, Database, Menu, X\n} from 'lucide-react';",
    "import { \n  LayoutDashboard, Key, Bot, Server, Link as LinkIcon, \n  Settings, LogOut, User, Cpu, Database, Menu, X, FileText\n} from 'lucide-react';"
  );
  
  code = code.replace(
    "{ name: 'الخوادم المجانية', path: '/free-servers', icon: <Database size={20} /> },",
    "{ name: 'الخوادم المجانية', path: '/free-servers', icon: <Database size={20} /> },\n    { name: 'البرومبتات', path: '/prompts', icon: <FileText size={20} /> },"
  );
}

fs.writeFileSync('src/components/Layout.tsx', code);
