import { createClient } from "npm:@supabase/supabase-js@2";

const guestUserId = "00000000-0000-0000-0000-000000000001";
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
          user_id: guestUserId,
          title: task.title?.trim(),
          category: task.category?.trim(),
          location: task.location?.trim(),
          min_budget: task.minBudget,
          max_budget: task.maxBudget,
          schedule: task.schedule,
          note: task.note?.trim(),
        })
        .select("*, provider:providers(*)")
        .single();

      if (error) throw error;
      return json(request, { success: true, data }, 201);
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, provider:providers(*)")
        .eq("user_id", guestUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json(request, { success: true, data });
    }

    return json(request, { success: false, message: "Action tidak dikenal." }, 400);
  } catch (error) {
    console.error(error);
    return json(request, { success: false, message: "Operasi task gagal." }, 500);
  }
});
