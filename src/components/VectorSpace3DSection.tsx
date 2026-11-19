import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Orbit,
  Plus,
  RotateCcw,
  Layers,
  Info,
  Maximize2,
  Trash2,
  Sparkles,
  Compass,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { DEFAULT_CORPUS, CorpusItem } from '../data/defaultCorpus';
import { embeddingService } from '../services/embeddingService';
import { computePCA, cosineSimilarity, euclideanDistance, formatFloat } from '../utils/mathUtils';

interface ProjectedNode extends CorpusItem {
  pos3D: [number, number, number];
}

// Interactive 3D Point Node Component
const PointNode: React.FC<{
  node: ProjectedNode;
  isSelected: boolean;
  isSecondary: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ node, isSelected, isSecondary, onClick, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle float/pulse animation
  useFrame((state) => {
    if (!meshRef.current) return;
    if (isSelected || isSecondary) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const nodeColor = isSelected ? '#ffffff' : isSecondary ? '#38bdf8' : node.color;
  const radius = isSelected ? 0.35 : isSecondary ? 0.3 : hovered ? 0.28 : 0.22;

  return (
    <group position={node.pos3D}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(false);
        }}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isSelected ? 1.5 : hovered ? 1.0 : 0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Outer halo ring for selected nodes */}
      {(isSelected || isSecondary || hovered) && (
        <mesh>
          <ringGeometry args={[radius * 1.4, radius * 1.7, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#ffffff' : '#22d3ee'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Floating 3D Text Label */}
      <Html distanceFactor={18} position={[0, radius + 0.3, 0]} center pointerEvents="none">
        <div
          className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium whitespace-nowrap shadow-lg backdrop-blur-md transition-all select-none ${
            isSelected
              ? 'bg-cyan-500 text-black font-bold ring-2 ring-white scale-110'
              : isSecondary
              ? 'bg-sky-500/90 text-white font-semibold'
              : hovered
              ? 'bg-slate-900/95 text-cyan-200 border border-cyan-400/50 scale-105'
              : 'bg-slate-950/75 text-slate-300 border border-slate-800'
          }`}
        >
          {node.text}
        </div>
      </Html>
    </group>
  );
};

// 3D Connecting Line between two selected points
const ConnectingDistanceLine: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  highDimCosSim: number;
  projDistance: number;
}> = ({ start, end, highDimCosSim, projDistance }) => {
  const midPoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.3,
    (start[2] + end[2]) / 2,
  ];

  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group>
      {/* Three.js Line */}
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#22d3ee', linewidth: 2 }))} />

      {/* Floating metric indicator */}
      <Html position={midPoint} center distanceFactor={16} pointerEvents="none">
        <div className="bg-slate-950/90 text-cyan-300 border border-cyan-400 px-2.5 py-1 rounded-md text-[10px] font-mono shadow-2xl backdrop-blur-md whitespace-nowrap">
          <div>High-D Cosine Sim: <strong>{highDimCosSim.toFixed(4)}</strong></div>
          <div className="text-slate-400 text-[9px]">3D Euclidean Dist: {projDistance.toFixed(2)}</div>
        </div>
      </Html>
    </group>
  );
};

// 3D Coordinate Grid & Axes
const AxesAndGrid: React.FC = () => {
  return (
    <group>
      {/* Floor grid */}
      <gridHelper args={[24, 24, '#1e293b', '#0f172a']} position={[0, -8, 0]} />

      {/* Coordinate axes lines */}
      {/* X Axis (Red/Cyan) */}
      <mesh position={[0, -8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 20]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
      </mesh>

      {/* Y Axis (Green/Emerald) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 20]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
      </mesh>

      {/* Z Axis (Blue/Violet) */}
      <mesh position={[0, -8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 20]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
      </mesh>

      {/* Axes labels */}
      <Html position={[10.5, -8, 0]} center pointerEvents="none">
        <span className="text-[10px] font-mono text-rose-400/80 bg-slate-950/80 px-1 rounded">PC1 (X)</span>
      </Html>
      <Html position={[0, 9.5, 0]} center pointerEvents="none">
        <span className="text-[10px] font-mono text-emerald-400/80 bg-slate-950/80 px-1 rounded">PC2 (Y)</span>
      </Html>
      <Html position={[0, -8, 10.5]} center pointerEvents="none">
        <span className="text-[10px] font-mono text-blue-400/80 bg-slate-950/80 px-1 rounded">PC3 (Z)</span>
      </Html>
    </group>
  );
};

export const VectorSpace3DSection: React.FC = () => {
  const [corpus, setCorpus] = useState<CorpusItem[]>(DEFAULT_CORPUS);
  const [newSentence, setNewSentence] = useState('');
  const [newCategory, setNewCategory] = useState('Custom');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('1');
  const [secondaryNodeId, setSecondaryNodeId] = useState<string | null>('2');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const controlsRef = useRef<any>(null);

  // Compute PCA 3D projection across all active corpus items
  const pcaResult = useMemo(() => {
    const vectors = corpus.map((c) => c.embedding);
    return computePCA(vectors, 7.5);
  }, [corpus]);

  // Merge 3D coordinates with corpus items
  const projectedNodes: ProjectedNode[] = useMemo(() => {
    return corpus.map((item, idx) => ({
      ...item,
      pos3D: pcaResult.points3D[idx] || [0, 0, 0],
    }));
  }, [corpus, pcaResult]);

  // Filtered nodes
  const visibleNodes = useMemo(() => {
    if (selectedCategoryFilter === 'all') return projectedNodes;
    return projectedNodes.filter((n) => n.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
  }, [projectedNodes, selectedCategoryFilter]);

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(corpus.map((c) => c.category)));
  }, [corpus]);

  // Active selected nodes for distance/similarity measurement
  const primaryNode = useMemo(() => {
    return projectedNodes.find((n) => n.id === selectedNodeId) || null;
  }, [projectedNodes, selectedNodeId]);

  const secondaryNode = useMemo(() => {
    return projectedNodes.find((n) => n.id === secondaryNodeId) || null;
  }, [projectedNodes, secondaryNodeId]);

  // Comparison metrics between selected pair
  const comparisonMetrics = useMemo(() => {
    if (!primaryNode || !secondaryNode || primaryNode.id === secondaryNode.id) return null;

    const highDimSim = cosineSimilarity(primaryNode.embedding, secondaryNode.embedding);
    const projDist = euclideanDistance(primaryNode.pos3D, secondaryNode.pos3D);

    return {
      highDimSim,
      projDist,
    };
  }, [primaryNode, secondaryNode]);

  // Node selection handler
  const handleNodeClick = (nodeId: string) => {
    if (!selectedNodeId || selectedNodeId === nodeId) {
      setSelectedNodeId(nodeId);
      setSecondaryNodeId(null);
    } else if (!secondaryNodeId) {
      setSecondaryNodeId(nodeId);
    } else {
      setSelectedNodeId(nodeId);
      setSecondaryNodeId(null);
    }
  };

  // Add custom sentence to 3D space
  const handleAddSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSentence.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const vec = await embeddingService.getSentenceEmbedding(newSentence.trim());
      const newItem: CorpusItem = {
        id: `custom-${Date.now()}`,
        text: newSentence.trim(),
        category: newCategory || 'Custom',
        color: '#22d3ee',
        embedding: Array.from(vec),
      };

      setCorpus((prev) => [...prev, newItem]);
      setSelectedNodeId(newItem.id);
      setNewSentence('');
    } catch (err) {
      console.error('Error adding sentence:', err);
    } finally {
      setIsAdding(false);
    }
  };

  // Reset 3D camera
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Reset corpus to default
  const handleResetCorpus = () => {
    setCorpus(DEFAULT_CORPUS);
    setSelectedNodeId('1');
    setSecondaryNodeId('2');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Orbit className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Interactive 3D Embedding Space</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              PCA SVD Projection
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real 384-dimensional sentence vectors mathematically projected down to 3D. Click nodes to measure high-dimensional angle vs 3D proximity.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetCamera}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Camera</span>
          </button>
          <button
            onClick={handleResetCorpus}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Reset Corpus</span>
          </button>
        </div>
      </div>

      {/* Main 3D Viewport & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Canvas Viewport (Col 8) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative h-[550px] w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl overflow-hidden">
            {/* Canvas */}
            <Canvas
              camera={{ position: [14, 10, 16], fov: 45 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <ambientLight intensity={0.6} />
              <pointLight position={[15, 20, 15]} intensity={1.2} />
              <pointLight position={[-15, -10, -15]} intensity={0.5} color="#8b5cf6" />

              <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.05}
                minDistance={5}
                maxDistance={35}
              />

              <AxesAndGrid />

              {/* Render Nodes */}
              {visibleNodes.map((node) => (
                <PointNode
                  key={node.id}
                  node={node}
                  isSelected={node.id === selectedNodeId}
                  isSecondary={node.id === secondaryNodeId}
                  onClick={() => handleNodeClick(node.id)}
                  onHover={() => {}}
                />
              ))}

              {/* Connecting line between primary and secondary selection */}
              {primaryNode && secondaryNode && comparisonMetrics && (
                <ConnectingDistanceLine
                  start={primaryNode.pos3D}
                  end={secondaryNode.pos3D}
                  highDimCosSim={comparisonMetrics.highDimSim}
                  projDistance={comparisonMetrics.projDist}
                />
              )}
            </Canvas>

            {/* Viewport Overlay Controls */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 pointer-events-auto">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                }`}
              >
                All ({corpus.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    selectedCategoryFilter === cat
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Bottom Info HUD */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 pointer-events-none">
              <div className="flex items-center space-x-3">
                <span className="text-cyan-400">● Left Click: Rotate</span>
                <span className="text-violet-400">● Right Click: Pan</span>
                <span className="text-emerald-400">● Scroll: Zoom</span>
              </div>
              <div>
                PCA Variance Captured: <strong>{(pcaResult.totalExplainedVariance * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Dimensionality Reduction Mathematical Notice */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-amber-400 font-mono font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Dimensionality Reduction Note: 384D vs 3D Distance</span>
            </div>
            <p className="leading-relaxed">
              In original latent space, each sentence has 384 orthogonal dimensions. Projecting to 3D using Principal Component Analysis preserves the 3 axes of maximal variance (
              <span className="text-cyan-300">PC1: {(pcaResult.explainedVariance[0] * 100).toFixed(1)}%</span>,{' '}
              <span className="text-emerald-300">PC2: {(pcaResult.explainedVariance[1] * 100).toFixed(1)}%</span>,{' '}
              <span className="text-violet-300">PC3: {(pcaResult.explainedVariance[2] * 100).toFixed(1)}%</span>
              ). Because 381 dimensions are discarded, 3D spatial proximity is an approximation. True semantic similarity is always measured in high-dimensional space!
            </p>
          </div>
        </div>

        {/* Sidebar Controls & Inspector (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Add Sentence Form */}
          <form onSubmit={handleAddSentence} className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span className="font-semibold uppercase">Add Sentence to 3D Space</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            <input
              type="text"
              value={newSentence}
              onChange={(e) => setNewSentence(e.target.value)}
              placeholder="e.g. 'A tiny puppy is playing in grass'"
              className="w-full bg-slate-900/80 p-2.5 rounded-lg text-xs text-white border border-slate-800 focus:outline-none focus:border-cyan-400"
            />

            <div className="flex space-x-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                aria-label="Sentence Category"
                className="bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg px-2 py-1.5 flex-1 focus:outline-none"
              >
                <option value="Animals">Animals</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Weather">Weather</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Custom">Custom</option>
              </select>

              <button
                type="submit"
                disabled={!newSentence.trim() || isAdding}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Embedding...' : 'Plot Point'}</span>
              </button>
            </div>
          </form>

          {/* Selected Pair Comparison Inspector */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
              Node Pair Semantic Inspector
            </span>

            {primaryNode ? (
              <div className="space-y-3">
                {/* Node 1 */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/40">
                  <div className="flex justify-between text-[10px] font-mono text-cyan-400 mb-1">
                    <span>PRIMARY SELECTION</span>
                    <span>{primaryNode.category}</span>
                  </div>
                  <div className="text-xs font-medium text-white">"{primaryNode.text}"</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    3D Coords: [{primaryNode.pos3D.join(', ')}]
                  </div>
                </div>

                {/* Node 2 */}
                {secondaryNode ? (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-sky-500/40">
                    <div className="flex justify-between text-[10px] font-mono text-sky-400 mb-1">
                      <span>SECONDARY SELECTION</span>
                      <span>{secondaryNode.category}</span>
                    </div>
                    <div className="text-xs font-medium text-white">"{secondaryNode.text}"</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      3D Coords: [{secondaryNode.pos3D.join(', ')}]
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    Click another node in the 3D space to compare semantic distance
                  </div>
                )}

                {/* Comparison Results */}
                {comparisonMetrics && (
                  <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">High-D Cosine Similarity</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {comparisonMetrics.highDimSim >= 0 ? '+' : ''}
                        {comparisonMetrics.highDimSim.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Projected 3D Distance</span>
                      <span className="text-violet-400 font-bold">{comparisonMetrics.projDist.toFixed(2)} units</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, ((comparisonMetrics.highDimSim + 1) / 2) * 100))}%`,
                        }}
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Click any sphere in the 3D space to inspect its coordinates and embeddings.</p>
            )}
          </div>

          {/* Quick Preset Sentences from the User Prompt */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Prompt Benchmark Sentences</span>
            <div className="space-y-1">
              {[
                'The cat is sleeping',
                'A kitten is resting',
                'I love programming',
                'Python is a programming language',
                'The stock market is falling',
                'The weather is sunny',
              ].map((benchText, idx) => {
                const found = projectedNodes.find((n) => n.text === benchText);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (found) {
                        setSelectedNodeId(found.id);
                        setSecondaryNodeId(null);
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">"{benchText}"</span>
                    <span className="text-[10px] font-mono text-cyan-400">Select</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
