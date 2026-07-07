import React, { useState } from 'react';
import { Key, Eye, EyeOff, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 5) {
      setError('تم قفل الحساب بسبب كثرة المحاولات. حاول لاحقاً.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate small delay for animation
    await new Promise(r => setTimeout(r, 800));

    if (password === 'Eissa2026') {
      sessionStorage.setItem('vault_auth', 'true');
      onLogin();
    } else {
      setAttempts(prev => prev + 1);
      setError('كلمة المرور غير صحيحة');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-neon-blue)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-neon-purple)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 rounded-2xl glass border border-[rgba(0,255,255,0.2)] backdrop-blur-xl neon-border z-10 relative">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto neon-bg-cyan rounded-2xl flex items-center justify-center mb-4 neon-border">
            <Key size={40} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-2 neon-text-cyan">Secure Vault</h1>
          <p className="text-[var(--color-neon-blue)] font-mono text-sm tracking-widest uppercase opacity-80">v17.5.5 Complete</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور الرئيسية</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Key size={18} className="text-gray-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pr-10 pl-12 text-white focus:outline-none focus:border-[var(--color-neon-blue)] focus:ring-1 focus:ring-[var(--color-neon-blue)] transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-[var(--color-neon-red)] text-sm mt-2">{error}</p>}
            {attempts > 0 && attempts < 5 && (
              <p className="text-gray-400 text-xs mt-1">المحاولات المتبقية: {5 - attempts}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || attempts >= 5}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] hover:from-[#00CCCC] hover:to-[#7A4CF6] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-blue)] focus:ring-offset-2 focus:ring-offset-dark-bg transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
