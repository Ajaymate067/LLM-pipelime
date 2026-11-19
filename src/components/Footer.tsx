import React from 'react';
import { Sparkles, Terminal, Box, Layers, ShieldCheck, Heart } from 'lucide-react';
import { NavTab } from './Navbar';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 text-xs py-12 mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold tracking-wider text-white font-mono text-sm">
                VECTORVERSE
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-md">
              An interactive educational laboratory designed to illuminate the inner geometric mechanics of Large Language Models: from discrete BPE subwords to 384-dimensional latent manifolds and 3D PCA projection.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real tokenizer & live neural embeddings running locally in-browser</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <span className="text-slate-200 font-mono text-xs font-semibold uppercase tracking-wider block">
              Exploration Modules
            </span>
            <ul className="space-y-1.5 font-mono text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('tokenizer')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Live BPE Tokenizer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('embedding-lab')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Embedding Lab (384D)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('vector-space')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  3D Point Cloud Space
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('cosine-similarity')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Cosine Similarity Explorer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('semantic-search')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Semantic Search (k-NN)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('learn')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Interactive Guided Tour
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture / Engine */}
          <div className="space-y-2">
            <span className="text-slate-200 font-mono text-xs font-semibold uppercase tracking-wider block">
              Architecture Stack
            </span>
            <ul className="space-y-1 text-slate-400 text-xs font-mono">
              <li>• Engine: Transformers.js (ONNX WASM)</li>
              <li>• Model: Xenova/all-MiniLM-L6-v2</li>
              <li>• Tokenizer: js-tiktoken (cl100k & o200k)</li>
              <li>• Dimensionality: Exact SVD / Gram PCA</li>
              <li>• 3D Scene: Three.js + React Three Fiber</li>
              <li>• UI: React 18, Tailwind CSS, Lucide</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright / attribution */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <div>
            VECTORVERSE © 2026 • Real Embeddings & High-Dimensional Geometry
          </div>
          <div className="flex items-center space-x-1">
            <span>Built for AI engineers, researchers, and learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

