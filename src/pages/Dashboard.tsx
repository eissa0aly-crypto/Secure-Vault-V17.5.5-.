import React, { useEffect, useState } from 'react';
import { getCollectionStats, getCollection } from '../lib/db';
import { Key, Bot, Server, Link, Database, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FreeServer, ActivityLog } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    credentials: 0,
    aiAgents: 0,
    servers: 0,
    links: 0,
    freeServers: 0,
    huggingFace: 0,
    databases: 0
  });
  
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  const [barData, setBarData] = useState<{name: string, keys: number}[]>([]);

  useEffect(() => {
    setStats(getCollectionStats());
    
    // Real Pie Data from Free Servers
    const servers = getCollection<FreeServer>('free_servers');
    const typeCount: Record<string, number> = {};
    servers.forEach(s => {
      const type = s.type === 'static' ? 'Static' : s.type === 'fullstack' ? 'Fullstack' : s.type === 'database' ? 'Database' : s.type === 'ai_ml' ? 'AI/ML' : 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    setPieData(Object.keys(typeCount).map(k => ({ name: k, value: typeCount[k] })).filter(item => item.value > 0));

    // Real Bar Data from Activity Logs for the last 7 days
    const logs = getCollection<ActivityLog>('activity_log');
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    const dayCounts: Record<string, number> = {};
    last7Days.forEach(d => dayCounts[d] = 0);
    
    logs.forEach(log => {
      if (log.entityType === 'credentials') {
        const d = log.createdAt.split('T')[0];
        if (dayCounts[d] !== undefined) {
          dayCounts[d]++;
        }
      }
    });
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setBarData(last7Days.map(d => ({
      name: dayNames[new Date(d).getDay()],
      keys: dayCounts[d]
    })));
  }, []);

  const statCards = [
    { label: 'إجمالي المفاتيح', value: stats.credentials, icon: <Key size={24} />, color: 'var(--color-neon-blue)' },
    { label: 'قواعد البيانات', value: stats.databases, icon: <Database size={24} />, color: 'var(--color-neon-cyan)' },
    { label: 'الوكلاء الذكيون', value: stats.aiAgents, icon: <Bot size={24} />, color: 'var(--color-neon-purple)' },
    { label: 'الخوادم', value: stats.servers, icon: <Server size={24} />, color: 'var(--color-neon-green)' },
    { label: 'الروابط', value: stats.links, icon: <Link size={24} />, color: 'var(--color-neon-pink)' },
    { label: 'هانجينج فيس', value: stats.huggingFace, icon: <Cpu size={24} />, color: 'var(--color-neon-orange)' },
    { label: 'الاستضافة المجانية', value: stats.freeServers, icon: <Database size={24} />, color: 'var(--color-neon-blue)' },
  ];

  const COLORS = ['#00FFFF', '#8B5CF6', '#39FF14', '#FF00FF', '#FF6600'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحة التحكم</h2>
          <p className="text-gray-400">مرحباً بك في منصة Secure Vault V17.5.5</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="glass card-glow border border-[rgba(255,255,255,0.05)] rounded-xl p-4 flex flex-col light:bg-light-card light:border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-400 font-medium">{card.label}</p>
              <div style={{ color: card.color }}>{card.icon}</div>
            </div>
            <h3 className="text-3xl font-bold mt-auto" style={{ textShadow: `0 0 10px ${card.color}40` }}>{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass card-glow border border-[rgba(255,255,255,0.05)] rounded-xl p-6 light:bg-light-card light:border-gray-200 h-80">
          <h3 className="text-lg font-bold mb-4">نشاط المفاتيح (آخر 7 أيام)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0A0A1A', border: '1px solid rgba(0,255,255,0.2)'}} />
              <Bar dataKey="keys" fill="var(--color-neon-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass card-glow border border-[rgba(255,255,255,0.05)] rounded-xl p-6 light:bg-light-card light:border-gray-200 h-80">
          <h3 className="text-lg font-bold mb-4">توزيع المنصات المجانية</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: '#0A0A1A', border: '1px solid rgba(0,255,255,0.2)'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
