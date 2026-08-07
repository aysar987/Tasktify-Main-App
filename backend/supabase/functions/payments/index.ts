import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "http://localhost:3000,https://tasktify.id,https://www.tasktify.id")
  .split(",")
  .map((origin) => origin.trim());

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json(request, { success: false, message: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  const isProduction = (Deno.env.get("MIDTRANS_IS_PRODUCTION") ?? "false") === "true";
  if (!supabaseUrl || !serviceRoleKey) {
    return json(request, { success: false, message: "Supabase belum dikonfigurasi." }, 500);
  }
  if (!midtransServerKey) {
    return json(request, { success: false, message: "Midtrans belum dikonfigurasi." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return json(request, { success: false, message: "Silakan masuk terlebih dahulu." }, 401);
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return json(request, { success: false, message: "Sesi tidak valid." }, 401);
    }
    const userId = authData.user.id;
    const payload = await request.json();
    const action = payload.action ?? "create";

    if (action === "create") {
      const taskId = String(payload.taskId ?? "");

      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("id, title, budget, user_id, status")
        .eq("id", taskId)
        .eq("user_id", userId)
        .maybeSingle();
      if (taskError) throw taskError;
      if (!task) {
        return json(request, { success: false, message: "Task tidak ditemukan." }, 404);
      }
      if (task.status === "cancelled" || task.status === "rejected") {
        return json(request, { success: false, message: "Task ini sudah tidak aktif." }, 400);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, email")
        .eq("id", userId)
        .single();

      const orderId = `${task.id}-${Date.now()}`;
      const snapBaseUrl = isProduction
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

      const snapResponse = await fetch(snapBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${btoa(`${midtransServerKey}:`)}`,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: task.budget,
          },
          customer_details: {
            first_name: profile?.full_name || profile?.username || "Client Tasktify",
            email: profile?.email || undefined,
          },
          item_details: [
            {
              id: task.id,
              price: task.budget,
              quantity: 1,
              name: task.title.slice(0, 50),
            },
          ],
        }),
      });

      const snapData = await snapResponse.json();
      if (!snapResponse.ok) {
        console.error("Midtrans error", snapData);
        return json(
          request,
          { success: false, message: snapData?.error_messages?.[0] ?? "Gagal membuat transaksi pembayaran." },
          502,
        );
      }

      const { data: payment, error: insertError } = await supabase
        .from("payments")
        .insert({
          task_id: task.id,
          user_id: userId,
          order_id: orderId,
          amount: task.budget,
          status: "pending",
          snap_token: snapData.token,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;

      return json(request, {
        success: true,
        data: { ...payment, redirect_url: snapData.redirect_url },
      });
    }

    return json(request, { success: false, message: "Action tidak dikenal." }, 400);
  } catch (error) {
    console.error(error);
    return json(request, { success: false, message: "Operasi pembayaran gagal." }, 500);
  }
});
