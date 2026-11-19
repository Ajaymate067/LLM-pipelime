import React, { useState, useMemo, useEffect } from 'react';
import { TiktokenEncoding } from 'js-tiktoken';
import {
  tokenizeText,
  calculateTokenStats,
  TokenInfo,
  SUPPORTED_ENCODINGS,
  TOKEN_PALETTE,
} from '../services/tokenizerService';
import {
  Terminal,
  Layers,
  Sparkles,
  Info,
  Copy,
  Check,
  Split,
  Eye,
  Sliders,
  X,
  Code,
  Globe,
  HelpCircle,
} from 'lucide-react';

export const TokenizerSection: React.FC = () => {
  const [selectedEncoding, setSelectedEncoding] = useState<TiktokenEncoding>('cl100k_base');
  const [inputText, setInputText] = useState(
    'Large Language Models translate human sentences into discrete numeric tokens before embedding.'
  );
  const [debouncedText, setDebouncedText] = useState(inputText);

  // Compare mode
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareTextA, setCompareTextA] = useState('The cat is sleeping on the warm carpet.');
  const [compareTextB, setCompareTextB] = useState('A kitten was resting upon the heated rug.');
  const [debouncedCompareA, setDebouncedCompareA] = useState(compareTextA);
  const [debouncedCompareB, setDebouncedCompareB] = useState(compareTextB);

  // Active inspect token
  const [inspectedToken, setInspectedToken] = useState<TokenInfo | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Debouncing for smooth typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(inputText);
    }, 150);
    return () => clearTimeout(handler);
  }, [inputText]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCompareA(compareTextA);
      setDebouncedCompareB(compareTextB);
    }, 150);
    return () => clearTimeout(handler);
  }, [compareTextA, compareTextB]);

  // Real tokenization
  const tokens = useMemo(() => {
    return tokenizeText(debouncedText, selectedEncoding);
  }, [debouncedText, selectedEncoding]);

  const stats = useMemo(() => {
    return calculateTokenStats(debouncedText, tokens);
  }, [debouncedText, tokens]);

  const tokensA = useMemo(() => {
    return tokenizeText(debouncedCompareA, selectedEncoding);
  }, [debouncedCompareA, selectedEncoding]);

  const tokensB = useMemo(() => {
    return tokenizeText(debouncedCompareB, selectedEncoding);
  }, [debouncedCompareB, selectedEncoding]);

  const samplePrompts = [
    {
      label: 'LLM Latent Space',
      text: 'Large Language Models translate human sentences into discrete numeric tokens before embedding.',
    },
    {
      label: 'TypeScript Code',
      text: 'async function calculateSimilarity(vecA: Float32Array, vecB: Float32Array): Promise<number> { return 0.942; }',
    },
    {
      label: 'Multilingual & Emojis',
      text: 'Artificial Intelligence (人工知能) connects language and mathematics. 🤖✨🚀',
    },
    {
      label: 'Subword Fragmentation',
      text: 'Unbelievability antidisestablishmentarianism tokenization pseudocode',
    },
  ];

  const handleCopy = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Terminal className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Live BPE Tokenizer</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              Real Byte-Pair Encoding
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            See how text is chopped into token IDs and byte sequences before entering neural networks.
          </p>
        </div>

        {/* Encoding Selector and Compare Mode Toggle */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={selectedEncoding}
              onChange={(e) => setSelectedEncoding(e.target.value as TiktokenEncoding)}
              aria-label="Select Tokenizer Encoding"
              className="bg-transparent text-xs font-mono text-cyan-300 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_ENCODINGS.map((enc) => (
                <option key={enc.id} value={enc.id} className="bg-slate-900 text-slate-200">
                  {enc.name} ({enc.modelExample.split(',')[0]})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isCompareMode
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>{isCompareMode ? 'Single Mode' : 'Compare Two Texts'}</span>
          </button>
        </div>
      </div>

      {/* Main Single Tokenizer View */}
      {!isCompareMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input & Token Flow (Col 8) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Sample Prompts */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs text-slate-500 font-mono whitespace-nowrap">Presets:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(p.text)}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 text-slate-300 whitespace-nowrap transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Text Input Area */}
            <div className="relative rounded-xl bg-slate-950/70 border border-cyan-500/20 focus-within:border-cyan-400 shadow-xl overflow-hidden transition-all">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>INPUT TEXT ({inputText.length} chars)</span>
                </span>
                <span className="text-slate-500">Encoding: {selectedEncoding}</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste any text to inspect its token boundaries..."
                rows={3}
                className="w-full bg-transparent px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none font-sans text-sm resize-none leading-relaxed"
              />
            </div>

            {/* Tokenized Output Chips */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                    Token Boundaries ({tokens.length} tokens)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Click a token chip to inspect details</span>
              </div>

              {/* Chips Grid */}
              <div className="flex flex-wrap gap-1.5 min-h-[90px] p-2 bg-slate-900/40 rounded-lg border border-slate-900">
                {tokens.length === 0 ? (
                  <span className="text-slate-600 text-xs italic self-center">No tokens generated</span>
                ) : (
                  tokens.map((tok, idx) => {
                    const isSelected = inspectedToken?.charStart === tok.charStart && inspectedToken?.id === tok.id;
                    const paletteClass = TOKEN_PALETTE[tok.colorIndex];
                    // Display string formatting: visualize leading space with a dot
                    const displayStr = tok.text
                      .replace(/ /g, '␣')
                      .replace(/\n/g, '↵\n')
                      .replace(/\t/g, '⇥');

                    return (
                      <button
                        key={`${tok.id}-${tok.charStart}-${idx}`}
                        onClick={() => setInspectedToken(tok)}
                        className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-mono border transition-all duration-150 transform hover:scale-105 active:scale-95 ${paletteClass} ${
                          isSelected ? 'ring-2 ring-cyan-400 shadow-md shadow-cyan-400/20' : ''
                        }`}
                        title={`Token ID: ${tok.id} | Bytes: ${tok.bytes.length}`}
                      >
                        <span className="font-semibold">{displayStr}</span>
                        <span className="text-[10px] opacity-75 font-mono">#{tok.id}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-mono block">TOTAL TOKENS</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{stats.tokenCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-mono block">CHARACTERS</span>
                <span className="text-xl font-bold font-mono text-violet-400">{stats.charCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-mono block">UTF-8 BYTES</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{stats.byteCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-mono block">CHARS / TOKEN</span>
                <span className="text-xl font-bold font-mono text-amber-400">{stats.charsPerToken}</span>
              </div>
            </div>
          </div>

          {/* Right Inspector Drawer (Col 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl bg-slate-950/80 border border-cyan-500/20 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">Token Inspector</span>
                </div>
                {inspectedToken && (
                  <button
                    onClick={() => setInspectedToken(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {inspectedToken ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Selected Token</span>
                    <span className="text-lg font-mono font-bold text-white break-all">
                      "{inspectedToken.text.replace(/ /g, '␣').replace(/\n/g, '↵')}"
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span className="text-slate-400">Vocabulary Token ID</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-cyan-400">#{inspectedToken.id}</span>
                        <button
                          onClick={() => handleCopy(inspectedToken.id)}
                          className="p-1 hover:text-cyan-300 text-slate-500 transition-colors"
                          title="Copy Token ID"
                        >
                          {copiedId === inspectedToken.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span className="text-slate-400">Hex Bytes</span>
                      <span className="text-violet-300 font-mono">{inspectedToken.hex}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span className="text-slate-400">Byte Length</span>
                      <span className="text-slate-200">{inspectedToken.bytes.length} bytes</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span className="text-slate-400">Character Range</span>
                      <span className="text-slate-200">
                        [{inspectedToken.charStart} → {inspectedToken.charEnd}]
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span className="text-slate-400">Tokenizer Encoding</span>
                      <span className="text-cyan-400">{selectedEncoding}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">Click any token chip in the left panel to inspect its byte structure and vocabulary ID.</p>
                </div>
              )}
            </div>

            {/* BPE Educational Card */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-mono">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">Why Tokenization Varies</span>
              </div>
              <p className="leading-relaxed">
                Tokens are not words. Modern LLMs use <strong>Byte-Pair Encoding (BPE)</strong>. Frequent words become single tokens, while rare words, code, or non-English characters split into subwords or individual raw bytes.
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                gpt-4o uses <code className="text-cyan-300">o200k_base</code> (200,000 vocab) whereas GPT-4 uses <code className="text-cyan-300">cl100k_base</code> (100,000 vocab).
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sentence Comparison Mode */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sentence A */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                <span>SENTENCE A ({tokensA.length} tokens)</span>
                <span>{compareTextA.length} chars</span>
              </div>
              <textarea
                value={compareTextA}
                onChange={(e) => setCompareTextA(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/60 p-2.5 rounded-lg text-sm text-slate-100 border border-slate-800 focus:outline-none focus:border-cyan-400 resize-none font-sans"
              />
              <div className="flex flex-wrap gap-1 p-2 bg-slate-900/40 rounded-lg min-h-[60px]">
                {tokensA.map((tok, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  >
                    {tok.text.replace(/ /g, '␣')} <span className="text-[9px] opacity-70">#{tok.id}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Sentence B */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-violet-500/20">
              <div className="flex items-center justify-between text-xs font-mono text-violet-400">
                <span>SENTENCE B ({tokensB.length} tokens)</span>
                <span>{compareTextB.length} chars</span>
              </div>
              <textarea
                value={compareTextB}
                onChange={(e) => setCompareTextB(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/60 p-2.5 rounded-lg text-sm text-slate-100 border border-slate-800 focus:outline-none focus:border-violet-400 resize-none font-sans"
              />
              <div className="flex flex-wrap gap-1 p-2 bg-slate-900/40 rounded-lg min-h-[60px]">
                {tokensB.map((tok, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-xs font-mono bg-violet-500/20 text-violet-300 border border-violet-500/40"
                  >
                    {tok.text.replace(/ /g, '␣')} <span className="text-[9px] opacity-70">#{tok.id}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Delta Summary */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-400 font-mono block">Token Count Delta</span>
              <span className="text-lg font-bold font-mono text-cyan-400">
                {Math.abs(tokensA.length - tokensB.length)} tokens {tokensA.length > tokensB.length ? '(A has more)' : tokensB.length > tokensA.length ? '(B has more)' : '(Equal)'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">Efficiency Ratio</span>
              <span className="text-lg font-bold font-mono text-violet-400">
                {tokensB.length > 0 ? (tokensA.length / tokensB.length).toFixed(2) : '1.00'}x
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">Vocabulary Overlap</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {
                  new Set(tokensA.map((t) => t.id)).size > 0
                    ? `${Math.round(
                        (tokensA.filter((ta) => tokensB.some((tb) => tb.id === ta.id)).length /
                          Math.max(tokensA.length, 1)) *
                          100
                      )}% shared IDs`
                    : '0%'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

