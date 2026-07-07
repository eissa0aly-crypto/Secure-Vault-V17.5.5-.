import CustomFieldsEditor from '../components/CustomFieldsEditor';
import React, { useState, useEffect } from 'react';
import { getCollection, addItem } from "../lib/db";
import { Server } from '../types';
import { Search, Server as ServerIcon, Globe, Terminal, Play, Square, Settings, HardDrive, Cpu, MemoryStick , Plus, X } from "lucide-react";

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', type: 'vps', provider: '', ipAddress: '', port: 22, username: 'root', os: '', customFields: [] });

  const handleAddServer = (e) => {
    e.preventDefault();
    addItem('servers', { ...newServer, status: 'offline' });
    setServers(getCollection('servers'));
    setShowAddForm(false);
    setNewServer({ name: '', type: 'vps', provider: '', ipAddress: '', port: 22, username: 'root', os: '', customFields: [] });
  };

  useEffect(() => {
    setServers(getCollection<Server>('servers'));
  }, []);

  const filtered = servers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ipAddress.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة الخوادم</h2>
          <p className="text-gray-400">مراقبة وإدارة الخوادم الخاصة بك</p>
        </div>
                <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)] focus:ring-1 focus:ring-[var(--color-neon-blue)] transition-all"
            />
            <Search size={18} className="absolute top-2.5 right-3 text-gray-400" />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] rounded-lg hover:bg-[rgba(0,255,255,0.2)] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            إضافة خادم
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass card-glow border border-[var(--color-neon-blue)] rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">إضافة خادم جديد</h3>
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
              <label className="block text-sm text-gray-400 mb-1">المزود (Provider)</label>
              <input required type="text" value={newServer.provider} onChange={e => setNewServer({...newServer, provider: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">IP Address</label>
              <input required type="text" value={newServer.ipAddress} onChange={e => setNewServer({...newServer, ipAddress: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Port</label>
              <input required type="number" value={newServer.port} onChange={e => setNewServer({...newServer, port: parseInt(e.target.value)})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input required type="text" value={newServer.username} onChange={e => setNewServer({...newServer, username: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">OS (نظام التشغيل)</label>
              <input type="text" value={newServer.os} onChange={e => setNewServer({...newServer, os: e.target.value})} className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white text-left" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <CustomFieldsEditor 
                customFields={newServer.customFields} 
                onChange={(fields) => setNewServer({...newServer, customFields: fields})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-[var(--color-neon-blue)] text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition-colors">
                حفظ الخادم
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(server => (
          <div key={server.id} className="glass card-glow border border-white/10 rounded-2xl p-5 flex flex-col relative overflow-hidden group">
            {/* Background Glow based on status */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${server.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-neon-blue)] group-hover:neon-border transition-all">
                  <ServerIcon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{server.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{server.ipAddress}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-white transition-colors" title="إعدادات">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-1">المزود</p>
                <p className="text-sm font-medium">{server.provider}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-1">نظام التشغيل</p>
                <p className="text-sm font-medium truncate">{server.os || 'Unknown'}</p>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-center relative z-10 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${server.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></div>
                <span className="text-xs font-medium">{server.status === 'online' ? 'متصل' : 'غير متصل'}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] text-xs font-bold hover:bg-[rgba(0,255,255,0.2)] transition-colors">
                  <Terminal size={14} />
                  SSH
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
