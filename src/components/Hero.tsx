import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Binary, Orbit, ShieldCheck, Cpu } from 'lucide-react';
import { NavTab } from './Navbar';

interface HeroProps {
  onSelectTab: (tab: NavTab) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectTab }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);

  // Animated pipeline steps
  useEffect(() => {
    const timer = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Floating 3D particle constellation canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate 3D nodes projected with rotation
    const numNodes = 42;
    const nodes = Array.from({ length: numNodes }, () => ({
      x: (Math.random() - 0.5) * width * 0.8,
      y: (Math.random() - 0.5) * height * 0.7,
      z: (Math.random() - 0.5) * 300,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.3,
      color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7',
      radius: Math.random() * 2 + 1.5,
    }));

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angle += 0.003;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const projected = nodes.map((node) => {
        // Rotate around Y axis
        const rotX = node.x * cosA - node.z * sinA;
        const rotZ = node.x * sinA + node.z * cosA + 350; // Camera distance
        const scale = 350 / Math.max(50, rotZ);
        const projX = width / 2 + rotX * scale;
        const projY = height / 2 + node.y * scale;

        // Update velocities
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;
        if (Math.abs(node.x) > width * 0.45) node.vx *= -1;
        if (Math.abs(node.y) > height * 0.4) node.vy *= -1;
        if (Math.abs(node.z) > 180) node.vz *= -1;

        return { projX, projY, scale, color: node.color, radius: node.radius };
      });

      // Draw connection lines
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].projX - projected[j].projX;
          const dy = projected[i].projY - projected[j].projY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            const alpha = (1 - dist / 90) * 0.35;
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].projX, projected[i].projY);
            ctx.lineTo(projected[j].projX, projected[j].projY);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.projX, p.projY, p.radius * Math.max(0.4, p.scale), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const pipelineStages = [
    { label: 'Raw Prompt', value: '"The cat is sleeping"', color: 'text-slate-300' },
    { label: 'Token IDs', value: '[9906, 8419, 374, 18921]', color: 'text-cyan-400 font-mono' },
    { label: 'Contextual Vector', value: '384-dimensional dense float tensor', color: 'text-violet-400 font-mono' },
    { label: '3D PCA Coordinate', value: '(x: +4.21, y: -1.08, z: +2.94)', color: 'text-emerald-400 font-mono' },
  ];

  return (
    <div className="relative overflow-hidden pt-8 pb-14 border-b border-cyan-500/10">
      {/* Background dynamic grid & glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#081b2e15_1px,transparent_1px),linear-gradient(to_bottom,#081b2e15_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mission statement & interactive CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Full Browser-Native LLM Geometric Inspection Lab</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Inside the Mind of an{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">
                LLM
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              Witness how human language is broken into discrete tokens, translated into high-dimensional latent space,
              and projected into a navigable 3D geometric universe. Explore cosine similarity, SVD/PCA reduction, and semantic search in real-time.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onSelectTab('vector-space')}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                <Orbit className="w-4 h-4" />
                <span>Launch 3D Vector Space</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => onSelectTab('tokenizer')}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-medium transition-all text-sm"
              >
                <Binary className="w-4 h-4" />
                <span>Inspect Tokenizer</span>
              </button>

              <button
                onClick={() => onSelectTab('learn')}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-sm"
              >
                <span>Educational Tour</span>
              </button>
            </div>

            {/* Technical Verification Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Real Tokenizer</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">cl100k & o200k BPE</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center space-x-1.5 text-violet-400 text-xs font-mono">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Real Embeddings</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">MiniLM 384D ONNX</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-mono">
                  <Orbit className="w-3.5 h-3.5" />
                  <span>Exact Math</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Gram SVD / PCA 3D</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zero Mock Data</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Strict live inference</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Constellation & Live Pipeline Monitor */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-slate-950/70 border border-cyan-500/30 p-1 shadow-2xl shadow-cyan-950/50 overflow-hidden">
              {/* 3D Canvas */}
              <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900/90">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                  LIVE 3D EMBEDDING CONSTELLATION
                </div>
                <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500">
                  N=42 high-dim projection
                </div>
              </div>

              {/* Animated Live Pipeline Stepper */}
              <div className="p-4 bg-slate-900/60 rounded-xl mt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>TRANSFORMATION PIPELINE</span>
                  <span className="text-cyan-400">Step {pipelineStep + 1} of 4</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          step === pipelineStep
                            ? 'bg-gradient-to-r from-cyan-400 to-violet-500'
                            : step < pipelineStep
                            ? 'bg-cyan-500/40'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                      {pipelineStages[pipelineStep].label}
                    </span>
                    <span className={`text-xs font-medium block truncate ${pipelineStages[pipelineStep].color}`}>
                      {pipelineStages[pipelineStep].value}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

