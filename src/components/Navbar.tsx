import React, { useEffect, useState } from 'react';
import {
  Layers,
  Box,
  Compass,
  Cpu,
  Search,
  BookOpen,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Terminal,
} from 'lucide-react';
import { embeddingService, ModelProgress } from '../services/embeddingService';

export type NavTab = 'tokenizer' | 'embedding-lab' | 'vector-space' | 'cosine-similarity' | 'semantic-search' | 'learn';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isDark, setIsDark }) => {
  const [modelProgress, setModelProgress] = useState<ModelProgress>(embeddingService.getStatus());
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const unsubscribe = embeddingService.subscribe((progress) => {
      setModelProgress(progress);
    });
    return unsubscribe;
  }, []);

  const handleWarmupModel = async () => {
    if (modelProgress.status === 'ready' || isInitializing) return;
    setIsInitializing(true);
    try {
      await embeddingService.initModel();
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'tokenizer', label: 'Tokenizer', icon: <Terminal className="w-4 h-4" /> },
    { id: 'embedding-lab', label: 'Embedding Lab', icon: <Layers className="w-4 h-4" /> },
    { id: 'vector-space', label: '3D Vector Space', icon: <Box className="w-4 h-4" />, badge: '3D' },
    { id: 'cosine-similarity', label: 'Similarity Explorer', icon: <Compass className="w-4 h-4" /> },
    { id: 'semantic-search', label: 'Semantic Search', icon: <Search className="w-4 h-4" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-cyan-500/20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('tokenizer')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-shadow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-75" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 text-lg">
                  VECTORVERSE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold uppercase tracking-wider">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight -mt-0.5">
                Inside the Mind of an LLM
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Model Status & Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Model Status Pill */}
            <button
              onClick={handleWarmupModel}
              title={
                modelProgress.status === 'ready'
                  ? 'Model all-MiniLM-L6-v2 active in browser (384D ONNX WASM)'
                  : 'Click to load neural embedding model into browser memory'
              }
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                modelProgress.status === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : modelProgress.status === 'loading'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 animate-pulse'
                  : modelProgress.status === 'error'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300'
              }`}
            >
              {modelProgress.status === 'ready' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">MiniLM 384D</span>
                  <span className="text-[10px] text-emerald-400/80">Ready</span>
                </>
              ) : modelProgress.status === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="hidden sm:inline">Loading</span>
                  <span className="text-[10px]">{modelProgress.progress}%</span>
                </>
              ) : modelProgress.status === 'error' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Model Error</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Neural Model</span>
                  <span className="text-[10px] text-cyan-400 underline">Load</span>
                </>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

