import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Hero } from './components/Hero';
import { TokenizerSection } from './components/TokenizerSection';
import { EmbeddingLabSection } from './components/EmbeddingLabSection';
import { VectorSpace3DSection } from './components/VectorSpace3DSection';
import { CosineSimilaritySection } from './components/CosineSimilaritySection';
import { SemanticSearchSection } from './components/SemanticSearchSection';
import { InteractiveLearningSection } from './components/InteractiveLearningSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('tokenizer');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Sync dark class on document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleNavigateTo3D = (nodeId: string) => {
    setActiveTab('vector-space');
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
      />

      {/* Main Hero Header */}
      <Hero onSelectTab={setActiveTab} />

      {/* Main Interactive Workspaces */}
      <main className="flex-1">
        {activeTab === 'tokenizer' && <TokenizerSection />}
        {activeTab === 'embedding-lab' && <EmbeddingLabSection />}
        {activeTab === 'vector-space' && <VectorSpace3DSection />}
        {activeTab === 'cosine-similarity' && <CosineSimilaritySection />}
        {activeTab === 'semantic-search' && (
          <SemanticSearchSection
            onNavigateTo3D={handleNavigateTo3D}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'learn' && <InteractiveLearningSection />}
      </main>

      {/* Footer */}
      <Footer onSelectTab={setActiveTab} />
    </div>
  );
};

export default App;

