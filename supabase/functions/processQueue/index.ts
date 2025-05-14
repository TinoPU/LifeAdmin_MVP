import { connect } from "https://deno.land/x/redis@v0.29.4/mod.ts";
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { generateEmbedding } from "../embeddingService/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Connect to Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// Connect to Redis using deno-redis
const redis = await connect({
    hostname: Deno.env.get("REDIS_HOST"),
    port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
    password: Deno.env.get("REDIS_PW") || undefined
});
// utility: sleep for ms
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
// Example: Process one task from a Redis list (your queue)
async function processEmbeddingTask() {
    // Try to pop one task (non‐blocking)
    const payload = await redis.lpop("embedding_tasks");
    if (!payload) {
        return;
    }
    console.log("popped payload:", payload);
    const { message_id, messageText } = JSON.parse(payload);
    try {
        const embedding = await generateEmbedding(messageText);
        const { data, error } = await supabase.from("message_embeddings").insert({
            message_id: message_id,
            embedding: embedding
        });
        console.log(`✅ Processed embedding for message ${message_id}`);
        if (error) {
            console.log(error);
        }
    } catch (error) {
        console.error(`❌ Embedding failed for ${message_id}:`, error);
    }
}
// Define the edge function handler to process tasks for a short window
serve(async (_req)=>{
    // For example, process tasks for 10 seconds
    const endTime = Date.now() + 10 * 1000;
    while(Date.now() < endTime){
        await processEmbeddingTask();
        await sleep(200);
    }
    return new Response(JSON.stringify({
        message: "Queue processed"
    }), {
        status: 200
    });
});
