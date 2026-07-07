import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initDatabase } from './lib/db';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import Databases from './pages/Databases';
import FreeServers from './pages/FreeServers';
import AIAgents from './pages/AIAgents';
import Servers from './pages/Servers';
import Links from './pages/Links';
import HuggingFace from './pages/HuggingFace';

import Settings from './pages/Settings';
import Prompts from './pages/Prompts';
import Workspace from './pages/Workspace';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await initDatabase();
      setIsDbReady(true);
    };
    setup();

    const auth = sessionStorage.getItem('vault_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center grid-bg">
        <div className="w-16 h-16 border-4 border-[var(--color-neon-cyan)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('vault_auth');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/credentials" element={<Credentials />} />
          <Route path="/databases" element={<Databases />} />
          <Route path="/ai-agents" element={<AIAgents />} />
          <Route path="/free-servers" element={<FreeServers />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/links" element={<Links />} />
          <Route path="/huggingface" element={<HuggingFace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
