import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "http://localhost:3000,https://tasktify.id,https://www.tasktify.id")
  .split(",")
  .map((origin) => origin.trim());

type TaskInput = {
  title?: string;
  category?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  schedule?: string;
  note?: string;
  providerId?: string;
};

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

function validTask(task: TaskInput) {
  return (
    typeof task.title === "string" &&
    task.title.trim().length >= 3 &&
    typeof task.category === "string" &&
    task.category.trim().length > 0 &&
    typeof task.location === "string" &&
    task.location.trim().length > 0 &&
    Number.isFinite(task.minBudget) &&
    Number.isFinite(task.maxBudget) &&
    Number(task.minBudget) >= 0 &&
    Number(task.maxBudget) >= Number(task.minBudget) &&
    typeof task.schedule === "string" &&
    !Number.isNaN(Date.parse(task.schedule)) &&
    typeof task.note === "string" &&
    task.note.trim().length >= 5
  );
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
  if (!supabaseUrl || !serviceRoleKey) {
    return json(request, { success: false, message: "Supabase belum dikonfigurasi." }, 500);
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
      const task = payload.task as TaskInput;
      if (!task || !validTask(task)) {
        return json(request, { success: false, message: "Data task tidak valid." }, 400);
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: task.title?.trim(),
          category: task.category?.trim(),
          location: task.location?.trim(),
          min_budget: task.minBudget,
          max_budget: task.maxBudget,
          schedule: task.schedule,
          note: task.note?.trim(),
          provider_id: task.providerId || null,
          status: "waiting",
        })
        .select("*, provider:providers(*)")
        .single();

      if (error) throw error;
      if (task.providerId) {
        const { error: conversationError } = await supabase
          .from("conversations")
          .upsert(
            {
              user_id: userId,
              provider_id: task.providerId,
              last_message: `Task ${data.id} dibuat.`,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,provider_id" },
          );
        if (conversationError) throw conversationError;
        const { data: selectedProvider } = await supabase
          .from("providers")
          .select("user_id")
          .eq("id", task.providerId)
          .single();
        if (selectedProvider?.user_id) {
          await supabase.from("notifications").insert({
            user_id: selectedProvider.user_id,
            title: "Permintaan task baru",
            body: `${data.title} menunggu respons Anda.`,
            href: `/tasks/${data.id}`,
          });
        }
      }
      return json(request, { success: true, data }, 201);
    }

    if (action === "list") {
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      let query = supabase
        .from("tasks")
        .select("*, provider:providers(*)")
        .order("created_at", { ascending: false });
      query = provider
        ? query.or(`user_id.eq.${userId},provider_id.eq.${provider.id}`)
        : query.eq("user_id", userId);
      const { data, error } = await query;

      if (error) throw error;
      return json(request, { success: true, data: (data ?? []).map((item) => ({
        ...item,
        perspective: item.user_id === userId ? "client" : "provider",
      })) });
    }

    if (action === "transition") {
      const taskId = String(payload.taskId ?? "");
      const transition = String(payload.transition ?? "");
      const transitions: Record<string, { from: string; to: string }> = {
        accept: { from: "waiting", to: "scheduled" },
        reject: { from: "waiting", to: "rejected" },
        start: { from: "scheduled", to: "ongoing" },
        complete: { from: "ongoing", to: "history" },
      };
      const next = transitions[transition];
      if (!next) return json(request, { success: false, message: "Transisi tidak valid." }, 400);

      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!provider) return json(request, { success: false, message: "Akun provider diperlukan." }, 403);

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: next.to })
        .eq("id", taskId)
        .eq("provider_id", provider.id)
        .eq("status", next.from)
        .select("*, provider:providers(*)")
        .single();
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: data.user_id,
        title: `Task ${data.id} diperbarui`,
        body: `Status task berubah menjadi ${next.to}.`,
        href: `/tasks/${data.id}`,
      });
      return json(request, { success: true, data });
    }

    if (action === "open") {
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!provider) {
        return json(request, { success: false, message: "Lengkapi profil penyedia terlebih dahulu." }, 403);
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "waiting")
        .is("provider_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(request, { success: true, data });
    }

    if (action === "claim") {
      const taskId = String(payload.taskId ?? "");
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!provider) {
        return json(request, { success: false, message: "Lengkapi profil penyedia terlebih dahulu." }, 403);
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({ provider_id: provider.id, status: "scheduled" })
        .eq("id", taskId)
        .is("provider_id", null)
        .eq("status", "waiting")
        .select("*, provider:providers(*)")
        .single();
      if (error) {
        if (error.code === "PGRST116") {
          return json(request, { success: false, message: "Task sudah diambil penyedia lain." }, 409);
        }
        throw error;
      }

      await supabase.from("conversations").upsert(
        {
          user_id: data.user_id,
          provider_id: provider.id,
          last_message: `Task ${data.id} diambil oleh penyedia.`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider_id" },
      );

      await supabase.from("notifications").insert({
        user_id: data.user_id,
        title: "Task Anda diambil penyedia",
        body: `${data.title} telah diambil dan dijadwalkan oleh penyedia.`,
        href: `/tasks/${data.id}`,
      });

      return json(request, { success: true, data });
    }

    if (action === "cancel") {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "cancelled" })
        .eq("id", String(payload.taskId ?? ""))
        .eq("user_id", userId)
        .in("status", ["waiting", "scheduled"])
        .select("*, provider:providers(*)")
        .single();
      if (error) throw error;
      if (data.provider_id) {
        const { data: assignedProvider } = await supabase
          .from("providers")
          .select("user_id")
          .eq("id", data.provider_id)
          .single();
        if (assignedProvider?.user_id) {
          await supabase.from("notifications").insert({
            user_id: assignedProvider.user_id,
            title: `Task ${data.id} dibatalkan`,
            body: `${data.title} telah dibatalkan oleh client.`,
            href: `/tasks/${data.id}`,
          });
        }
      }
      return json(request, { success: true, data });
    }

    return json(request, { success: false, message: "Action tidak dikenal." }, 400);
  } catch (error) {
    console.error(error);
    return json(request, { success: false, message: "Operasi task gagal." }, 500);
  }
});
