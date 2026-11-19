# VECTORVERSE — Inside the Mind of an LLM

> **An interactive, browser-native AI laboratory visualizing the geometric transition of text from discrete BPE tokens into continuous 384-dimensional latent manifolds and interactive 3D PCA space.**

![VECTORVERSE](https://img.shields.io/badge/Architecture-ONNX%20WASM%20Neural%20Inference-06b6d4?style=for-the-badge)
![React](https://img.shields.io/badge/React%2018-Vite%20%2B%20TypeScript-8b5cf6?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-React%20Three%20Fiber-10b981?style=for-the-badge)
![Zero Mock Data](https://img.shields.io/badge/AI%20Integrity-Zero%20Simulated%20Data-ec4899?style=for-the-badge)

---

## 🌌 Overview

**VECTORVERSE** is a high-fidelity interactive educational laboratory designed to illuminate the inner workings of Large Language Models (LLMs). Rather than treating embeddings and vector search as abstract black boxes, Vectorverse exposes every stage of the pipeline with real-time mathematical precision:

1. **Discrete Subword Tokenization**: Real BPE tokenization using `js-tiktoken` (`cl100k_base`, `o200k_base`, `p50k_base`, `r50k_base`) with byte boundaries, UTF-8 hex representations, and vocabulary IDs.
2. **Dense Neural Embeddings**: Real in-browser neural execution using `@xenova/transformers` with the `Xenova/all-MiniLM-L6-v2` 384-dimensional model (running via ONNX Runtime Web / WASM).
3. **Exact High-Dimensional Cosine Similarity**: Computing true inner products and angular separations in the original 384-dimensional space rather than projected approximations.
4. **Exact Gram SVD / PCA Projection**: Mathematically sound Principal Component Analysis projecting 384D manifolds down to interactive, navigable 3D coordinate spaces with variance preservation metrics.
5. **Semantic Search (k-NN)**: Real-time query embedding and nearest-neighbor document retrieval compared against traditional keyword/lexical search.
6. **Zero Mock Data Guarantee**: No fake similarity scores, fabricated token IDs, or randomized vector coordinates.

---

## 🛠️ Tech Stack

- **Framework**: React 18, Vite 6, TypeScript
- **Styling**: Tailwind CSS, Glassmorphism, Cyberpunk / Scientific Laboratory Theme
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Tokenizer Engine**: `js-tiktoken` (official OpenAI BPE tokenization implementation)
- **Neural Embedding Engine**: `@xenova/transformers` (quantized int8 `all-MiniLM-L6-v2` in browser WASM)
- **Vector Mathematics**: Custom numerically stable SVD / Gram Matrix PCA, L2 normalization, and high-dimensional dot product engines
- **Icons & UI**: `lucide-react`, `framer-motion`

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18.0.0` or higher (tested on Node v26)
- npm `v9.0.0` or higher

### Installation

```bash
# Clone or navigate to the repository
cd vectorverse

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Running Algorithmic & Mathematics Test Suite

To verify tokenizer accuracy, high-dimensional cosine similarity, PCA variance, and semantic search retrieval:

```bash
npm test
```

### Building for Production

```bash
npm run build
```

The optimized static build will be placed in the `dist/` directory with code splitting across vendor, Three.js, and neural runtime modules.

---

## 🔬 Core Exploration Modules

### 1. Live BPE Tokenizer
- **Encodings Supported**: `o200k_base` (GPT-4o), `cl100k_base` (GPT-4 / 3.5), `p50k_base` (Codex), `r50k_base` (GPT-2/3).
- **Interactive Chips**: Hover and click chips to inspect Token ID, UTF-8 byte arrays, hexadecimal notation, and character spans.
- **Compare Mode**: Side-by-side comparison of two sentences demonstrating token count variance and vocabulary compression ratios.
- **Real-Time Debouncing**: Live typing feedback with accurate character-to-token statistics.

### 2. Embedding Lab
- **5-Step Visual Pipeline**: `Input Text` → `Token IDs` → `Multi-Head Self-Attention` → `384D Dense Vector` → `3D PCA Space`.
- **Full 384D Inspector**: Interactive heatmap ribbon displaying all 384 floating-point coordinates. Hover to inspect individual dimensions with sign, magnitude, and activation intensity.
- **Contextual vs Sentence Embeddings**: Clear educational and technical distinction between static token lookups, contextual hidden states ($H \in \mathbb{R}^{L \times 384}$), and mean-pooled unit vectors.
- **Vector Statistics**: Real-time Euclidean L2 norm, min/max activations, mean, and dispersion.

### 3. Interactive 3D Embedding Space
- **Navigable Point Cloud**: Rendered using React Three Fiber with OrbitControls (pan, rotate, zoom, and camera reset).
- **Dynamic PCA Re-projection**: When a new sentence is entered, its real 384D vector is computed, and PCA is re-evaluated across the entire corpus so all 3D coordinates remain strictly comparable.
- **Pairwise Distance Tool**: Click two nodes in 3D space to render a glowing connector showing the projected 3D distance alongside the true high-dimensional cosine similarity.
- **Variance Metric**: Displays exact variance captured by the top 3 principal components ($PC_1 + PC_2 + PC_3$).

### 4. Cosine Similarity Explorer
- **Two Editable Sentences**: Instantaneous cosine similarity calculation in native 384D space.
- **Mathematical Deep Dive**: Step-by-step formula showing $\mathbf{u} \cdot \mathbf{v}$, $\|\mathbf{u}\|$, $\|\mathbf{v}\|$, and exact angular separation $\theta$ in degrees.
- **3D Angle Projection**: Interactive visual representation of two unit vectors subtending angle $\theta$.
- **6x6 Heatmap Matrix**: Interactive matrix comparing pairwise cosine similarities across multiple semantic categories.

### 5. Semantic Search Playground
- **Natural Language Querying**: Embeds queries and ranks corpus documents by cosine similarity.
- **3D Node Highlighting**: Selecting any search result highlights and focuses that document in the 3D Vector Space.
- **Editable Corpus**: Add custom sentences or remove existing ones with instant re-indexing.
- **Lexical vs Semantic Insights**: Demonstrates how dense vector search finds relevant documents even when zero keyword overlap exists.

### 6. Interactive Learning Lab
- **6 Guided Chapters**:
  1. Tokenization & Byte-Pair Encoding
  2. The Embedding Matrix: Discrete to Continuous
  3. Transformer Attention & Sentence Pooling
  4. High-Dimensional Latent Geometry
  5. Cosine Similarity vs Euclidean Distance
  6. Dimensionality Reduction: PCA & SVD
- **Formula Deep Dive Toggle**: Accessible mathematical formulas for formal linear algebra concepts.
- **Interactive Quiz**: Real-time comprehension check on high-dimensional geometry.

---

## 📐 Mathematical Formulation

### High-Dimensional Cosine Similarity
$$\text{Cosine}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_{i=1}^{d} u_i v_i}{\sqrt{\sum_{i=1}^d u_i^2} \sqrt{\sum_{i=1}^d v_i^2}}$$

### SVD / Gram Matrix Dual PCA
For $N$ sentences with centered matrix $\mathbf{X}_c \in \mathbb{R}^{N \times D}$:
1. Compute Gram kernel matrix $\mathbf{K} = \mathbf{X}_c \mathbf{X}_c^T \in \mathbb{R}^{N \times N}$.
2. Solve for top 3 eigenvectors $\mathbf{u}_1, \mathbf{u}_2, \mathbf{u}_3$ and eigenvalues $\lambda_1, \lambda_2, \lambda_3$ using power iteration with Hotelling deflation.
3. Compute exact 3D coordinates:
$$\mathbf{T}_{:, j} = \sqrt{\lambda_j} \mathbf{u}_j, \quad j \in \{1, 2, 3\}$$

---

## 📄 License
MIT License. Built for education and research into LLM latent spaces.

