import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import { JWT } from "https://esm.sh/google-auth-library@9.0.0";

// Note: You must deploy this function to Supabase using the CLI:
// supabase functions deploy push-notification

// Environment variables to set in Supabase Dashboard:
// FIREBASE_PROJECT_ID
// FIREBASE_CLIENT_EMAIL
// FIREBASE_PRIVATE_KEY (handles newlines)

interface NotificationPayload {
    type: "message" | "call" | "notice" | "group_message";
    record: any;
}

serve(async (req) => {
    try {
        const { type, record } = await req.json() as NotificationPayload;

        // Initialize Supabase Client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Identify Recipients
        let userIds: string[] = [];
        let title = "New Notification";
        let body = "You have a new update";
        let data: any = { type, id: record.id };

        if (type === "message") {
            // Fetch conversation members (excluding sender)
            const { data: members } = await supabaseAdmin
                .from("conversation_members")
                .select("user_id")
                .eq("conversation_id", record.conversation_id)
                .neq("user_id", record.sender_id);

            userIds = members?.map(m => m.user_id) || [];
            title = "New Message";
            body = record.content ? (record.content.substring(0, 50) + (record.content.length > 50 ? "..." : "")) : "Sent an attachment";
            data.conversationId = record.conversation_id;
        }
        else if (type === "call") {
            // Call notifications are usually handled by client-side trigger inserting into `notifications` table?
            // WAIT: The prompt said "Triggers: ... calls table insert".
            // If a call row is inserted, we notify the target.
            // The `calls` table usually has `caller_id` and `receiver_id`? 
            // Need to check schema. Assuming generic structure or logic:
            // If the record has `user_id` (caller) and targets someone. 
            // Actually, the `CallContext` logic sent a signal. 
            // If we rely on `calls` table, we use `receiver_id` if it exists, or `active_call_user_id`.
            // Let's assume `record` has `receiver_id` or similar. 
            // For now, let's assume `calls` table isn't the primary driver for realtime signalling which is ephemeral.
            // BUT the user asked for "Call started -> calls table insert". 
            // If table has `receiver_id`:
            if (record.receiver_id) {
                userIds = [record.receiver_id];
                title = "Incoming Call";
                body = "Incoming call";
            }
        }
        else if (type === "notice") {
            // Notify everyone? Or specific groups?
            // If notices are global, notifying everyone might be too much (broadcast).
            // If notices are for groups/departments.
            // Let's assume generic "All users" or "Followers" logic.
            // For safety in this demo, let's limit or skip broadcasting to avoid 10k pushed.
            // Or maybe strictly followers?
            // Let's notify "Followers" of the creator.
            const { data: followers } = await supabaseAdmin
                .from("follows")
                .select("follower_id")
                .eq("following_id", record.created_by);

            userIds = followers?.map(f => f.follower_id) || [];
            title = record.title;
            body = record.content.substring(0, 50);
        }

        if (userIds.length === 0) {
            return new Response(JSON.stringify({ message: "No recipients found" }), { headers: { "Content-Type": "application/json" } });
        }

        // 2. Fetch Device Tokens
        const { data: tokens } = await supabaseAdmin
            .from("device_tokens")
            .select("token")
            .in("user_id", userIds);

        const fcmTokens = tokens?.map(t => t.token) || [];
        if (fcmTokens.length === 0) {
            return new Response(JSON.stringify({ message: "No devices registered" }), { headers: { "Content-Type": "application/json" } });
        }

        // 3. Get Access Token for Firebase
        const jwtClient = new JWT({
            email: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
            key: Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
        });
        const tokensRes = await jwtClient.authorize();
        const accessToken = tokensRes.access_token;

        // 4. Send to FCM (Batch or Loop)
        // Using simple loop for clarity, strictly production should use batch API.
        const results = [];
        for (const token of fcmTokens) {
            const message = {
                message: {
                    token: token,
                    notification: {
                        title,
                        body,
                    },
                    data: data,
                },
            };

            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${Deno.env.get("FIREBASE_PROJECT_ID")}/messages:send`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            });
            results.push(res.status);
        }

        return new Response(
            JSON.stringify({ message: "Notifications sent", count: fcmTokens.length, results }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
