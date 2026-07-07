import CustomFieldsEditor from '../components/CustomFieldsEditor';
import React, { useState, useEffect } from 'react';
import { getCollection, addItem } from '../lib/db';
import { Link as LinkType } from '../types';
import { Search, Link as LinkIcon, ExternalLink, Bookmark, Github, BookOpen, Code, TerminalSquare, Plus, X } from 'lucide-react';

export default function Links() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', type: 'docs', category: 'Frontend', tags: '', customFields: [] });

  useEffect(() => {
    setLinks(getCollection<LinkType>('links'));
  }, []);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const linkData = {
      name: newLink.name,
      url: newLink.url,
      type: newLink.type,
      category: newLink.category,
      tags: newLink.tags.split(',').map(t => t.trim()).filter(t => t),
      visits: 0,
      isFavorite: false,
      customFields: newLink.customFields
    };
    addItem('links', linkData);
    setLinks(getCollection<LinkType>('links'));
    setShowAddForm(false);
    setNewLink({ name: '', url: '', type: 'docs', category: 'Frontend', tags: '', customFields: [] });
  };

  const filtered = links.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'github': return <Github size={20} className="text-gray-300" />;
      case 'docs': return <BookOpen size={20} className="text-blue-400" />;
      case 'huggingface': return <span className="text-xl">🤗</span>;
      case 'code': return <Code size={20} className="text-green-400" />;
      default: return <LinkIcon size={20} className="text-[var(--color-neon-pink)]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">الروابط الهامة</h2>
          <p className="text-gray-400">إدارة الروابط والموارد المحفوظة</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--color-neon-pink)] focus:ring-1 focus:ring-[var(--color-neon-pink)] transition-all"
            />
            <Search size={18} className="absolute top-2.5 right-3 text-gray-400" />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,0,255,0.1)] text-[var(--color-neon-pink)] rounded-lg hover:bg-[rgba(255,0,255,0.2)] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            إضافة رابط
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass card-glow border border-[var(--color-neon-pink)] rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">إضافة رابط جديد</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddLink} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">الاسم</label>
              <input required type="text" value={newLink.name} onChange={e => setNewLink({...newLink, name: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الرابط (URL)</label>
              <input required type="url" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">النوع</label>
              <select value={newLink.type} onChange={e => setNewLink({...newLink, type: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white">
                <option value="docs">مستندات (Docs)</option>
                <option value="github">جيت هاب (GitHub)</option>
                <option value="code">كود (Code)</option>
                <option value="huggingface">Hugging Face</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">التصنيف</label>
              <input type="text" value={newLink.category} onChange={e => setNewLink({...newLink, category: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">الوسوم (مفصول بفاصلة)</label>
              <input type="text" value={newLink.tags} onChange={e => setNewLink({...newLink, tags: e.target.value})} placeholder="react, frontend, tutorial" className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <CustomFieldsEditor 
                customFields={newLink.customFields} 
                onChange={(fields) => setNewLink({...newLink, customFields: fields})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-[var(--color-neon-pink)] text-black px-6 py-2 rounded-lg font-bold hover:bg-pink-400 transition-colors">
                حفظ الرابط
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(link => (
          <div key={link.id} className="glass card-glow border border-white/10 rounded-xl p-5 flex flex-col group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                {getTypeIcon(link.type)}
              </div>
              <button className={`text-gray-400 transition-colors ${link.isFavorite ? 'text-yellow-500' : 'hover:text-white'}`}>
                <Bookmark size={18} className={link.isFavorite ? 'fill-yellow-500' : ''} />
              </button>
            </div>
            
            <h3 className="font-bold text-lg mb-1 group-hover:text-[var(--color-neon-pink)] transition-colors">{link.name}</h3>
            <p className="text-xs text-gray-500 font-mono truncate mb-4" dir="ltr">{link.url}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {link.tags?.map(tag => (
                <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <ExternalLink size={12} />
                <span>{link.visits} زيارة</span>
              </div>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,0,255,0.1)] text-[var(--color-neon-pink)] text-xs font-bold hover:bg-[rgba(255,0,255,0.2)] transition-colors"
              >
                زيارة
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
