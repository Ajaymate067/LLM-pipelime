/**
 * Mathematical utilities for vector operations, cosine similarity,
 * and Principal Component Analysis (PCA) projection.
 */

export interface PCAProjectionResult {
  points3D: [number, number, number][];
  explainedVariance: [number, number, number]; // Percentage of variance explained by PC1, PC2, PC3
  totalExplainedVariance: number;
}

/**
 * Compute the dot product of two vectors
 */
export function dotProduct(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Compute the L2 (Euclidean) norm of a vector
 */
export function l2Norm(v: ArrayLike<number>): number {
  let sumSq = 0;
  for (let i = 0; i < v.length; i++) {
    sumSq += v[i] * v[i];
  }
  return Math.sqrt(sumSq);
}

/**
 * Compute cosine similarity between two vectors in original high-dimensional space.
 * Range: [-1.0, 1.0]
 */
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length === 0 || b.length === 0) return 0;
  const dot = dotProduct(a, b);
  const normA = l2Norm(a);
  const normB = l2Norm(b);

  if (normA === 0 || normB === 0) return 0;

  const sim = dot / (normA * normB);
  // Clamp to [-1, 1] to prevent floating point inaccuracies beyond boundaries
  return Math.max(-1, Math.min(1, sim));
}

/**
 * Compute Euclidean distance between two vectors
 */
export function euclideanDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Normalize a vector to unit length (L2 norm = 1)
 */
export function normalizeVector(v: ArrayLike<number>): Float32Array {
  const norm = l2Norm(v);
  const result = new Float32Array(v.length);
  if (norm === 0) return result;
  for (let i = 0; i < v.length; i++) {
    result[i] = v[i] / norm;
  }
  return result;
}

/**
 * Compute Principal Component Analysis (PCA) to project N vectors of dimension D down to 3D.
 * Uses exact Gram matrix eigen-decomposition (SVD duality), guaranteeing optimal variance capture.
 */
export function computePCA(vectors: (Float32Array | number[])[], targetScale = 8): PCAProjectionResult {
  const N = vectors.length;
  if (N === 0) {
    return { points3D: [], explainedVariance: [0, 0, 0], totalExplainedVariance: 0 };
  }

  const D = vectors[0].length;

  if (N === 1) {
    return {
      points3D: [[0, 0, 0]],
      explainedVariance: [1, 0, 0],
      totalExplainedVariance: 1,
    };
  }

  // 1. Calculate Mean Vector
  const mean = new Float64Array(D);
  for (let i = 0; i < N; i++) {
    const vec = vectors[i];
    for (let d = 0; d < D; d++) {
      mean[d] += vec[d];
    }
  }
  for (let d = 0; d < D; d++) {
    mean[d] /= N;
  }

  // 2. Center Data: X_c = X - Mean
  const Xc: Float64Array[] = [];
  for (let i = 0; i < N; i++) {
    const centered = new Float64Array(D);
    const vec = vectors[i];
    for (let d = 0; d < D; d++) {
      centered[d] = vec[d] - mean[d];
    }
    Xc.push(centered);
  }

  // 3. Compute Gram Matrix K = Xc * Xc^T of size N x N
  // In PCA, the scores T = U * Sigma where U and Sigma^2 are eigenvectors and eigenvalues of K!
  const K: Float64Array[] = Array.from({ length: N }, () => new Float64Array(N));
  let totalTrace = 0;

  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      let dot = 0;
      for (let d = 0; d < D; d++) {
        dot += Xc[i][d] * Xc[j][d];
      }
      K[i][j] = dot;
      K[j][i] = dot;
      if (i === j) {
        totalTrace += dot;
      }
    }
  }

  // 4. Extract top 3 eigenvectors and eigenvalues using Power Iteration with Hotelling Deflation
  const numComponents = Math.min(3, N);
  const eigenvalues: number[] = [];
  const eigenvectors: Float64Array[] = [];

  // Clone K for deflation
  const deflatedK: Float64Array[] = K.map((row) => new Float64Array(row));

  for (let comp = 0; comp < numComponents; comp++) {
    // Initial random vector
    let v = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      v[i] = Math.sin(i * 137.5 + comp * 31.2);
    }
    // Normalize
    let norm = l2Norm(v);
    for (let i = 0; i < N; i++) v[i] /= norm || 1;

    let lambda = 0;
    const maxIterations = 80;
    const tolerance = 1e-7;

    for (let iter = 0; iter < maxIterations; iter++) {
      // Multiply: w = K * v
      const w = new Float64Array(N);
      for (let r = 0; r < N; r++) {
        let sum = 0;
        for (let c = 0; c < N; c++) {
          sum += deflatedK[r][c] * v[c];
        }
        w[r] = sum;
      }

      norm = l2Norm(w);
      if (norm < 1e-12) {
        lambda = 0;
        break;
      }

      const nextLambda = norm;
      const nextV = new Float64Array(N);
      for (let i = 0; i < N; i++) nextV[i] = w[i] / norm;

      // Check convergence
      let diff = 0;
      for (let i = 0; i < N; i++) {
        const d = Math.abs(nextV[i] - v[i]);
        if (d > diff) diff = d;
      }

      v = nextV;
      lambda = nextLambda;

      if (diff < tolerance) break;
    }

    eigenvalues.push(lambda);
    eigenvectors.push(v);

    // Deflate: K_next = K - lambda * (v * v^T)
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        deflatedK[r][c] -= lambda * v[r] * v[c];
      }
    }
  }

  // Calculate explained variance ratios
  const ev1 = totalTrace > 0 ? (eigenvalues[0] || 0) / totalTrace : 0;
  const ev2 = totalTrace > 0 ? (eigenvalues[1] || 0) / totalTrace : 0;
  const ev3 = totalTrace > 0 ? (eigenvalues[2] || 0) / totalTrace : 0;

  // Project data: Coordinate for sample i on component j is: v_j[i] * sqrt(lambda_j)
  const coords: [number, number, number][] = [];
  let maxCoordVal = 0;

  for (let i = 0; i < N; i++) {
    const x = eigenvectors[0] ? eigenvectors[0][i] * Math.sqrt(Math.max(0, eigenvalues[0])) : 0;
    const y = eigenvectors[1] ? eigenvectors[1][i] * Math.sqrt(Math.max(0, eigenvalues[1])) : 0;
    const z = eigenvectors[2] ? eigenvectors[2][i] * Math.sqrt(Math.max(0, eigenvalues[2])) : 0;

    maxCoordVal = Math.max(maxCoordVal, Math.abs(x), Math.abs(y), Math.abs(z));
    coords.push([x, y, z]);
  }

  // Scale coordinates into [-targetScale, targetScale] for comfortable 3D camera viewing
  const scaleFactor = maxCoordVal > 1e-7 ? targetScale / maxCoordVal : 1;
  const points3D: [number, number, number][] = coords.map(([x, y, z]) => [
    parseFloat((x * scaleFactor).toFixed(4)),
    parseFloat((y * scaleFactor).toFixed(4)),
    parseFloat((z * scaleFactor).toFixed(4)),
  ]);

  return {
    points3D,
    explainedVariance: [ev1, ev2, ev3],
    totalExplainedVariance: Math.min(1, ev1 + ev2 + ev3),
  };
}

/**
 * Format float number nicely
 */
export function formatFloat(val: number, decimals = 4): string {
  return Number(val).toFixed(decimals);
}

