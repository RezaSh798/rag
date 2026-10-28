import { runRagPipeline, ingestDocument } from "./src/rag";
import { QdrantDb } from "./src/database/qdrant.db";

const sampleDocument = `
Rivi is a software developer proficient in JavaScript, TypeScript, and Node.js who manages his own company.
He has recently become interested in learning the Bun runtime and implementing a custom RAG engine with it.
His current project is being implemented using OmniRoute and Gemini models.
`;

const query = "What does Rivi intend to implement with Bun?";

const db = new QdrantDb();

// فقط در صورتی که با فلگ --ingest اجرا شود یا بخواهید دیتا را برای اولین بار یا پس از تغییر ذخیره کنید
if (process.argv.includes("--ingest")) {
  console.log("📥 Ingesting document into vector store...");
  await ingestDocument(db, {
    content: sampleDocument,
    source: "sampleDocument",
  });
  console.log("✅ Document ingested successfully.\n");
}

console.log("🚀 Starting RAG query execution...\n");
const answer = await runRagPipeline(query, db);

console.log("\n✨ Final model response:");
console.log("----------------------------------------");
console.log(answer);
console.log("----------------------------------------");