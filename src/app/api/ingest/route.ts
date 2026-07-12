/**
 * POST /api/ingest — Data ingestion endpoint
 *
 * Reads text files from the coaching-content directory,
 * splits them into chunks, generates embeddings, and stores
 * them in Upstash Vector for RAG retrieval.
 *
 * Protected by INGEST_API_SECRET — for admin use only.
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { generateEmbedding } from "@/lib/gemini";
import { upsertChunks, splitIntoChunks, type ChunkMetadata } from "@/lib/vector-store";

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const body = await request.json();
    const { secret } = body;

    if (secret !== process.env.INGEST_API_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized — invalid secret" },
        { status: 401 }
      );
    }

    // Read all .txt files from coaching-content directory
    const contentDir = path.join(
      process.cwd(),
      "src",
      "data",
      "coaching-content"
    );

    let files: string[];
    try {
      files = await fs.readdir(contentDir);
    } catch {
      return NextResponse.json(
        { error: `Content directory not found: ${contentDir}` },
        { status: 404 }
      );
    }

    const txtFiles = files.filter((f) => f.endsWith(".txt"));

    if (txtFiles.length === 0) {
      return NextResponse.json(
        { error: "No .txt files found in coaching-content directory" },
        { status: 404 }
      );
    }

    console.log(`[Ingest] Found ${txtFiles.length} text files to process`);

    // Process each file
    const allChunks: {
      id: string;
      vector: number[];
      metadata: ChunkMetadata;
    }[] = [];

    for (const fileName of txtFiles) {
      const filePath = path.join(contentDir, fileName);
      const content = await fs.readFile(filePath, "utf-8");
      const sourceName = fileName.replace(".txt", "");

      console.log(
        `[Ingest] Processing ${fileName} (${content.length} characters)`
      );

      // Split into chunks
      const textChunks = splitIntoChunks(content, 500, 100);
      console.log(`[Ingest] Split into ${textChunks.length} chunks`);

      // Generate embeddings and prepare for upsert
      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i];

        try {
          const embedding = await generateEmbedding(chunkText);

          allChunks.push({
            id: `${sourceName}-chunk-${i}`,
            vector: embedding,
            metadata: {
              text: chunkText,
              source: sourceName,
              chunkIndex: i,
            },
          });

          console.log(
            `[Ingest] Embedded chunk ${i + 1}/${textChunks.length} from ${fileName}`
          );

          // Rate limit protection: small delay between embedding calls
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          console.error(
            `[Ingest] Failed to embed chunk ${i} from ${fileName}:`,
            err
          );
        }
      }
    }

    if (allChunks.length === 0) {
      return NextResponse.json(
        { error: "No chunks were successfully embedded" },
        { status: 500 }
      );
    }

    // Upsert all chunks to vector store
    console.log(
      `[Ingest] Upserting ${allChunks.length} chunks to vector store`
    );
    await upsertChunks(allChunks);

    return NextResponse.json({
      success: true,
      filesProcessed: txtFiles.length,
      chunksCreated: allChunks.length,
      files: txtFiles,
    });
  } catch (error) {
    console.error("[Ingest] Error:", error);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
