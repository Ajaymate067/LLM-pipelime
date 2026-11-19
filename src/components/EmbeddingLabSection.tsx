import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Cpu,
  BarChart3,
  Binary,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Box,
  Activity,
} from 'lucide-react';
import { embeddingService, ModelProgress } from '../services/embeddingService';
import { tokenizeText } from '../services/tokenizerService';
import { computePCA, formatFloat, l2Norm } from '../utils/mathUtils';

export const EmbeddingLabSection: React.FC = () => {
  const [inputText, setInputText] = useState('The cat is sleeping');
  const [embedding, setEmbedding] = useState<Float32Array | null>(null);
  const [contextualTokens, setContextualTokens] = useState<{ tokens: string[]; tokenEmbeddings: Float32Array[] } | null>(null);
  const [selectedDimIndex, setSelectedDimIndex] = useState<number>(0);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'sentence' | 'contextual'>('sentence');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState<ModelProgress>(embeddingService.getStatus());

  useEffect(() => {
    const unsub = embeddingService.subscribe(setModelProgress);
    return unsub;
  }, []);

  // Compute embedding when text changes or model is ready
  useEffect(() => {
    let isCancelled = false;

    const generate = async () => {
      if (!inputText.trim()) {
        setEmbedding(null);
        return;
      }
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const vec = await embeddingService.getSentenceEmbedding(inputText);
        if (!isCancelled) {
          setEmbedding(vec);
        }

        // Also fetch contextual token vectors if in contextual view
        const ctx = await embeddingService.getContextualTokenEmbeddings(inputText);
        if (!isCancelled) {
          setContextualTokens(ctx);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMsg(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(generate, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [inputText]);

  // Token breakdown
  const tokens = useMemo(() => {
    return tokenizeText(inputText, 'cl100k_base');
  }, [inputText]);

  // PCA projection of this single embedding (or with reference frame)
  const pca3D = useMemo(() => {
    if (!embedding) return [0, 0, 0];
    const res = computePCA([embedding]);
    return res.points3D[0] || [0, 0, 0];
  }, [embedding]);

  // Statistical metrics of the 384D vector
  const stats = useMemo(() => {
    if (!embedding || embedding.length === 0) {
      return { norm: 0, min: 0, max: 0, mean: 0, std: 0 };
    }
    const norm = l2Norm(embedding);
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < embedding.length; i++) {
      const v = embedding[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }
    const mean = sum / embedding.length;
    let varianceSum = 0;
    for (let i = 0; i < embedding.length; i++) {
      const diff = embedding[i] - mean;
      varianceSum += diff * diff;
    }
    const std = Math.sqrt(varianceSum / embedding.length);

    return {
      norm: parseFloat(norm.toFixed(4)),
      min: parseFloat(min.toFixed(4)),
      max: parseFloat(max.toFixed(4)),
      mean: parseFloat(mean.toFixed(4)),
      std: parseFloat(std.toFixed(4)),
    };
  }, [embedding]);

  // Dimensions slice for bar chart (first 32 dimensions)
  const barChartSlice = useMemo(() => {
    if (!embedding) return [];
    return Array.from(embedding.slice(0, 32)).map((val, idx) => ({
      index: idx,
      value: parseFloat(val.toFixed(4)),
    }));
  }, [embedding]);

  const sampleSentences = [
    'The cat is sleeping',
    'A kitten is resting',
    'Deep neural networks learn latent vector embeddings',
    'The stock market is falling',
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Embedding Lab</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-500/30">
              384-Dimensional Latent Space
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Observe the pipeline from text through Transformer self-attention layers to continuous dense vectors.
          </p>
        </div>

        {/* Model status indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Architecture: MiniLM-L6-v2 (6 layers, 384 hidden dims)</span>
          </div>
        </div>
      </div>

      {/* Model Progress Banner (if loading) */}
      {modelProgress.status === 'loading' && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <div>
              <p className="text-xs font-mono font-semibold">{modelProgress.message}</p>
              <p className="text-[11px] text-cyan-400/70">Downloading quantized ONNX weights into browser WASM runtime...</p>
            </div>
          </div>
          <span className="text-sm font-mono font-bold">{modelProgress.progress}%</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
          Model execution note: {errorMsg}
        </div>
      )}

      {/* Interactive Text Input and Presets */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-slate-500 font-mono whitespace-nowrap">Try examples:</span>
          {sampleSentences.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(s)}
              className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 whitespace-nowrap transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative rounded-xl bg-slate-950/80 border border-cyan-500/20 focus-within:border-cyan-400 p-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>INPUT PROMPT</span>
            {isLoading && (
              <span className="flex items-center space-x-1 text-cyan-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Computing real 384D tensor...</span>
              </span>
            )}
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type any sentence to generate real embeddings..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none font-sans text-sm"
          />
        </div>
      </div>

      {/* The 5-Step Visual Pipeline */}
      <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            End-to-End Latent Representation Pipeline
          </span>
          <span className="text-[11px] text-cyan-400 font-mono">Real-time inference</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">1. Raw Text</div>
            <div className="text-xs text-white font-medium truncate" title={inputText}>
              "{inputText}"
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{inputText.length} characters</div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-mono text-violet-400 font-bold uppercase">2. Token IDs</div>
            <div className="text-xs font-mono text-violet-300 truncate">
              [{tokens.map((t) => t.id).join(', ')}]
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{tokens.length} discrete tokens</div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-mono text-pink-400 font-bold uppercase">3. Self-Attention</div>
            <div className="text-xs text-pink-300 font-mono">6 Layers / 12 Heads</div>
            <div className="text-[10px] text-slate-500 font-mono">Contextual interaction</div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/40 space-y-1.5 ring-1 ring-cyan-500/30">
            <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase">4. 384D Vector</div>
            <div className="text-xs text-cyan-300 font-mono truncate">
              {embedding ? `[${embedding[0]?.toFixed(3)}, ${embedding[1]?.toFixed(3)}, ...]` : 'Computing...'}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">||v|| = {stats.norm} (unit norm)</div>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">5. 3D PCA Space</div>
            <div className="text-xs text-emerald-300 font-mono">
              ({pca3D[0]?.toFixed(2)}, {pca3D[1]?.toFixed(2)}, {pca3D[2]?.toFixed(2)})
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Dimension reduced</div>
          </div>
        </div>
      </div>

      {/* Mode Switch: Pooled Sentence Vector vs Contextual Token Vectors */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setViewMode('sentence')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            viewMode === 'sentence'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sentence Embedding (Mean Pooled, 384D)
        </button>
        <button
          onClick={() => setViewMode('contextual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            viewMode === 'contextual'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Contextual Token Representations (Hidden States)
        </button>
      </div>

      {viewMode === 'sentence' ? (
        /* Sentence Embedding Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 384D Full Heatmap Ribbon (Col 8) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    Full 384-Dimension Latent Tensor Heatmap
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Hover over any cell</span>
              </div>

              {/* Heatmap Grid (384 small tiles) */}
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900">
                <div className="grid grid-cols-24 sm:grid-cols-32 gap-1 max-h-48 overflow-y-auto p-1">
                  {embedding &&
                    Array.from(embedding).map((val, idx) => {
                      const isSelected = selectedDimIndex === idx;
                      // Color mapping: cyan for positive, violet/pink for negative
                      const intensity = Math.min(1, Math.abs(val) * 8);
                      const bgStyle =
                        val >= 0
                          ? `rgba(6, 182, 212, ${Math.max(0.12, intensity)})`
                          : `rgba(168, 85, 247, ${Math.max(0.12, intensity)})`;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setSelectedDimIndex(idx)}
                          onClick={() => setSelectedDimIndex(idx)}
                          style={{ backgroundColor: bgStyle }}
                          className={`h-4 rounded-[2px] cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-white scale-125 z-10' : 'hover:scale-110'
                          }`}
                          title={`Dim ${idx}: ${val.toFixed(5)}`}
                        />
                      );
                    })}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 px-1">
                  <span>Dim 0</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-violet-400">■ Negative</span>
                    <span className="text-slate-600">■ ~0.0</span>
                    <span className="text-cyan-400">■ Positive</span>
                  </div>
                  <span>Dim 383</span>
                </div>
              </div>

              {/* Bar Chart Slice (first 32 dimensions) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>DIMENSIONS [0 → 31] VALUE DISTRIBUTION</span>
                  <span className="text-[11px] text-slate-500">IEEE 754 float32</span>
                </div>

                <div className="h-28 flex items-end space-x-1 p-2 bg-slate-900/30 rounded-lg border border-slate-900">
                  {barChartSlice.map((item) => {
                    const isSelected = selectedDimIndex === item.index;
                    const heightPercent = Math.min(100, Math.abs(item.value) * 450);
                    const isPositive = item.value >= 0;

                    return (
                      <div
                        key={item.index}
                        onClick={() => setSelectedDimIndex(item.index)}
                        onMouseEnter={() => setSelectedDimIndex(item.index)}
                        className="flex-1 flex flex-col justify-end items-center h-full cursor-pointer group"
                      >
                        <div
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                          className={`w-full rounded-t-sm transition-all ${
                            isSelected
                              ? 'bg-white'
                              : isPositive
                              ? 'bg-cyan-500 group-hover:bg-cyan-400'
                              : 'bg-violet-500 group-hover:bg-violet-400'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Vector Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono block">L2 EUCLIDEAN NORM</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{stats.norm}</span>
                <span className="text-[10px] text-slate-500 block">Unit hypersphere</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono block">MIN VALUE</span>
                <span className="text-xl font-bold font-mono text-violet-400">{stats.min}</span>
                <span className="text-[10px] text-slate-500 block">Most negative dim</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono block">MAX VALUE</span>
                <span className="text-xl font-bold font-mono text-cyan-400">+{stats.max}</span>
                <span className="text-[10px] text-slate-500 block">Peak activation</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono block">STD DEVIATION</span>
                <span className="text-xl font-bold font-mono text-amber-400">{stats.std}</span>
                <span className="text-[10px] text-slate-500 block">Dispersion</span>
              </div>
            </div>
          </div>

          {/* Right Inspector & Theoretical Clarification (Col 4) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Dimension Inspector Card */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold">
                <Eye className="w-4 h-4" />
                <span>DIMENSION INSPECTOR</span>
              </div>

              {embedding && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Dimension Index</span>
                    <span className="text-sm font-mono font-bold text-cyan-300">d[{selectedDimIndex}]</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Exact Float32 Value</div>
                    <div className="text-xl font-mono font-extrabold text-white">
                      {embedding[selectedDimIndex] !== undefined
                        ? (embedding[selectedDimIndex] >= 0 ? '+' : '') + embedding[selectedDimIndex].toFixed(8)
                        : '0.00000000'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Activation Intensity</span>
                      <span className="text-cyan-400">
                        {Math.abs((embedding[selectedDimIndex] || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.abs(embedding[selectedDimIndex] || 0) * 800)}%` }}
                        className={`h-full ${
                          (embedding[selectedDimIndex] || 0) >= 0 ? 'bg-cyan-400' : 'bg-violet-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Essential Theoretical Distinction Card */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-violet-400 font-mono font-semibold">
                <HelpCircle className="w-4 h-4" />
                <span>Crucial Theoretical Distinction</span>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
                <li>
                  <strong className="text-cyan-300">Static Token Embedding:</strong> A lookup table ($W_e$) where each token ID maps to an initial static vector without context.
                </li>
                <li>
                  <strong className="text-violet-300">Contextual Representation:</strong> The vectors output by Transformer self-attention layers (hidden states H in ℝ^(L × 384)), where words adapt their meaning based on neighboring tokens.
                </li>
                <li>
                  <strong className="text-emerald-300">Sentence Embedding:</strong> A single 384D coordinate obtained by mean pooling the token hidden states across the sequence and normalizing to unit length:
                  <div className="mt-1 font-mono text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded">
                    v_sentence = Normalize( (1/L) * Σ h_i )
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Contextual Token Hidden States Inspector */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-400">
              Select Token to Inspect its Contextual Vector (last_hidden_state)
            </span>

            {contextualTokens && (
              <div className="flex flex-wrap gap-2">
                {contextualTokens.tokens.map((tok, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTokenIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      selectedTokenIndex === idx
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-md ring-1 ring-violet-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    "{tok.replace(/ /g, '␣')}"
                  </button>
                ))}
              </div>
            )}

            {contextualTokens && contextualTokens.tokenEmbeddings[selectedTokenIndex] && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>
                    Contextual Hidden State for token "{contextualTokens.tokens[selectedTokenIndex]}" (384 dims)
                  </span>
                  <span className="text-violet-400">Layer 6 Output</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-32">
                  [
                  {Array.from(contextualTokens.tokenEmbeddings[selectedTokenIndex])
                    .slice(0, 30)
                    .map((v) => v.toFixed(4))
                    .join(', ')}
                  , ... 354 more dims]
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
