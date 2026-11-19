import { getEncoding, TiktokenEncoding } from 'js-tiktoken';

export interface TokenInfo {
  id: number;
  text: string;
  bytes: number[];
  hex: string;
  charStart: number;
  charEnd: number;
  colorIndex: number;
}

export interface TokenizerStats {
  tokenCount: number;
  charCount: number;
  byteCount: number;
  charsPerToken: number;
  compressionRatio: number;
}

// Map of common encoding names
export const SUPPORTED_ENCODINGS: { id: TiktokenEncoding; name: string; description: string; modelExample: string }[] = [
  {
    id: 'o200k_base',
    name: 'o200k_base',
    description: 'Latest 200k vocabulary tokenizer for GPT-4o & GPT-4o-mini',
    modelExample: 'GPT-4o, GPT-4o-mini',
  },
  {
    id: 'cl100k_base',
    name: 'cl100k_base',
    description: '100k vocabulary tokenizer used by GPT-4 and GPT-3.5-Turbo',
    modelExample: 'GPT-4, text-embedding-ada-002, GPT-3.5-Turbo',
  },
  {
    id: 'p50k_base',
    name: 'p50k_base',
    description: '50k vocabulary tokenizer for Codex and older text models',
    modelExample: 'text-davinci-002, Codex',
  },
  {
    id: 'r50k_base',
    name: 'r50k_base',
    description: 'Legacy 50k vocabulary tokenizer for GPT-2 and original GPT-3',
    modelExample: 'GPT-2, GPT-3 (Davinci)',
  },
];

// Color palette for token chips with neon accents
export const TOKEN_PALETTE = [
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
  'bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
  'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 hover:bg-fuchsia-500/30',
  'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30',
];

// Cache tokenizer instances
const tokenizerCache = new Map<TiktokenEncoding, ReturnType<typeof getEncoding>>();

export function getTokenizer(encodingName: TiktokenEncoding = 'cl100k_base') {
  if (!tokenizerCache.has(encodingName)) {
    tokenizerCache.set(encodingName, getEncoding(encodingName));
  }
  return tokenizerCache.get(encodingName)!;
}

/**
 * Tokenize a text string into detailed token tokens with IDs, unicode bytes, and spans.
 */
export function tokenizeText(text: string, encodingName: TiktokenEncoding = 'cl100k_base'): TokenInfo[] {
  if (!text) return [];

  const enc = getTokenizer(encodingName);
  const tokenIds = enc.encode(text);
  const tokens: TokenInfo[] = [];

  let currentPos = 0;

  for (let i = 0; i < tokenIds.length; i++) {
    const id = tokenIds[i];
    // Decode single token
    let tokenStr = '';
    let bytes: number[] = [];
    try {
      const decodedBytes = enc.decode([id]);
      tokenStr = decodedBytes;
      const encoder = new TextEncoder();
      bytes = Array.from(encoder.encode(tokenStr));
    } catch {
      tokenStr = `[Token ${id}]`;
    }

    const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const charStart = currentPos;
    const charEnd = currentPos + tokenStr.length;
    currentPos = charEnd;

    tokens.push({
      id,
      text: tokenStr,
      bytes,
      hex: hex ? `0x${hex}` : '0x00',
      charStart,
      charEnd,
      colorIndex: i % TOKEN_PALETTE.length,
    });
  }

  return tokens;
}

/**
 * Compute statistics for tokenization
 */
export function calculateTokenStats(text: string, tokens: TokenInfo[]): TokenizerStats {
  const tokenCount = tokens.length;
  const charCount = text.length;
  const encoder = new TextEncoder();
  const byteCount = encoder.encode(text).length;
  const charsPerToken = tokenCount > 0 ? parseFloat((charCount / tokenCount).toFixed(2)) : 0;
  const compressionRatio = byteCount > 0 ? parseFloat((tokenCount / byteCount).toFixed(2)) : 0;

  return {
    tokenCount,
    charCount,
    byteCount,
    charsPerToken,
    compressionRatio,
  };
}

