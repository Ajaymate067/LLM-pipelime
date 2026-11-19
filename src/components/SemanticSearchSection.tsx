import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { DEFAULT_CORPUS, CorpusItem } from '../data/defaultCorpus';
import { embeddingService } from '../services/embeddingService';
import { cosineSimilarity } from '../utils/mathUtils';
import { NavTab } from './Navbar';

interface SearchResult {
  doc: CorpusItem;
  similarity: number;
  percentage: number;
}

interface SemanticSearchSectionProps {
  onNavigateTo3D?: (nodeId: string) => void;
  setActiveTab?: (tab: NavTab) => void;
}

export const SemanticSearchSection: React.FC<SemanticSearchSectionProps> = ({
  onNavigateTo3D,
  setActiveTab,
}) => {
  const [query, setQuery] = useState('How do domestic animals relax?');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [topK, setTopK] = useState<number>(5);
  const [corpus, setCorpus] = useState<CorpusItem[]>(DEFAULT_CORPUS);
  const [newDocText, setNewDocText] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('General');
  const [queryVector, setQueryVector] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Debouncing for query typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Compute query embedding
  useEffect(() => {
    let isCancelled = false;

    const computeQuery = async () => {
      if (!debouncedQuery.trim()) {
        setQueryVector(null);
        return;
      }
      setIsLoading(true);
      try {
        const vec = await embeddingService.getSentenceEmbedding(debouncedQuery);
        if (!isCancelled) {
          setQueryVector(vec);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    computeQuery();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Rank corpus documents by real cosine similarity
  const searchResults: SearchResult[] = useMemo(() => {
    if (!queryVector) return [];

    const scored = corpus.map((doc) => {
      const sim = cosineSimilarity(queryVector, doc.embedding);
      const percentage = Math.max(0, Math.min(100, Math.round(((sim + 1) / 2) * 100)));
      return { doc, similarity: sim, percentage };
    });

    // Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }, [queryVector, corpus, topK]);

  // Add new document
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocText.trim()) return;

    try {
      const vec = await embeddingService.getSentenceEmbedding(newDocText.trim());
      const newDoc: CorpusItem = {
        id: `doc-${Date.now()}`,
        text: newDocText.trim(),
        category: newDocCategory,
        color: '#38bdf8',
        embedding: Array.from(vec),
      };
      setCorpus((prev) => [newDoc, ...prev]);
      setNewDocText('');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete document
  const handleDeleteDoc = (id: string) => {
    setCorpus((prev) => prev.filter((d) => d.id !== id));
  };

  // Sample queries
  const sampleQueries = [
    'How do domestic animals relax?',
    'Writing software code and data structures',
    'Financial downturn and equity prices',
    'Sunny afternoon weather and clear sky',
  ];

  const handleInspectIn3D = (nodeId: string) => {
    if (onNavigateTo3D) {
      onNavigateTo3D(nodeId);
    } else if (setActiveTab) {
      setActiveTab('vector-space');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Search className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Semantic Search Playground</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              k-NN Vector Retrieval
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Search documents by conceptual meaning rather than verbatim keyword matches using high-dimensional cosine similarity.
          </p>
        </div>

        {/* Top-K Control */}
        <div className="flex items-center space-x-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-400">Top-K:</span>
          <div className="flex items-center space-x-1">
            {[3, 5, 8, 12].map((k) => (
              <button
                key={k}
                onClick={() => setTopK(k)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                  topK === k
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Bar & Presets */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-slate-500 font-mono whitespace-nowrap">Suggested Queries:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(q)}
              className="px-2.5 py-1 rounded text-xs font-mono bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors"
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Main Search Input */}
        <div className="relative rounded-xl bg-slate-950/80 border border-emerald-500/30 focus-within:border-emerald-400 p-2 flex items-center shadow-lg transition-all">
          <Search className="w-5 h-5 text-emerald-400 ml-3 mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any natural language query..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none font-sans py-1.5"
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 mr-3" />}
        </div>
      </div>

      {/* Results & Corpus Manager Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Search Results (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Ranked Nearest Neighbors (Top {searchResults.length})
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Ranked by Cosine Similarity</span>
          </div>

          <div className="space-y-2.5">
            {searchResults.map((result, idx) => {
              const isTop1 = idx === 0;
              const isSelected = selectedResultId === result.doc.id;

              return (
                <div
                  key={result.doc.id}
                  onClick={() => setSelectedResultId(result.doc.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isTop1
                      ? 'bg-slate-950/90 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                          isTop1
                            ? 'bg-emerald-500 text-black'
                            : idx < 3
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {result.doc.category}
                      </span>
                    </div>

                    {/* Exact Similarity Badge */}
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {result.similarity >= 0 ? '+' : ''}
                        {result.similarity.toFixed(4)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{result.percentage}% match</div>
                    </div>
                  </div>

                  {/* Document Text */}
                  <p className="text-sm font-medium text-slate-100 mt-2 font-sans leading-relaxed">
                    "{result.doc.text}"
                  </p>

                  {/* Similarity Progress Bar */}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${result.percentage}%` }}
                        className={`h-full ${
                          isTop1
                            ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                            : 'bg-cyan-500/60'
                        }`}
                      />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectIn3D(result.doc.id);
                      }}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <span>Highlight in 3D</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {searchResults.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-900">
                Type a query above to execute vector search against the corpus.
              </div>
            )}
          </div>
        </div>

        {/* Corpus Manager & Lexical vs Semantic Comparison (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Add Document Form */}
          <form onSubmit={handleAddDocument} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
              Add Document to Corpus
            </span>

            <input
              type="text"
              value={newDocText}
              onChange={(e) => setNewDocText(e.target.value)}
              placeholder="e.g. 'A feline curled up on the rug'"
              className="w-full bg-slate-900/80 p-2.5 rounded-lg text-xs text-white border border-slate-800 focus:outline-none focus:border-emerald-400"
            />

            <div className="flex space-x-2">
              <input
                type="text"
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
                placeholder="Category"
                className="w-1/2 bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newDocText.trim()}
                className="w-1/2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-semibold flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Doc</span>
              </button>
            </div>
          </form>

          {/* Lexical vs Semantic Search Educational Insight */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-mono font-semibold">
              <HelpCircle className="w-4 h-4" />
              <span>Semantic Search vs Keyword (Lexical) Search</span>
            </div>
            <p className="leading-relaxed">
              <strong>Traditional BM25 / Keyword search</strong> only finds exact token overlaps. If you search for <code className="text-cyan-300 font-mono">"feline napping"</code>, keyword search returns 0 results because the words "feline" and "napping" don't appear in the document.
            </p>
            <p className="leading-relaxed">
              <strong>Dense Vector Semantic Search</strong> encodes deep conceptual meaning. The model understands that <code className="text-emerald-300 font-mono">"feline napping"</code> is semantically adjacent to <code className="text-emerald-300 font-mono">"The cat is sleeping"</code> in latent space, achieving high cosine similarity!
            </p>
          </div>

          {/* Active Corpus Document Count */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Corpus Size: {corpus.length} searchable sentences</span>
            <span className="text-emerald-400">All 384D indexed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

