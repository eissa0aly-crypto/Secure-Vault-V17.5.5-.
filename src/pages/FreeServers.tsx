import CustomFieldsEditor from '../components/CustomFieldsEditor';
import React, { useState, useEffect } from 'react';
import { getCollection, addItem } from "../lib/db";
import { FreeServer } from '../types';
import { Search, ExternalLink, Shield, Database, LayoutTemplate, Box, Server, CheckCircle2, XCircle, Bot , Plus, X } from "lucide-react";

export default function FreeServers() {
  const [servers, setServers] = useState<FreeServer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', type: 'static', description: '', website: '', signupUrl: '', freeTierDetails: '', customFields: [] });

  const handleAddServer = (e) => {
    e.preventDefault();
    addItem('free_servers', { ...newServer, status: 'active', limits: { storage: '', bandwidth: '', requests: '', builds: '' }, tags: [], isFavorite: false, notes: '', docsUrl: '' });
    setServers(getCollection('free_servers'));
    setShowAddForm(false);
    setNewServer({ name: '', type: 'static', description: '', website: '', signupUrl: '', freeTierDetails: '', customFields: [] });
  };

  useEffect(() => {
    setServers(getCollection<FreeServer>('free_servers'));
  }, []);

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'ai_ml': return <Bot size={18} className="text-neon-purple" />;
      case 'static': return <LayoutTemplate size={18} className="text-neon-pink" />;
      case 'backend': return <Server size={18} className="text-neon-blue" />;
      case 'fullstack': return <Box size={18} className="text-neon-green" />;
      case 'database': return <Database size={18} className="text-neon-orange" />;
      default: return <Shield size={18} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'ai_ml': return 'الذكاء الاصطناعي';
      case 'static': return 'الاستضافة الثابتة';
      case 'backend': return 'الاستضافة الخلفية';
      case 'fullstack': return 'تطبيقات كاملة';
      case 'database': return 'قواعد البيانات';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">منصات الاستضافة المجانية</h2>
          <p className="text-gray-400">({servers.length}) منصات متوفرة</p>
        </div>
                <div className="flex gap-4 w-full sm:w-auto">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServers.map((server) => (
          <div key={server.id} className="glass border border-[rgba(255,255,255,0.05)] rounded-xl p-5 card-glow group flex flex-col light:bg-light-card light:border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {/* Wait I need Bot from lucide-react but I didn't import it in this file. Let me just use Shield for ai_ml */}
                {server.type === 'ai_ml' ? <Shield size={18} className="text-[#8B5CF6]"/> : getTypeIcon(server.type)}
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                  {getTypeLabel(server.type)}
                </span>
              </div>
              <div className="flex gap-2">
                <a href={server.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[var(--color-neon-blue)] transition-colors">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            
            <h3 className="font-bold text-lg mb-1 group-hover:text-[var(--color-neon-blue)] transition-colors">{server.name}</h3>
            <p className="text-sm text-gray-400 mb-4 flex-1">{server.description}</p>
            
            <div className="space-y-2 mt-auto">
              <div className="bg-[rgba(0,0,0,0.2)] p-2 rounded border border-[rgba(255,255,255,0.02)]">
                <p className="text-xs text-gray-500 mb-1">تفاصيل الخطة المجانية:</p>
                <p className="text-xs">{server.freeTierDetails}</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {server.status === 'active' ? <CheckCircle2 size={14} className="text-[var(--color-neon-green)]" /> : <XCircle size={14} className="text-gray-500" />}
                  {server.status === 'active' ? 'مفعل' : 'غير مفعل'}
                </span>
                <a 
                  href={server.signupUrl}
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-medium bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] px-3 py-1 rounded hover:bg-[rgba(0,255,255,0.2)] transition-colors"
                >
                  تسجيل
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
