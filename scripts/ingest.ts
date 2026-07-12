/**
 * CLI Ingestion Script
 *
 * Run this script to ingest coaching center content into the vector database.
 * Usage: npx tsx scripts/ingest.ts
 *
 * Requires: GEMINI_API_KEY, UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN
 * to be set in .env.local
 */

import { config } from "dotenv";
import { promises as fs } from "fs";
import path from "path";

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), ".env.local") });

// Dynamic imports after env is loaded
async function main() {
  const { generateEmbedding } = await import("../src/lib/gemini");
  const { upsertChunks, splitIntoChunks } = await import(
    "../src/lib/vector-store"
  );

  const contentDir = path.join(process.cwd(), "src", "data", "coaching-content");

  console.log("🚀 Starting data ingestion...");
  console.log(`📂 Reading files from: ${contentDir}`);

  // Read all text files
  const files = await fs.readdir(contentDir);
  const txtFiles = files.filter((f) => f.endsWith(".txt"));

  if (txtFiles.length === 0) {
    console.error("❌ No .txt files found in coaching-content directory");
    process.exit(1);
  }

  console.log(`📄 Found ${txtFiles.length} files: ${txtFiles.join(", ")}`);

  const allChunks: {
    id: string;
    vector: number[];
    metadata: { text: string; source: string; chunkIndex: number };
  }[] = [];

  for (const fileName of txtFiles) {
    const filePath = path.join(contentDir, fileName);
    const content = await fs.readFile(filePath, "utf-8");
    const sourceName = fileName.replace(".txt", "");

    console.log(
      `\n📖 Processing: ${fileName} (${content.length} characters)`
    );

    const textChunks = splitIntoChunks(content, 500, 100);
    console.log(`   ✂️  Split into ${textChunks.length} chunks`);

    for (let i = 0; i < textChunks.length; i++) {
      try {
        const embedding = await generateEmbedding(textChunks[i]);

        allChunks.push({
          id: `${sourceName}-chunk-${i}`,
          vector: embedding,
          metadata: {
            text: textChunks[i],
            source: sourceName,
            chunkIndex: i,
          },
        });

        process.stdout.write(
          `   🧬 Embedded chunk ${i + 1}/${textChunks.length}\r`
        );

        // Delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`\n   ❌ Failed chunk ${i}: ${err}`);
      }
    }
    console.log(); // New line after progress
  }

  if (allChunks.length === 0) {
    console.error("❌ No chunks were successfully embedded");
    process.exit(1);
  }

  console.log(`\n📤 Upserting ${allChunks.length} chunks to vector store...`);
  await upsertChunks(allChunks);

  console.log("\n✅ Ingestion complete!");
  console.log(`   📊 Files processed: ${txtFiles.length}`);
  console.log(`   📊 Chunks created: ${allChunks.length}`);
}

main().catch((err) => {
  console.error("❌ Ingestion failed:", err);
  process.exit(1);
});
