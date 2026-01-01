// import { pineconeIndex } from "@/lib/pinecone";
// import { embed } from "ai"
// import {google} from "@ai-sdk/google"

// export async function generateEmbeddings(text: string){
//     const {embedding}= await embed({
//         model: google.textEmbeddingModel("text-embedding-004"),
//         value: text
//     })
//     return embedding;
// }
//     export async function indexCodebase(repoId: string, files: { path: string; content: string }[]) {
//     const vectors = [];

//     for (const file of files) {
//         const content = `File: ${file.path}\n\n${file.content}`;

//         const truncatedContent = content.slice(0, 8000);

//         try {
//             const embedding = await generateEmbeddings(truncatedContent);

//             vectors.push({
//                 id: `${repoId}-${file.path.replace(/\//g, '_')}`,
//                 values: embedding,
//                 metadata: {
//                     repoId,
//                     path: file.path,
//                     content: truncatedContent
//                 }
//             });
//         } catch (error) {
//             console.error(`Error generating embedding for file ${file.path}:`, error);
//         }
//     }
//     if (vectors.length > 0) {
//         const batchSize= 100;
//         for(let i=0; i< vectors.length; i+= batchSize){
//             const chunk= vectors.slice(i, i+ batchSize);
//             await pineconeIndex.upsert(chunk);
//         }
//     }
//     console.log(`Indexed ${vectors.length} files for repo ${repoId}`);
// }

// export async function retrieveContext(query: string, repoId: string, topK: number = 5) {
//     const embedding = await generateEmbeddings(query);

//     const results = await pineconeIndex.query({
//         vector: embedding,
//         filter: { repoId },
//         topK,
//         includeMetadata: true
//     });

//     return results.matches.map(match => match.metadata?.content as string).filter(Boolean);
// }

import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

/**
 * Generate embeddings safely
 * Google text-embedding-004 → 768 dims
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  if (!text || !text.trim()) return [];

  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: text.slice(0, 3000), // ✅ FIX: safe limit
    });

    return embedding;
  } catch (err: any) {
    const msg = err?.message || "";

    // 🚫 DO NOT RETRY QUOTA ERRORS
    if (
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("429")
    ) {
      console.error("🚫 Google quota exceeded. Skipping embedding.");
      return [];
    }

    throw err;
  }
}

/**
 * Index repository files into Pinecone
 */
export async function indexCodebase(
  repoId: string,
  files: { path: string; content: string }[]
) {
  const vectors: {
    id: string;
    values: number[];
    metadata: {
      repoId: string;
      path: string;
      content: string;
    };
  }[] = [];

  // ✅ FIX: prevent re-indexing same repo
  const existing = await pineconeIndex.query({
    vector: new Array(768).fill(0),
    topK: 1,
    filter: { repoId },
  });

  if (existing.matches?.length) {
    console.log("✅ Repo already indexed, skipping embeddings");
    return;
  }

  for (const file of files) {
    const content = `File: ${file.path}\n\n${file.content}`;
    const truncatedContent = content.slice(0, 3000); // ✅ FIX

    const embedding = await generateEmbeddings(truncatedContent);

    // 🚫 skip if embedding failed
    if (!embedding.length) continue;

    vectors.push({
      id: `${repoId}-${file.path.replace(/[^\w]/g, "_")}`,
      values: embedding,
      metadata: {
        repoId,
        path: file.path,
        content: truncatedContent,
      },
    });

    // 🧯 throttle to avoid rate limits
    await new Promise((r) => setTimeout(r, 1200));
  }

  if (!vectors.length) {
    console.warn("⚠️ No vectors generated, skipping Pinecone upsert");
    return;
  }

  // ✅ batch upserts
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await pineconeIndex.upsert(vectors.slice(i, i + batchSize));
  }

  console.log(`✅ Indexed ${vectors.length} files for repo ${repoId}`);
}

/**
 * Retrieve relevant context
 */
export async function retrieveContext(
  query: string,
  repoId: string,
  topK = 5
): Promise<string[]> {
  const embedding = await generateEmbeddings(query);

  // 🚫 no embedding → no query
  if (!embedding.length) return [];

  const results = await pineconeIndex.query({
    vector: embedding,
    filter: { repoId },
    topK,
    includeMetadata: true,
  });

  return (
    results.matches
      ?.map((m) => m.metadata?.content as string)
      .filter(Boolean) ?? []
  );
}
