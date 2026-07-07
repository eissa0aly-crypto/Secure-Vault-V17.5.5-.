import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Key, Bot, Server, Link as LinkIcon, 
  Settings, LogOut, User, Cpu, Database, Menu, X, FileText, Briefcase
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('vault_v17_5_5_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed[0]?.theme === 'light') {
        document.documentElement.classList.add('light');
        setTheme('light');
      }
    }
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    setTheme(newTheme);
    const savedSettings = localStorage.getItem('vault_v17_5_5_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      parsed[0].theme = newTheme;
      localStorage.setItem('vault_v17_5_5_settings', JSON.stringify(parsed));
    }
  };

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'إدارة المفاتيح', path: '/credentials', icon: <Key size={20} /> },
    { name: 'قواعد البيانات', path: '/databases', icon: <Database size={20} /> },
    { name: 'الوكلاء الذكيون', path: '/ai-agents', icon: <Bot size={20} /> },
    { name: 'الخوادم', path: '/servers', icon: <Server size={20} /> },
    { name: 'الروابط', path: '/links', icon: <LinkIcon size={20} /> },
    { name: 'هانجينج فيس', path: '/huggingface', icon: <Cpu size={20} /> },
    { name: 'الخوادم المجانية', path: '/free-servers', icon: <Database size={20} /> },
    { name: 'البرومبتات', path: '/prompts', icon: <FileText size={20} /> },
    { name: 'بوابة السحابة وWorkspace', path: '/workspace', icon: <Briefcase size={20} /> },
    { name: 'الإعدادات', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden grid-bg relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 right-0 z-50 w-64 flex flex-col glass border-l border-white/10 light:bg-light-card light:border-[rgba(0,85,255,0.1)] transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10 relative">
          <div className="w-10 h-10 rounded-xl neon-bg-cyan flex items-center justify-center">
            <Key size={24} className="text-black" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight neon-text-cyan">Secure Vault</h1>
            <p className="text-[10px] text-[var(--color-neon-blue)] uppercase tracking-widest opacity-80">V17.5.5</p>
          </div>
          <button 
            className="md:hidden absolute top-6 left-4 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] neon-border' 
                    : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-[#FF0044] hover:bg-[rgba(255,0,68,0.1)] transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full">
        <header className="absolute top-0 right-0 left-0 h-16 glass border-b border-white/10 flex justify-between items-center px-4 md:px-8 z-30">
          <div className="flex-1 pointer-events-auto flex items-center gap-4">
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            {/* Context title could go here */}
          </div>
          <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button className="flex items-center gap-2 p-2 rounded-full hover:bg-white/5 transition-colors">
                 <User size={20} />
              </button>
            </div>
            <div className="hidden sm:block px-3 py-1 neon-bg-cyan text-black text-[10px] font-bold rounded neon-border">
              🔐 V17.5.5
            </div>
          </div>
        </header>
        <div className="pt-20 px-4 md:px-8 pb-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
