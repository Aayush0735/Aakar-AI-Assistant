/**
 * Vector Store — Upstash Vector wrapper for RAG
 *
 * Handles similarity search and data upsert operations.
 * Falls back to a simple keyword-based search if Upstash is not configured.
 */

import { Index } from "@upstash/vector";

// Type for stored metadata
export interface ChunkMetadata {
  text: string;
  source: string;
  chunkIndex: number;
  [key: string]: string | number;
}

let _index: Index | null = null;

function getIndex(): Index {
  if (!_index) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set"
      );
    }

    _index = new Index({ url, token });
  }
  return _index;
}

/**
 * Check if Upstash Vector is configured
 */
export function isVectorConfigured(): boolean {
  return !!(
    process.env.UPSTASH_VECTOR_REST_URL &&
    process.env.UPSTASH_VECTOR_REST_TOKEN
  );
}

/**
 * Search for the most similar chunks to a query embedding
 *
 * @param embedding - The query embedding vector (768 dimensions)
 * @param topK - Number of results to return (default: 3)
 * @returns Array of matching chunks with their text and similarity score
 */
export async function searchSimilar(
  embedding: number[],
  topK: number = 3
): Promise<{ text: string; score: number; source: string }[]> {
  const index = getIndex();

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return results
    .filter((r) => r.metadata)
    .map((r) => {
      const meta = r.metadata as unknown as ChunkMetadata;
      return {
        text: meta.text || "",
        score: r.score,
        source: meta.source || "unknown",
      };
    });
}

/**
 * Upsert document chunks into the vector store
 *
 * @param chunks - Array of { id, vector, metadata } objects
 */
export async function upsertChunks(
  chunks: {
    id: string;
    vector: number[];
    metadata: ChunkMetadata;
  }[]
): Promise<void> {
  const index = getIndex();

  // Upstash Vector supports batch upserts of up to 1000 vectors
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize).map((c) => ({
      id: c.id,
      vector: c.vector,
      metadata: {
        text: c.metadata.text,
        source: c.metadata.source,
        chunkIndex: String(c.metadata.chunkIndex),
      },
    }));
    await index.upsert(batch);
    console.log(
      `[Vector Store] Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`
    );
  }
}

/**
 * Split text into chunks with overlap for better retrieval
 *
 * @param text - The full text to split
 * @param chunkSize - Target size of each chunk in characters (default: 500)
 * @param overlap - Number of characters to overlap between chunks (default: 100)
 * @returns Array of text chunks
 */
export function splitIntoChunks(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from the end of the previous chunk
      const words = currentChunk.split(" ");
      const overlapWords = [];
      let overlapLen = 0;
      for (let i = words.length - 1; i >= 0 && overlapLen < overlap; i--) {
        overlapWords.unshift(words[i]);
        overlapLen += words[i].length + 1;
      }
      currentChunk = overlapWords.join(" ") + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
