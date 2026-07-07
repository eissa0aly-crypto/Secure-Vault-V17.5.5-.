import CustomFieldsEditor from '../components/CustomFieldsEditor';
import React, { useState, useEffect } from 'react';
import { getCollection, addItem } from "../lib/db";
import { HuggingFaceResource } from '../types';
import { Search, Download, Heart, Cpu, ExternalLink , Plus, X } from "lucide-react";

export default function HuggingFace() {
  const [resources, setResources] = useState<HuggingFaceResource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResource, setNewResource] = useState({ name: '', spaceId: '', type: 'model', customFields: [] });

  const handleAddResource = (e) => {
    e.preventDefault();
    addItem('huggingface', { ...newResource, status: 'active', likes: 0, downloads: 0 });
    setResources(getCollection('huggingface'));
    setShowAddForm(false);
    setNewResource({ name: '', spaceId: '', type: 'model', customFields: [] });
  };

  useEffect(() => {
    setResources(getCollection<HuggingFaceResource>('huggingface'));
  }, []);

  const filtered = resources.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.spaceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">🤗</span> موارد Hugging Face
          </h2>
          <p className="text-gray-400">إدارة النماذج والمساحات المفضلة</p>
        </div>
                <div className="flex gap-4 w-full sm:w-auto">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(resource => (
          <div key={resource.id} className="glass card-glow border border-white/10 rounded-xl p-5 flex flex-col group hover:border-yellow-400/50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-yellow-400 transition-colors">{resource.name}</h3>
                  <p className="text-xs text-gray-400 font-mono" dir="ltr">{resource.spaceId}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Heart size={14} className="text-red-400" />
                <span>{resource.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Download size={14} className="text-blue-400" />
                <span>{(resource.downloads / 1000).toFixed(1)}k</span>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">
                {resource.type === 'model' ? 'نموذج (Model)' : resource.type === 'space' ? 'مساحة (Space)' : 'مجموعة بيانات (Dataset)'}
              </span>
              <a 
                href={`https://huggingface.co/${resource.spaceId}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-bold hover:bg-yellow-400/20 transition-colors"
              >
                <ExternalLink size={14} />
                عرض
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
