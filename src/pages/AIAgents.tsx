import CustomFieldsEditor from '../components/CustomFieldsEditor';
import React, { useState, useEffect } from "react";
import { getCollection, addItem } from "../lib/db";
import { AIAgent } from "../types";
import {
  Search,
  ExternalLink,
  Bot,
  CheckCircle2,
  Star,
  ShieldAlert, Plus, X } from "lucide-react";

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', provider: '', url: '', modelName: '', apiKey: '', customFields: [] });

  const handleAddAgent = (e) => {
    e.preventDefault();
    addItem('ai_agents', { ...newAgent, status: 'active', isFavorite: false });
    setAgents(getCollection('ai_agents'));
    setShowAddForm(false);
    setNewAgent({ name: '', provider: '', url: '', modelName: '', apiKey: '', customFields: [] });
  };

  useEffect(() => {
    setAgents(getCollection<AIAgent>("ai_agents"));
  }, []);

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.provider.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">الوكلاء الذكيون (AI Agents)</h2>
          <p className="text-gray-400">إدارة 33+ مزود نماذج ذكاء اصطناعي</p>
        </div>
                <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
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
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(139,92,246,0.1)] text-[var(--color-neon-purple)] rounded-lg hover:bg-[rgba(139,92,246,0.2)] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            إضافة وكيل
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass card-glow border border-[var(--color-neon-purple)] rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">إضافة وكيل ذكاء اصطناعي</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">الاسم</label>
              <input required type="text" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">المزود (Provider)</label>
              <input required type="text" value={newAgent.provider} onChange={e => setNewAgent({...newAgent, provider: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الرابط (URL)</label>
              <input type="url" value={newAgent.url} onChange={e => setNewAgent({...newAgent, url: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">اسم النموذج (Model Name)</label>
              <input type="text" value={newAgent.modelName} onChange={e => setNewAgent({...newAgent, modelName: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">مفتاح API الأساسي (اختياري)</label>
              <input type="password" value={newAgent.apiKey} onChange={e => setNewAgent({...newAgent, apiKey: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <CustomFieldsEditor 
                customFields={newAgent.customFields} 
                onChange={(fields) => setNewAgent({...newAgent, customFields: fields})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-[var(--color-neon-purple)] text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-500 transition-colors">
                حفظ الوكيل
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent, index) => (
          <div
            key={agent.id}
            className="glass border border-[rgba(255,255,255,0.05)] rounded-xl p-5 card-glow group flex flex-col light:bg-light-card light:border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[var(--color-neon-purple)] relative">
                <span className="absolute -top-2 -right-2 bg-[var(--color-neon-purple)] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-black/20">
                  {index + 1}
                </span>
                <Bot size={24} />
              </div>
              <div className="flex gap-2">
                {agent.isFavorite && (
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                )}
                <a
                  href={agent.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-[var(--color-neon-purple)] transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-1 group-hover:text-[var(--color-neon-purple)] transition-colors">
              {agent.name}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded text-gray-300">
                {agent.provider}
              </span>
              <span className="text-xs bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded text-gray-300 font-mono">
                {agent.modelName}
              </span>
            </div>

            <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between items-center">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                {agent.status === "active" ? (
                  <CheckCircle2
                    size={14}
                    className="text-[var(--color-neon-green)]"
                  />
                ) : (
                  <ShieldAlert size={14} className="text-gray-500" />
                )}
                {agent.status === "active" ? "نشط" : "غير نشط"}
              </span>
              <button className="text-xs font-medium bg-[rgba(139,92,246,0.1)] text-[var(--color-neon-purple)] px-3 py-1 rounded hover:bg-[rgba(139,92,246,0.2)] transition-colors">
                تكوين
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
