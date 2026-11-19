import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  Orbit,
  Compass,
  Search,
} from 'lucide-react';

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  summary: string;
  details: string[];
  mathDeepDive: {
    formula: string;
    explanation: string;
    variables: { symbol: string; desc: string }[];
  };
}

export const InteractiveLearningSection: React.FC = () => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showMath, setShowMath] = useState(true);

  // Mini quiz state
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const chapters: Chapter[] = [
    {
      id: 1,
      title: 'Tokenization & Byte-Pair Encoding (BPE)',
      subtitle: 'How human text is chopped into numbers',
      icon: <Terminal className="w-5 h-5 text-cyan-400" />,
      summary:
        'Computers and neural networks cannot process raw characters or strings. They can only perform linear algebra on numbers. Tokenizers break text into subword chunks and assign each chunk a unique integer token ID.',
      details: [
        'Tokens are not simply full words: common words like "the" or "is" are single tokens, while rare words like "antidisestablishmentarianism" split into multiple subwords.',
        'Whitespace is preserved: leading spaces (e.g. " cat") have distinct token IDs from words without leading spaces ("cat").',
        'Byte-Pair Encoding (BPE) starts with individual bytes and iteratively merges the most frequent adjacent pairs until a target vocabulary size (e.g., 100,000 for cl100k_base or 200,000 for o200k_base) is reached.',
      ],
      mathDeepDive: {
        formula: 'T: \\Sigma^* \\to \\mathbb{N}^L, \\quad \\mathbf{t} = [t_1, t_2, \\dots, t_L], \\quad t_i \\in \\{0, 1, \\dots, |V|-1\\}',
        explanation:
          'Tokenization is a deterministic mapping from an arbitrary UTF-8 string of bytes to a sequence of discrete integer IDs bounded by the vocabulary size |V|.',
        variables: [
          { symbol: '\\Sigma^*', desc: 'Arbitrary UTF-8 input string sequence' },
          { symbol: '|V|', desc: 'Total vocabulary size (e.g. 100,277 in cl100k_base)' },
          { symbol: 'L', desc: 'Length of the tokenized sequence' },
        ],
      },
    },
    {
      id: 2,
      title: 'The Embedding Matrix: Discrete to Continuous',
      subtitle: 'Translating token IDs into continuous vectors',
      icon: <Layers className="w-5 h-5 text-violet-400" />,
      summary:
        'Token IDs are just arbitrary identifiers (#9906 has no mathematical closeness to #9907). To give words geometric meaning, each token ID indexes into an embedding lookup table, yielding a dense continuous vector.',
      details: [
        'An embedding matrix W_e has dimensions |V| x d, where |V| is the vocabulary size and d is the hidden dimension (e.g., 384 in MiniLM or 1536 in text-embedding-3-small).',
        'Looking up token ID #i is mathematically identical to multiplying a one-hot vector e_i by the embedding matrix: x_i = e_i · W_e.',
        'During pre-training, gradient descent continuously adjusts these vector coordinates so that semantically related concepts end up pointing in similar directions.',
      ],
      mathDeepDive: {
        formula: '\\mathbf{x}_i = \\mathbf{e}_i \\mathbf{W}_e, \\quad \\mathbf{W}_e \\in \\mathbb{R}^{|V| \\times d}, \\quad \\mathbf{x}_i \\in \\mathbb{R}^d',
        explanation:
          'Each token ID acts as a row index selector in the weight matrix W_e, projecting a discrete symbolic entity into a d-dimensional continuous vector space.',
        variables: [
          { symbol: '\\mathbf{W}_e', desc: 'Learned token embedding weight matrix' },
          { symbol: '\\mathbf{e}_i', desc: 'One-hot vector of dimension |V| with 1 at index i' },
          { symbol: 'd', desc: 'Embedding dimensionality (d = 384 for all-MiniLM-L6-v2)' },
        ],
      },
    },
    {
      id: 3,
      title: 'Transformer Attention & Sentence Pooling',
      subtitle: 'From isolated words to contextual meaning',
      icon: <Cpu className="w-5 h-5 text-pink-400" />,
      summary:
        'Static word vectors cannot resolve ambiguity (e.g. "river bank" vs "investment bank"). Multi-head self-attention enables each token to dynamically incorporate context from surrounding words.',
      details: [
        'Self-attention calculates Query (Q), Key (K), and Value (V) projections for every token, taking their scaled dot product to determine how much attention each word should pay to every other word.',
        'Sentence embedding models take the sequence of contextual token representations and apply Mean Pooling: averaging all token vectors across the sentence.',
        'Finally, the averaged vector is normalized to unit length (L2 norm = 1.0), placing all sentence vectors on a unit hypersphere.',
      ],
      mathDeepDive: {
        formula: '\\mathbf{v}_{\\text{sentence}} = \\frac{\\frac{1}{L} \\sum_{i=1}^L \\mathbf{h}_i}{\\left\\| \\frac{1}{L} \\sum_{i=1}^L \\mathbf{h}_i \\right\\|_2}, \\quad \\text{where } \\mathbf{h}_i = \\text{Transformer}(\\mathbf{x}_{1:L})_i',
        explanation:
          'Mean pooling computes the centroid of token hidden states, followed by L2 Euclidean normalization onto the surface of the unit sphere S^{d-1}.',
        variables: [
          { symbol: '\\mathbf{h}_i', desc: 'Contextual representation from the final transformer layer' },
          { symbol: 'L', desc: 'Sequence length (number of tokens)' },
          { symbol: '\\|\\cdot\\|_2', desc: 'L2 Euclidean norm' },
        ],
      },
    },
    {
      id: 4,
      title: 'High-Dimensional Latent Geometry',
      subtitle: 'The 384-dimensional hypersphere',
      icon: <Orbit className="w-5 h-5 text-emerald-400" />,
      summary:
        'Human language contains thousands of nuanced, independent facets (sentiment, formality, tense, domain, topic). A 2D or 3D space would cause concepts to collide. High dimensions provide ample room.',
      details: [
        'In 384 dimensions, almost all randomly chosen vectors are nearly orthogonal (cosine similarity ≈ 0).',
        'Semantic clusters form natural manifolds: all sentences about "animals" occupy a distinct sub-region, while "finance" occupies an orthogonal sub-region.',
        'Analogies like "King - Man + Woman = Queen" emerge naturally from linear vector arithmetic in this latent space.',
      ],
      mathDeepDive: {
        formula: '\\mathbb{E}[\\mathbf{u} \\cdot \\mathbf{v}] = 0, \\quad \\text{Var}[\\mathbf{u} \\cdot \\mathbf{v}] = \\frac{1}{d} \\quad \\text{for } \\mathbf{u}, \\mathbf{v} \\sim \\text{Uniform}(S^{d-1})',
        explanation:
          'In high dimensions (d=384), the variance of the dot product between random unit vectors is 1/d ≈ 0.0026. Random vectors are overwhelmingly orthogonal, meaning non-zero similarity represents true semantic signal!',
        variables: [
          { symbol: 'S^{d-1}', desc: 'Surface of the unit hypersphere in ℝ^d' },
          { symbol: 'd', desc: 'Dimension count (384)' },
        ],
      },
    },
    {
      id: 5,
      title: 'Cosine Similarity vs Euclidean Distance',
      subtitle: 'Why angle matters more than length',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      summary:
        'When comparing text embeddings, Euclidean distance can be distorted by sentence length or token frequency. Cosine similarity evaluates the angle between vectors, measuring conceptual orientation rather than magnitude.',
      details: [
        'Cosine similarity ranges strictly from -1.0 (directly opposite concepts) to +1.0 (identical semantic meaning), with 0 indicating complete independence/orthogonality.',
        'When vectors are normalized to unit length (||u|| = 1 and ||v|| = 1), cosine similarity is mathematically identical to the simple dot product: cos(θ) = u · v.',
        'Furthermore, Euclidean distance on unit vectors is directly tied to cosine similarity: ||u - v||² = 2 - 2·cos(θ).',
      ],
      mathDeepDive: {
        formula: '\\cos(\\theta) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\|_2 \\|\\mathbf{v}\\|_2} = \\sum_{i=1}^{384} u_i v_i \\quad (\\text{when } \\|\\mathbf{u}\\| = \\|\\mathbf{v}\\| = 1)',
        explanation:
          'Cosine similarity calculates the cosine of the angle between two vectors. L2 normalization simplifies the computation to a fast dot product across all dimensions.',
        variables: [
          { symbol: '\\theta', desc: 'Subtended angle between vectors in 384-dimensional space' },
          { symbol: '\\mathbf{u} \\cdot \\mathbf{v}', desc: 'Standard inner dot product: Σ u_i v_i' },
        ],
      },
    },
    {
      id: 6,
      title: 'Dimensionality Reduction: PCA & SVD',
      subtitle: 'Projecting 384 dimensions into a 3D viewable space',
      icon: <Search className="w-5 h-5 text-sky-400" />,
      summary:
        'To visualize high-dimensional embeddings on a computer monitor, we must reduce 384 dimensions down to 3. Principal Component Analysis (PCA) finds the 3 orthogonal directions that capture the greatest variance.',
      details: [
        'PCA centers the data matrix X_c = X - μ, then computes the eigenvectors and eigenvalues of the covariance or Gram matrix K = X_c · X_c^T.',
        'The top 3 eigenvectors with the largest eigenvalues become the new X, Y, and Z axes.',
        'Trade-off / Projection Loss: While PCA preserves maximum global variance, discarding 381 dimensions means 3D distance is always an approximation of true high-dimensional cosine similarity.',
      ],
      mathDeepDive: {
        formula: '\\mathbf{K} = \\mathbf{X}_c \\mathbf{X}_c^T, \\quad \\mathbf{K} \\mathbf{u}_j = \\lambda_j \\mathbf{u}_j, \\quad \\mathbf{T}_{:, j} = \\sqrt{\\lambda_j} \\mathbf{u}_j',
        explanation:
          'Using the Gram matrix dual formulation of SVD, the top 3 principal coordinate scores T are directly obtained from the largest eigenvalues and eigenvectors of K.',
        variables: [
          { symbol: '\\mathbf{X}_c', desc: 'Mean-centered embedding matrix of size N x 384' },
          { symbol: '\\mathbf{K}', desc: 'Gram kernel matrix of size N x N' },
          { symbol: '\\lambda_j', desc: 'j-th eigenvalue representing variance along j-th principal component' },
        ],
      },
    },
  ];

  const currentChapter = chapters[activeChapterIndex];

  const handleNext = () => {
    if (activeChapterIndex < chapters.length - 1) {
      setActiveChapterIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeChapterIndex > 0) {
      setActiveChapterIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Interactive Learning Lab</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-500/30">
              6 Guided Chapters
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            From raw characters to BPE tokens, high-dimensional latent manifolds, and 3D PCA projection.
          </p>
        </div>

        {/* Math Toggle */}
        <button
          onClick={() => setShowMath(!showMath)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
            showMath
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showMath ? 'Math Deep Dive: Active' : 'Show Mathematical Formulas'}</span>
        </button>
      </div>

      {/* Chapter Selection Stepper */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 no-scrollbar">
        {chapters.map((ch, idx) => (
          <button
            key={ch.id}
            onClick={() => setActiveChapterIndex(idx)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              activeChapterIndex === idx
                ? 'bg-slate-900 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="font-mono text-[10px] w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold">
              {idx + 1}
            </span>
            <span>{ch.title.split('&')[0]}</span>
          </button>
        ))}
      </div>

      {/* Main Chapter Content Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              {currentChapter.icon}
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Chapter {currentChapter.id} of {chapters.length}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{currentChapter.title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentChapter.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Summary Callout */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-slate-200 text-sm leading-relaxed">
          {currentChapter.summary}
        </div>

        {/* Key Concepts Bullet Points */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
            Core Principles & Mechanisms
          </span>
          <ul className="space-y-2.5">
            {currentChapter.details.map((detail, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-cyan-400 mt-1">▹</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mathematical Deep Dive (Conditionally Visible) */}
        {showMath && (
          <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold">
              <Calculator className="w-4 h-4" />
              <span>MATHEMATICAL SPECIFICATION & FORMULATION</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center font-mono text-cyan-200 text-sm overflow-x-auto">
              $${currentChapter.mathDeepDive.formula}$$
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {currentChapter.mathDeepDive.explanation}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              {currentChapter.mathDeepDive.variables.map((v, i) => (
                <div key={i} className="p-2 rounded bg-slate-950/60 text-xs font-mono">
                  <span className="text-cyan-300 font-bold block">${v.symbol}$</span>
                  <span className="text-slate-400 text-[11px] font-sans">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Navigation Stepper */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handlePrev}
            disabled={activeChapterIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-colors border border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Chapter</span>
          </button>

          <div className="flex items-center space-x-1.5">
            {chapters.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeChapterIndex ? 'bg-cyan-400 w-5' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={activeChapterIndex === chapters.length - 1}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-semibold transition-colors"
          >
            <span>Next Chapter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Interactive Comprehension Check */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>INTERACTIVE CONCEPT CHECK</span>
        </div>

        <p className="text-sm text-slate-200">
          <strong>Question:</strong> If two normalized sentence vectors <strong>u</strong> and <strong>v</strong> in a 384-dimensional space have a cosine similarity of 0.0, what does this mathematically and semantically indicate?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {[
            { id: 0, text: 'They are identical sentences with 100% vocabulary overlap.' },
            { id: 1, text: 'They are completely opposite in sentiment (e.g. good vs evil).' },
            { id: 2, text: 'They are orthogonal (perpendicular), representing independent topics.', correct: true },
            { id: 3, text: 'The embedding model encountered a calculation error.' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setQuizAnswer(option.id);
                setQuizSubmitted(true);
              }}
              className={`p-3 rounded-xl border text-left text-xs font-sans transition-all ${
                quizAnswer === option.id
                  ? option.correct
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-500 text-rose-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-500">[{String.fromCharCode(65 + option.id)}]</span>
                <span>{option.text}</span>
              </div>
            </button>
          ))}
        </div>

        {quizSubmitted && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
              quizAnswer === 2
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {quizAnswer === 2 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Correct! In high-dimensional geometry, a cosine similarity of 0 means the vectors form a 90° right angle (orthogonal), meaning their concepts share zero directional alignment.</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Not quite. A cosine similarity of 0 represents orthogonality (perpendicular vectors at 90°), indicating independent or unrelated topics.</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
