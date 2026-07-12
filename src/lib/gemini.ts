/**
 * Gemini API Wrapper — Chat generation + Embeddings
 *
 * Uses @google/genai SDK for:
 * - Gemini 2.5 Flash: Generating context-aware chat responses
 * - Gemini Embedding: Creating 768-dimensional embeddings for RAG
 */

import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/**
 * The strict system prompt for the coaching assistant.
 * Prevents hallucination, off-topic responses, and prompt injection.
 */
const SYSTEM_PROMPT = `You are a helpful, professional assistant for [Center Name] Academy, a premier coaching institute for JEE, NEET, and MHT-CET preparation located in Mumbai.

STRICT RULES:
1. Use ONLY the provided context to answer the student's question.
2. If the answer is not in the context, politely tell them: "I don't have that specific information. Please call our front desk at +91 98765 43210 or visit our center for more details."
3. Do NOT invent, guess, or fabricate any information.
4. Under no circumstances should you write code, tell jokes, create stories, or answer questions unrelated to the coaching center, NEET, JEE, or CET preparation.
5. Keep responses concise, friendly, and professional.
6. Format your responses using markdown for better readability (use **bold**, bullet points, etc.).
7. If a student asks about past papers or downloads, guide them to use the "Download Past Papers" quick action button.
8. If asked who you are, say: "I'm the AI assistant for [Center Name] Academy. I can help you with information about our courses, batches, fees, faculty, and more!"

CONTEXT:
{context}`;

/**
 * Generate a chat response using Gemini 2.5 Flash
 */
export async function generateChatResponse(
  userMessage: string,
  context: string
): Promise<string> {
  const client = getClient();

  const systemInstruction = SYSTEM_PROMPT.replace("{context}", context);

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction,
      temperature: 0.3, // Low temperature for factual, consistent responses
      maxOutputTokens: 500, // Keep responses concise to save tokens
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}

/**
 * Generate an embedding vector for a given text.
 * Uses gemini-embedding-2 with outputDimensionality=768 to stay within
 * Upstash Vector free tier limits (max 1536 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();

  const response = await client.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error("No embeddings returned from Gemini");
  }

  const values = response.embeddings[0].values;
  if (!values) {
    throw new Error("Empty embedding values from Gemini");
  }

  return values;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  // Process sequentially to avoid rate limits on free tier
  const embeddings: number[][] = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return embeddings;
}
