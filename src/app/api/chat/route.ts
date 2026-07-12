/**
 * POST /api/chat — Main chat endpoint
 *
 * Flow:
 * 1. Extract client IP for rate limiting
 * 2. Check rate limit (20 msgs/IP/24h)
 * 3. Check if query is a paper request → return direct link
 * 4. Embed query → search vector DB → retrieve context
 * 5. Call Gemini 2.5 Flash with strict system prompt + context
 * 6. Return response
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { generateChatResponse, generateEmbedding } from "@/lib/gemini";
import { searchSimilar, isVectorConfigured } from "@/lib/vector-store";
import {
  isPaperRequest,
  searchPapers,
  formatPaperResponse,
} from "@/lib/paper-search";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return "127.0.0.1";
}

/**
 * Advanced keyword matcher to bypass LLM and return local text file data instantly.
 * It scores all files based on word matches from the user's query.
 */
function getLocalMatch(message: string): string | null {
  const msg = message.toLowerCase().replace(/[^\w\s]/g, "");
  // Remove common stop words to focus on important keywords
  const stopWords = new Set(["what", "is", "the", "of", "who", "where", "how", "when", "why", "a", "an", "in", "on", "at", "to", "for", "and", "or", "tell", "me", "about", "give", "details", "know"]);
  const tokens = msg.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));

  if (tokens.length === 0) return null;

  const files = [
    "about.txt",
    "batches.txt",
    "faculty.txt",
    "results.txt",
    "downloads.txt"
  ];

  let bestFile = "";
  let maxScore = 0;
  let bestContent = "";

  try {
    for (const filename of files) {
      const filePath = path.join(process.cwd(), "src/data/coaching-content", filename);
      const content = fs.readFileSync(filePath, "utf8");
      const contentLower = content.toLowerCase().replace(/[^\w\s]/g, "");
      
      let score = 0;
      let uniqueTokensMatched = 0;
      for (const token of tokens) {
        // Count occurrences of the token in the file
        const regex = new RegExp(token, "g");
        const matches = contentLower.match(regex);
        if (matches) {
          score += matches.length;
          uniqueTokensMatched += 1;
        }
      }

      // Heavily weight files that match multiple DIFFERENT words from the query
      score += (uniqueTokensMatched * 20);

      // Add extra weight for exact filename matches (e.g. "faculty", "result")
      if (filename.includes(tokens[0]) || (tokens[1] && filename.includes(tokens[1]))) {
        score += 10; 
      }

      if (score > maxScore) {
        maxScore = score;
        bestFile = filename;
        bestContent = content;
      }
    }

    if (maxScore > 0 && bestContent) {
      // Extract only relevant lines instead of the whole file
      const lines = bestContent.split('\n');
      const matchingLines: string[] = [];
      let currentHeading = "";
      
      // First pass: find the maximum token match score for any single line
      let maxLineScore = 0;
      const lineScores = lines.map(line => {
        const lineLower = line.toLowerCase();
        let s = 0;
        for (const token of tokens) {
          if (lineLower.includes(token)) s++;
        }
        if (s > maxLineScore) maxLineScore = s;
        return s;
      });

      let includeNextLines = false;
      
      // Second pass: extract only the most relevant lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isHeading = line.endsWith(':');
        
        if (isHeading) {
          currentHeading = line;
        }

        const lineScore = lineScores[i];
        const isStrongMatch = lineScore > 0 && lineScore >= (maxLineScore - 1 > 0 ? maxLineScore - 1 : 1);
        
        // If a heading strongly matches, we want to include the data underneath it
        if (isHeading && isStrongMatch) {
          includeNextLines = true;
          if (!matchingLines.includes(currentHeading)) {
            matchingLines.push(currentHeading);
          }
        } 
        // If a regular line strongly matches, OR it belongs to a matched heading
        else if (isStrongMatch || (includeNextLines && line !== "")) {
          if (currentHeading && !matchingLines.includes(currentHeading)) {
            matchingLines.push(currentHeading);
          }
          if (line !== currentHeading && !matchingLines.includes(line)) {
            matchingLines.push(line);
          }
        }

        // Stop including lines if we hit a blank line (end of the section)
        if (line === "") {
          includeNextLines = false;
        }
      }

      if (matchingLines.length > 0) {
        return "Here is the specific information I found:\n\n" + matchingLines.join('\n');
      }
      
      return bestContent; // Fallback to whole file if line extraction fails for some reason
    }
  } catch (e) {
    console.error("[Local Match Error]", e);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message must be under 1000 characters" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Step 1: Rate limiting
    const clientIP = getClientIP(request);
    const { success: rateLimitOk, remaining } =
      await checkRateLimit(clientIP);

    if (!rateLimitOk) {
      return NextResponse.json(
        {
          response: RATE_LIMIT_MESSAGE,
          rateLimited: true,
          remaining: 0,
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Step 2: Check for past paper intent
    if (isPaperRequest(message)) {
      const papers = searchPapers(message);
      const response = formatPaperResponse(papers);
      return NextResponse.json(
        {
          response,
          type: "paper",
          remaining,
        },
        { headers: corsHeaders }
      );
    }

    // Step 3: Check for local keyword matches
    const localMatch = getLocalMatch(message);
    if (localMatch) {
      return NextResponse.json(
        {
          response: localMatch,
          type: "ai",
          remaining,
        },
        { headers: corsHeaders }
      );
    }

    // Step 4: RAG — Retrieve relevant context
    let context =
      "No specific context available. Please answer based on general coaching center information.";

    if (isVectorConfigured()) {
      try {
        const queryEmbedding = await generateEmbedding(message);
        const results = await searchSimilar(queryEmbedding, 3);

        if (results.length > 0) {
          context = results
            .map(
              (r, i) =>
                `[Source: ${r.source}, Relevance: ${(r.score * 100).toFixed(1)}%]\n${r.text}`
            )
            .join("\n\n---\n\n");
        }
      } catch (err) {
        console.error("[Chat API] Vector search failed:", err);
        // Continue with default context — better than failing entirely
      }
    } else {
      console.warn(
        "[Chat API] Upstash Vector not configured — skipping RAG"
      );
    }

    // Step 5: Generate response with Gemini
    const response = await generateChatResponse(message, context);

    return NextResponse.json(
      {
        response,
        type: "ai",
        remaining,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Chat API] Error:", error);

    // Return a friendly error message specifically addressing the quota issue if applicable
    const isQuotaError = error instanceof Error && error.message.toLowerCase().includes("exhausted");
    
    return NextResponse.json(
      {
        response: isQuotaError 
          ? "Our AI service is currently at capacity. However, you can still use the Quick Actions below, or call our front desk at +91 7499571615 for immediate help!"
          : "I'm sorry, I couldn't find an exact match for that in my local data, and the AI service is currently unavailable. Please call our front desk at +91 7499571615 for immediate help.",
        type: "error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
