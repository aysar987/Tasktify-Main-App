import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha512Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const STATUS_MAP: Record<string, string> = {
  capture: "capture",
  settlement: "settlement",
  pending: "pending",
  deny: "deny",
  cancel: "cancel",
  expire: "expire",
  failure: "failure",
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ success: false, message: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  if (!supabaseUrl || !serviceRoleKey || !midtransServerKey) {
    return json({ success: false, message: "Supabase/Midtrans belum dikonfigurasi." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const notification = await request.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, payment_type } =
      notification;

    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      return json({ success: false, message: "Payload notifikasi tidak lengkap." }, 400);
    }

    const expectedSignature = await sha512Hex(`${order_id}${status_code}${gross_amount}${midtransServerKey}`);
    if (expectedSignature !== signature_key) {
      return json({ success: false, message: "Signature tidak valid." }, 401);
    }

    let status = STATUS_MAP[transaction_status] ?? "failure";
    if (transaction_status === "capture" && fraud_status === "challenge") {
      status = "pending";
    }

    const paid = status === "settlement" || status === "capture";

    const { data, error } = await supabase
      .from("payments")
      .update({
        status,
        payment_type: payment_type ?? null,
        paid_at: paid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order_id)
      .select("id, task_id, user_id, status")
      .maybeSingle();
    if (error) throw error;

    if (data && paid) {
      await supabase.from("notifications").insert({
        user_id: data.user_id,
        title: "Pembayaran berhasil",
        body: "Pembayaran task Anda telah diterima.",
        href: `/tasks/${data.task_id}`,
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ success: false, message: "Gagal memproses notifikasi." }, 500);
  }
});
