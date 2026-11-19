import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Activity,
  Calculator,
  Grid,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { embeddingService } from '../services/embeddingService';
import { cosineSimilarity, dotProduct, l2Norm, formatFloat } from '../utils/mathUtils';

// 3D Vector Angle Illustration Component
const VectorAngle3D: React.FC<{ angleRad: number }> = ({ angleRad }) => {
  // Construct two 3D vectors separated by angleRad
  const len = 3.5;
  const dirA = new THREE.Vector3(len, 0, 0);
  const dirB = new THREE.Vector3(
    len * Math.cos(angleRad),
    len * Math.sin(angleRad),
    0
  );

  // Arc curve between vectors
  const arcPoints: THREE.Vector3[] = [];
  const segments = 24;
  const arcRadius = 1.5;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * angleRad;
    arcPoints.push(new THREE.Vector3(arcRadius * Math.cos(t), arcRadius * Math.sin(t), 0));
  }
  const arcGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(arcPoints), [arcPoints]);

  return (
    <group>
      {/* Origin Sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Vector A Arrow (Cyan) */}
      <primitive
        object={
          new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0).normalize(),
            new THREE.Vector3(0, 0, 0),
            len,
            0x06b6d4,
            0.5,
            0.25
          )
        }
      />
      <Html position={[len + 0.4, 0, 0]} center pointerEvents="none">
        <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
          Vector A
        </span>
      </Html>

      {/* Vector B Arrow (Violet) */}
      <primitive
        object={
          new THREE.ArrowHelper(
            new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize(),
            new THREE.Vector3(0, 0, 0),
            len,
            0xa855f7,
            0.5,
            0.25
          )
        }
      />
      <Html position={[dirB.x * 1.15, dirB.y * 1.15, 0]} center pointerEvents="none">
        <span className="text-xs font-mono font-bold text-violet-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-violet-500/40">
          Vector B
        </span>
      </Html>

      {/* Arc Line */}
      <primitive object={new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: '#f59e0b', linewidth: 2 }))} />

      {/* Arc Label θ */}
      <Html
        position={[
          (arcRadius + 0.4) * Math.cos(angleRad / 2),
          (arcRadius + 0.4) * Math.sin(angleRad / 2),
          0,
        ]}
        center
        pointerEvents="none"
      >
        <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-500/50">
          θ = {((angleRad * 180) / Math.PI).toFixed(1)}°
        </span>
      </Html>
    </group>
  );
};

export const CosineSimilaritySection: React.FC = () => {
  const [textA, setTextA] = useState('The cat is sleeping peacefully');
  const [textB, setTextB] = useState('A kitten is resting quietly');
  const [vectorA, setVectorA] = useState<Float32Array | null>(null);
  const [vectorB, setVectorB] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Matrix sentences
  const matrixSentences = [
    'The cat is sleeping',
    'A kitten is resting',
    'Python is a programming language',
    'Writing software requires clean code',
    'The stock market is falling',
    'The weather is sunny and clear',
  ];

  const [matrixEmbeddings, setMatrixEmbeddings] = useState<Float32Array[]>([]);

  // Compute embeddings for Text A and Text B
  useEffect(() => {
    let isCancelled = false;

    const compute = async () => {
      setIsLoading(true);
      try {
        const [vA, vB] = await Promise.all([
          embeddingService.getSentenceEmbedding(textA),
          embeddingService.getSentenceEmbedding(textB),
        ]);
        if (!isCancelled) {
          setVectorA(vA);
          setVectorB(vB);
        }
      } catch (err) {
        console.error('Embedding error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(compute, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [textA, textB]);

  // Compute embeddings for Matrix sentences
  useEffect(() => {
    const loadMatrix = async () => {
      const embs = await Promise.all(
        matrixSentences.map((s) => embeddingService.getSentenceEmbedding(s))
      );
      setMatrixEmbeddings(embs);
    };
    loadMatrix();
  }, []);

  // Cosine Similarity Calculations in 384D
  const stats = useMemo(() => {
    if (!vectorA || !vectorB) {
      return {
        similarity: 0,
        dot: 0,
        normA: 0,
        normB: 0,
        angleDeg: 0,
        angleRad: 0,
        normalizedScore: 50,
      };
    }

    const sim = cosineSimilarity(vectorA, vectorB);
    const dot = dotProduct(vectorA, vectorB);
    const nA = l2Norm(vectorA);
    const nB = l2Norm(vectorB);
    // Angle in radians
    const angleRad = Math.acos(Math.max(-1, Math.min(1, sim)));
    const angleDeg = (angleRad * 180) / Math.PI;
    const normalizedScore = Math.max(0, Math.min(100, Math.round(((sim + 1) / 2) * 100)));

    return {
      similarity: sim,
      dot,
      normA: nA,
      normB: nB,
      angleDeg,
      angleRad,
      normalizedScore,
    };
  }, [vectorA, vectorB]);

  // Qualitative interpretation
  const qualitativeInterpretation = useMemo(() => {
    const s = stats.similarity;
    if (s > 0.85) return { label: 'Near Identical Semantics', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (s > 0.65) return { label: 'Strong Semantic Affinity', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (s > 0.40) return { label: 'Moderate Topical Relation', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    if (s > 0.15) return { label: 'Weak / Tangential Connection', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Orthogonal / Unrelated Topics', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  }, [stats.similarity]);

  // Preset sentence pairs
  const presetPairs = [
    {
      name: 'Synonyms / Paraphrase',
      a: 'The cat is sleeping peacefully',
      b: 'A kitten is resting quietly',
    },
    {
      name: 'Unrelated Subjects',
      a: 'I love writing software and algorithms',
      b: 'The stock market crashed on Tuesday',
    },
    {
      name: 'Opposite Sentiments',
      a: 'This restaurant serves wonderful delicious food',
      b: 'This restaurant serves terrible inedible food',
    },
    {
      name: 'Exact Identical',
      a: 'Deep neural networks learn latent vector embeddings',
      b: 'Deep neural networks learn latent vector embeddings',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Cosine Similarity Explorer</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
              384D Inner Product
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Calculate the exact angular cosine distance between two sentence representations in native 384-dimensional space.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-slate-500 font-mono">Presets:</span>
          {presetPairs.map((pair, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTextA(pair.a);
                setTextB(pair.b);
              }}
              className="px-2.5 py-1 rounded text-xs font-mono bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
            >
              {pair.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs & Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sentence Inputs (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sentence A Input */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span className="font-semibold">SENTENCE A</span>
              <span>Vector A: 384 dimensions</span>
            </div>
            <textarea
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              rows={2}
              placeholder="Enter sentence A..."
              className="w-full bg-slate-900/60 p-2.5 rounded-lg text-sm text-white border border-slate-800 focus:outline-none focus:border-cyan-400 resize-none font-sans"
            />
          </div>

          {/* Sentence B Input */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-violet-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-violet-400">
              <span className="font-semibold">SENTENCE B</span>
              <span>Vector B: 384 dimensions</span>
            </div>
            <textarea
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              rows={2}
              placeholder="Enter sentence B..."
              className="w-full bg-slate-900/60 p-2.5 rounded-lg text-sm text-white border border-slate-800 focus:outline-none focus:border-violet-400 resize-none font-sans"
            />
          </div>

          {/* Mathematical Step-by-Step Breakdown */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <Calculator className="w-4 h-4" />
                <span className="font-semibold uppercase">Exact Mathematical Formula</span>
              </div>
              <span className="text-[11px] text-slate-500">Native 384D Space</span>
            </div>

            <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800/80 font-mono text-center text-sm text-cyan-200">
              {'cos(θ) = (u · v) / (||u||₂ · ||v||₂) = ∑(uᵢ · vᵢ) / (√∑uᵢ² · √∑vᵢ²)'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Dot Product (u · v)</span>
                <span className="text-cyan-300 font-bold">{stats.dot.toFixed(5)}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">||u|| Norm</span>
                <span className="text-slate-200 font-bold">{stats.normA.toFixed(4)}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">||v|| Norm</span>
                <span className="text-slate-200 font-bold">{stats.normB.toFixed(4)}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Angular θ</span>
                <span className="text-amber-400 font-bold">{stats.angleDeg.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Score & 3D Vector Angle Projection (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Similarity Score Card */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>HIGH-D COSINE SIMILARITY</span>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
            </div>

            {/* Score Big Display */}
            <div>
              <div className="text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">
                {stats.similarity >= 0 ? '+' : ''}
                {stats.similarity.toFixed(4)}
              </div>
              <span className="text-xs font-mono text-slate-500">Range: [-1.0000, +1.0000]</span>
            </div>

            {/* Normalized Scale Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Normalized Match:</span>
                <span className="text-cyan-300 font-bold">{stats.normalizedScore}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${stats.normalizedScore}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                />
              </div>
            </div>

            {/* Qualitative Badge */}
            <div
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${qualitativeInterpretation.color}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{qualitativeInterpretation.label}</span>
            </div>
          </div>

          {/* 3D Vector Angle Illustration Viewport */}
          <div className="relative h-56 w-full rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-lg">
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
              <ambientLight intensity={0.7} />
              <OrbitControls enableZoom={false} enablePan={false} />
              <VectorAngle3D angleRad={stats.angleRad} />
            </Canvas>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
              3D Angular Separation Illustration
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Sentence Similarity Matrix / Heatmap */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Grid className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Pairwise Cosine Similarity Heatmap Matrix (6x6)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Click any cell to compare</span>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-500 max-w-[120px]">Sentence</th>
                {matrixSentences.map((s, i) => (
                  <th key={i} className="p-2 text-center text-slate-400 font-normal truncate max-w-[90px]" title={s}>
                    S{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixSentences.map((rowText, rIdx) => (
                <tr key={rIdx} className="border-t border-slate-900">
                  <td className="p-2 text-slate-300 truncate max-w-[150px] font-sans" title={rowText}>
                    <span className="text-cyan-400 font-mono mr-1">S{rIdx + 1}:</span>
                    {rowText}
                  </td>
                  {matrixSentences.map((colText, cIdx) => {
                    const rowVec = matrixEmbeddings[rIdx];
                    const colVec = matrixEmbeddings[cIdx];
                    const sim = rowVec && colVec ? cosineSimilarity(rowVec, colVec) : rIdx === cIdx ? 1 : 0;

                    // Color mapping
                    const intensity = Math.max(0, sim);
                    const bgStyle =
                      sim >= 0.8
                        ? `rgba(16, 185, 129, ${0.2 + intensity * 0.5})`
                        : sim >= 0.5
                        ? `rgba(6, 182, 212, ${0.15 + intensity * 0.4})`
                        : sim >= 0.2
                        ? `rgba(59, 130, 246, ${0.1 + intensity * 0.3})`
                        : `rgba(139, 92, 246, ${0.05 + intensity * 0.2})`;

                    return (
                      <td
                        key={cIdx}
                        onClick={() => {
                          setTextA(rowText);
                          setTextB(colText);
                        }}
                        style={{ backgroundColor: bgStyle }}
                        className="p-2 text-center cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all font-semibold"
                        title={`S${rIdx + 1} vs S${cIdx + 1}: ${sim.toFixed(4)}`}
                      >
                        <span className={sim >= 0.8 ? 'text-emerald-300' : sim >= 0.5 ? 'text-cyan-300' : 'text-slate-300'}>
                          {sim.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
