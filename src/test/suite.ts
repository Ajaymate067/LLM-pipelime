import { tokenizeText, calculateTokenStats } from '../services/tokenizerService';
import { cosineSimilarity, dotProduct, l2Norm, computePCA, euclideanDistance } from '../utils/mathUtils';
import { DEFAULT_CORPUS } from '../data/defaultCorpus';

console.log('🧪 RUNNING VECTORVERSE INTEGRATION & ALGORITHM TEST SUITE...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// 1. TOKENIZER TESTS
console.log('--- 1. Testing Tokenizer Service (js-tiktoken) ---');
const sampleText = 'Hello world! Artificial intelligence.';
const tokens = tokenizeText(sampleText, 'cl100k_base');
assert(tokens.length > 0, 'Tokens generated successfully');
assert(tokens.every((t) => typeof t.id === 'number' && t.id >= 0), 'All token IDs are valid non-negative integers');
assert(tokens.every((t) => t.bytes.length > 0), 'Every token has valid byte sequence');

const stats = calculateTokenStats(sampleText, tokens);
assert(stats.tokenCount === tokens.length, 'Token count matches stats');
assert(stats.charCount === sampleText.length, 'Char count matches input text');
assert(stats.byteCount >= sampleText.length, 'Byte count is valid UTF-8 length');

// Test o200k_base
const tokensO200k = tokenizeText(sampleText, 'o200k_base');
assert(tokensO200k.length > 0, 'o200k_base tokenization functions correctly');

// 2. VECTOR MATH & COSINE SIMILARITY TESTS
console.log('\n--- 2. Testing High-Dimensional Vector Math ---');
const v1 = new Float32Array([1, 0, 0]);
const v2 = new Float32Array([0, 1, 0]);
const v3 = new Float32Array([1, 0, 0]);
const v4 = new Float32Array([-1, 0, 0]);

assert(Math.abs(cosineSimilarity(v1, v2)) < 1e-6, 'Orthogonal vectors have cosine similarity = 0');
assert(Math.abs(cosineSimilarity(v1, v3) - 1.0) < 1e-6, 'Identical vectors have cosine similarity = 1.0');
assert(Math.abs(cosineSimilarity(v1, v4) - (-1.0)) < 1e-6, 'Opposite vectors have cosine similarity = -1.0');

// Test with real 384D embeddings from default corpus
const catEmb = DEFAULT_CORPUS[0].embedding; // 'The cat is sleeping'
const kittenEmb = DEFAULT_CORPUS[1].embedding; // 'A kitten is resting'
const marketEmb = DEFAULT_CORPUS[7].embedding; // 'The stock market is falling'

const simCatKitten = cosineSimilarity(catEmb, kittenEmb);
const simCatMarket = cosineSimilarity(catEmb, marketEmb);

console.log(`  📊 "cat is sleeping" vs "kitten is resting" cosine similarity: ${simCatKitten.toFixed(4)}`);
console.log(`  📊 "cat is sleeping" vs "stock market is falling" cosine similarity: ${simCatMarket.toFixed(4)}`);

assert(simCatKitten > 0.5, 'Semantically related sentences have strong cosine similarity (> 0.5)');
assert(simCatKitten > simCatMarket, 'Cat vs Kitten is significantly more similar than Cat vs Stock Market');
assert(Math.abs(l2Norm(catEmb) - 1.0) < 1e-3, 'Sentence embeddings are properly L2 unit normalized');

// 3. PCA 3D PROJECTION TESTS
console.log('\n--- 3. Testing PCA SVD Dimensionality Reduction to 3D ---');
const vectors = DEFAULT_CORPUS.map((c) => c.embedding);
const pca = computePCA(vectors, 8);

assert(pca.points3D.length === DEFAULT_CORPUS.length, 'PCA generates exact 3D coordinates for all inputs');
assert(pca.points3D.every((pt) => pt.length === 3), 'All projected points have [x, y, z] structure');
assert(pca.totalExplainedVariance > 0 && pca.totalExplainedVariance <= 1.0, 'Total explained variance is within (0, 1]');
assert(pca.explainedVariance[0] >= pca.explainedVariance[1], 'PC1 explains at least as much variance as PC2');
assert(pca.explainedVariance[1] >= pca.explainedVariance[2], 'PC2 explains at least as much variance as PC3');

// Check coordinate scaling
const maxCoord = Math.max(...pca.points3D.flatMap((pt) => pt.map(Math.abs)));
assert(maxCoord <= 8.01, '3D coordinates are bounded within target viewing scale (<= 8.0)');

// 4. SEMANTIC SEARCH RANKING TESTS
console.log('\n--- 4. Testing Semantic Search k-NN Retrieval ---');
// Query with "cat"
const querySims = DEFAULT_CORPUS.map((doc) => ({
  doc,
  sim: cosineSimilarity(catEmb, doc.embedding),
})).sort((a, b) => b.sim - a.sim);

assert(querySims[0].doc.id === '1', 'Top result for identical vector is the document itself');
assert(querySims[1].doc.category === 'Animals', 'Second nearest neighbor is in the same category (Animals)');

console.log(`\n========================================`);
console.log(`🎉 TEST SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log(`========================================\n`);
