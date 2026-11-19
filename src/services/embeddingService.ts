import { pipeline, env, FeatureExtractionPipeline } from '@xenova/transformers';
import { DEFAULT_CORPUS } from '../data/defaultCorpus';

// Configure environment for browser execution
// Disables local models, enables browser cache in CacheStorage/IndexedDB
if (typeof window !== 'undefined') {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ModelProgress {
  status: ModelStatus;
  progress: number; // 0 to 100
  file?: string;
  message: string;
  error?: string;
}

type ProgressListener = (progress: ModelProgress) => void;

class EmbeddingService {
  private extractor: FeatureExtractionPipeline | null = null;
  private modelPromise: Promise<FeatureExtractionPipeline> | null = null;
  private currentProgress: ModelProgress = {
    status: 'idle',
    progress: 0,
    message: 'Model standby (Xenova/all-MiniLM-L6-v2)',
  };
  private listeners: Set<ProgressListener> = new Set();
  private cache: Map<string, Float32Array> = new Map();

  constructor() {
    // Populate cache with default corpus real embeddings
    for (const item of DEFAULT_CORPUS) {
      this.cache.set(item.text.trim().toLowerCase(), new Float32Array(item.embedding));
    }
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProgress);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(update: Partial<ModelProgress>) {
    this.currentProgress = { ...this.currentProgress, ...update };
    for (const listener of this.listeners) {
      listener(this.currentProgress);
    }
  }

  public getStatus(): ModelProgress {
    return this.currentProgress;
  }

  /**
   * Initializes or gets the feature-extraction pipeline
   */
  public async initModel(): Promise<FeatureExtractionPipeline> {
    if (this.extractor) {
      return this.extractor;
    }

    if (this.modelPromise) {
      return this.modelPromise;
    }

    this.notify({
      status: 'loading',
      progress: 5,
      message: 'Initializing Transformers.js ONNX runtime (WASM/CPU)...',
    });

    this.modelPromise = (async () => {
      try {
        const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          quantized: true,
          progress_callback: (p: { status?: string; progress?: number; file?: string; loaded?: number; total?: number }) => {
            if (p.status === 'progress' && typeof p.progress === 'number') {
              this.notify({
                status: 'loading',
                progress: Math.min(99, Math.round(p.progress)),
                file: p.file || 'model.onnx',
                message: `Downloading model weights: ${Math.round(p.progress)}%`,
              });
            } else if (p.status === 'done') {
              this.notify({
                status: 'loading',
                progress: 95,
                message: 'Loading quantized tensor weights into memory...',
              });
            }
          },
        });

        this.extractor = pipe as FeatureExtractionPipeline;
        this.notify({
          status: 'ready',
          progress: 100,
          message: 'Model ready (all-MiniLM-L6-v2, 384D, ONNX WASM)',
        });
        return this.extractor;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.notify({
          status: 'error',
          progress: 0,
          message: 'Failed to initialize model in browser',
          error: errorMsg,
        });
        this.modelPromise = null;
        throw err;
      }
    })();

    return this.modelPromise;
  }

  /**
   * Generates a 384-dimensional sentence embedding using mean pooling and L2 normalization
   */
  public async getSentenceEmbedding(text: string): Promise<Float32Array> {
    const trimmed = text.trim();
    if (!trimmed) {
      return new Float32Array(384);
    }

    const cacheKey = trimmed.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const extractor = await this.initModel();
    const output = await extractor(trimmed, { pooling: 'mean', normalize: true });
    const rawData = output.data as Float32Array;
    const embedding = new Float32Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      embedding[i] = rawData[i];
    }

    this.cache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Computes contextual representations (last_hidden_state) for each token
   */
  public async getContextualTokenEmbeddings(text: string): Promise<{
    tokens: string[];
    tokenEmbeddings: Float32Array[];
  }> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { tokens: [], tokenEmbeddings: [] };
    }

    const extractor = await this.initModel();

    // Use tokenizer from the pipeline
    const tokenizer = (extractor as any).tokenizer;
    let tokens: string[] = [];
    if (tokenizer) {
      const tokenized = tokenizer(trimmed);
      if (tokenized && tokenized.input_ids) {
        const ids = Array.from(tokenized.input_ids.data) as number[];
        tokens = ids.map((id) => {
          try {
            return tokenizer.decode([id]);
          } catch {
            return `[${id}]`;
          }
        });
      }
    }

    // Run without pooling to extract per-token hidden states
    const output = await extractor(trimmed, { pooling: 'none' });
    // Dims are [batch_size (1), sequence_length, hidden_size (384)]
    const dims = output.dims;
    const seqLen = dims[1];
    const hiddenSize = dims[2];

    const tokenEmbeddings: Float32Array[] = [];
    for (let i = 0; i < seqLen; i++) {
      const start = i * hiddenSize;
      const end = start + hiddenSize;
      const rawSlice = output.data.slice(start, end) as Float32Array;
      const slice = new Float32Array(hiddenSize);
      for (let j = 0; j < hiddenSize; j++) {
        slice[j] = rawSlice[j];
      }
      tokenEmbeddings.push(slice);
    }

    if (tokens.length === 0) {
      tokens = tokenEmbeddings.map((_, idx) => `Token_${idx}`);
    }

    return {
      tokens,
      tokenEmbeddings,
    };
  }
}

export const embeddingService = new EmbeddingService();
