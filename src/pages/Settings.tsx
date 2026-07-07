import React, { useState, useEffect } from 'react';
import { getCollection, updateItem } from '../lib/db';
import { Save, Shield, Database, Palette, Globe, HardDrive } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const data = getCollection<any>('settings');
    if (data.length > 0) {
      setSettings(data[0]);
    }
  }, []);

  const handleSave = () => {
    if (settings) {
      updateItem('settings', settings.id, settings);
      alert('تم حفظ الإعدادات بنجاح!');
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">الإعدادات</h2>
          <p className="text-gray-400">تخصيص التطبيق وقواعد البيانات</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-neon-blue)] text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
        >
          <Save size={18} />
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass card-glow border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="text-[var(--color-neon-blue)]" />
            <h3 className="text-lg font-bold">المظهر واللغة</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">المظهر (Theme)</label>
              <select 
                value={settings.theme}
                onChange={e => setSettings({...settings, theme: e.target.value})}
                className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
              >
                <option value="dark">داكن (Dark)</option>
                <option value="light">مضيء (Light)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">اللغة (Language)</label>
              <select 
                value={settings.language}
                onChange={e => setSettings({...settings, language: e.target.value})}
                className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="en">English (الإنجليزية)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass card-glow border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-[var(--color-neon-purple)]" />
            <h3 className="text-lg font-bold">الأمان والنسخ الاحتياطي</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.autoBackup}
                onChange={e => setSettings({...settings, autoBackup: e.target.checked})}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-[var(--color-neon-blue)] focus:ring-[var(--color-neon-blue)]"
              />
              <span className="text-sm">تفعيل النسخ الاحتياطي التلقائي يومياً</span>
            </label>
            
            <div className="pt-4 border-t border-white/10">
              <button className="w-full flex items-center justify-center gap-2 py-2 border border-[var(--color-neon-purple)] text-[var(--color-neon-purple)] rounded-lg hover:bg-[rgba(139,92,246,0.1)] transition-colors">
                <HardDrive size={18} />
                تصدير قاعدة البيانات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
