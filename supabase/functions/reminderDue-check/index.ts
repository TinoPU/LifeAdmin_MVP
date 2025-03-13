// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
//
// console.log("Hello from Functions!")
//
// Deno.serve(async (req) => {
//   const { name } = await req.json()
//   const data = {
//     message: `Hello ${name}!`,
//   }
//
//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
)

serve(async () => {
  // 1. Fetch reminders that are due
  const {data: dueReminders, error} = await supabaseClient
      .from('reminders')
      .select('*')
      .eq('status', 'scheduled')
      .lte('reminder_time', new Date().toISOString())

  if (error) {
    console.error('Error fetching due reminders:', error)
    return new Response('Error fetching reminders', {status: 500})
  }

  // 2. Notify your server and update each reminder
  for (const reminder of dueReminders || []) {
    // Notify your server
    await fetch('https://life-admin-mvp.vercel.app/api/webhooks/supabase', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        notification: "due_notification",
        payload_type: "reminder",
        payload: reminder, // No need to stringify again
      }),
    })

    // Update status so it won't be sent again
    await supabaseClient
        .from('reminders')
        .update({status: 'sent'})
        .eq('id', reminder.id)
  }

  serve(async () => {
    // 1. Fetch reminders that are due
    const {data: dueTasks, error} = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .lte('due_time', new Date().toISOString())

    if (error) {
      console.error('Error fetching due tasks:', error)
      return new Response('Error fetching tasks', {status: 500})
    }

    // 2. Notify your server and update each reminder
    for (const task of dueTasks || []) {
      // Notify your server
      await fetch('https://life-admin-mvp.vercel.app/api/webhooks/supabase', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          notification: "due_notification",
          payload_type: "task",
          payload: task, // No need to stringify again
        }),
      })

      // Update status so it won't be sent again
      await supabaseClient
          .from('tasks')
          .update({status: 'completed'})
          .eq('id', task.id)
    }

    return new Response('OK', {status: 200})
  })
})






/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/reminderDue-check' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
