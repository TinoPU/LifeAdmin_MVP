// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { Worker } from "https://esm.sh/bullmq@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Redis from "https://esm.sh/ioredis@5";
import { generateEmbedding } from "../embeddingService/index.ts"; // Import the embedding service

// Load environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const REDIS_URL = Deno.env.get("REDIS_URL")!;

// Connect to Supabase and Redis
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const redis = new Redis(REDIS_URL);

// Background worker function
async function processEmbeddingJobs() {
  console.log("🚀 Processing embedding jobs...");

  const embeddingsWorker = new Worker(
      "generate_embeddings", // Reference the existing queue name
      async (job:any) => {
        const { message_id, messageText } = job.data;
        try {
          // Generate embedding using OpenAI API or another embedding provider
          const embedding = await generateEmbedding(messageText);

          // Store in Supabase
          await supabase.from("message_embeddings").insert({
            message_id: message_id,
            embedding: embedding,
          });

          // Mark job as completed
          await job.moveToCompleted();
          console.log(`✅ Processed embedding for message ${message_id}`);
        } catch (error) {
          console.error(`❌ Embedding failed for ${message_id}:`, error);
          await job.moveToFailed({ message: error.message });
        }
      },
      {
        connection: redis,  // Connect to the same Redis instance
      }
  );
  embeddingsWorker()
  return new Response(JSON.stringify({ message: "Queue processed" }), { status: 200 });
}

// Serve function on Supabase Edge
serve(async (_req:any) => {
  return processEmbeddingJobs();
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/processQueue' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
