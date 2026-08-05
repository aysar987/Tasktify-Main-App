import { getSupabase } from "@/lib/supabase";
import type { Conversation, Message, Notification, Profile, Provider, Task, TaskLocation, TaskStatus } from "@/types";

type ProviderRow = {
  id: string;
  name: string;
  title: string;
  category: string;
  location: string;
  rating: number;
  jobs: number;
  verified: boolean;
  price_from: number;
  initials: string;
  bio?: string;
};

type TaskRow = {
  id: string;
  user_id?: string;
  provider_id?: string | null;
  title: string;
  category: string;
  location: string;
  min_budget: number;
  max_budget: number;
  schedule: string;
  note: string;
  status: TaskStatus;
  provider?: ProviderRow | null;
  perspective?: "client" | "provider";
};

function mapProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    category: row.category,
    location: row.location,
    rating: row.rating,
    jobs: row.jobs,
    verified: row.verified,
    priceFrom: row.price_from,
    initials: row.initials,
    bio: row.bio,
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    budget: row.max_budget,
    date: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(row.schedule)),
    status: row.status,
    provider: row.provider ? mapProvider(row.provider) : undefined,
    note: row.note,
    perspective: row.perspective,
  };
}

async function invokeTasks<T>(body: Record<string, unknown>) {
  const supabase = getSupabase();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Sesi Anda berakhir. Silakan masuk kembali.");
  }

  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    data?: T;
    message?: string;
  }>("tasks", {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const context =
      "context" in error ? (error.context as Response | undefined) : undefined;
    if (context instanceof Response) {
      const response = context.clone();
      let responseMessage = "";
      try {
        const payload = (await response.json()) as { message?: string };
        responseMessage = payload.message ?? "";
      } catch {}
      if (responseMessage) throw new Error(responseMessage);
    }
    throw new Error(
      error.message === "Failed to send a request to the Edge Function"
        ? "Layanan task belum dapat dihubungi. Muat ulang halaman atau coba beberapa saat lagi."
        : error.message,
    );
  }
  if (!data?.success || data.data === undefined) {
    throw new Error(data?.message ?? "Operasi task gagal.");
  }
  return data.data;
}

export async function createTask(payload: {
  title: string;
  category: string;
  location: string;
  minBudget: number;
  maxBudget: number;
  schedule: string;
  note: string;
  providerId?: string;
}) {
  return mapTask(await invokeTasks<TaskRow>({ action: "create", task: payload }));
}

export async function getTasks() {
  const supabase = getSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error("Sesi Anda berakhir. Silakan masuk kembali.");
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (providerError) throw new Error(providerError.message);

  const { data, error } = await supabase
    .from("tasks")
    .select("*, provider:providers(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data as TaskRow[]).map((row) =>
    mapTask({
      ...row,
      perspective:
        provider?.id && row.provider_id === provider.id
          ? "provider"
          : "client",
    }),
  );
}

export async function getTask(id: string) {
  const task = (await getTasks()).find((item) => item.id === id);
  if (!task) throw new Error("Task tidak ditemukan.");
  return task;
}

export async function getOpenTasks() {
  const rows = await invokeTasks<TaskRow[]>({ action: "open" });
  return rows.map((row) => mapTask({ ...row, perspective: "provider" }));
}

export async function claimTask(id: string) {
  return mapTask(await invokeTasks<TaskRow>({ action: "claim", taskId: id }));
}

export async function getActiveMarketplaceTask(): Promise<Task | undefined> {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) return undefined;
  const { data: provider } = await getSupabase()
    .from("providers")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!provider) return undefined;
  const { data, error } = await getSupabase()
    .from("tasks")
    .select("*")
    .eq("provider_id", provider.id)
    .eq("origin", "marketplace")
    .in("status", ["scheduled", "ongoing"])
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapTask({ ...(data as TaskRow), perspective: "provider" }) : undefined;
}

export async function cancelTask(id: string) {
  return mapTask(await invokeTasks<TaskRow>({ action: "cancel", taskId: id }));
}

export async function transitionTask(id: string, transition: "accept" | "reject" | "start" | "complete") {
  return mapTask(await invokeTasks<TaskRow>({ action: "transition", taskId: id, transition }));
}

export async function getProviders(query = "", category = "") {
  let request = getSupabase()
    .from("providers")
    .select("*")
    .order("rating", { ascending: false });

  if (category && category !== "Semua") request = request.eq("category", category);
  if (query.trim()) {
    const safeQuery = query.trim().replaceAll(",", " ");
    request = request.or(
      `name.ilike.%${safeQuery}%,title.ilike.%${safeQuery}%,location.ilike.%${safeQuery}%`,
    );
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data as ProviderRow[]).map(mapProvider);
}

export async function getProfile(): Promise<Profile> {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  if (error) throw new Error(error.message);
  const { data: provider, error: providerError } = await getSupabase()
    .from("providers")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (providerError) throw new Error(providerError.message);
  return {
    id: data.id,
    username: data.username || auth.user.user_metadata.username || auth.user.email?.split("@")[0] || "pengguna",
    fullName: data.full_name || auth.user.user_metadata.full_name || data.username || auth.user.email?.split("@")[0] || "Pengguna",
    phone: data.phone ?? "",
    email: data.email ?? auth.user.email ?? "",
    address: data.address ?? "",
    avatarUrl: data.avatar_url ?? undefined,
    provider: provider ? mapProvider(provider as ProviderRow) : undefined,
  };
}

export async function updateProfile(profile: Omit<Profile, "id" | "avatarUrl" | "provider">) {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  if (profile.email !== auth.user.email) {
    const { error: emailError } = await getSupabase().auth.updateUser({ email: profile.email });
    if (emailError) throw new Error(emailError.message);
  }
  const { error } = await getSupabase().from("profiles").update({
    username: profile.username,
    full_name: profile.fullName,
    phone: profile.phone || null,
    email: profile.email,
    address: profile.address,
  }).eq("id", auth.user.id);
  if (error) throw new Error(error.message);
}

export async function getConversations(): Promise<Conversation[]> {
  const { data: auth } = await getSupabase().auth.getUser();
  const profile = await getProfile();
  const { data, error } = await getSupabase()
    .from("conversations")
    .select("id,last_message,updated_at,provider:providers(*),client:profiles!conversations_user_id_fkey(full_name,username)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const provider = mapProvider(row.provider as unknown as ProviderRow);
    const client = row.client as unknown as { full_name: string; username: string };
    const name = profile.provider?.id === provider.id && auth.user ? client.full_name || client.username : provider.name;
    return {
      id: row.id,
      provider,
      counterpartName: name,
      counterpartInitials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      lastMessage: row.last_message,
      updatedAt: row.updated_at,
    };
  });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await getSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function saveProviderProfile(input: { title: string; category: string; location: string; priceFrom: number; bio: string }) {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const profile = await getProfile();
  const initials = profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const { error } = await getSupabase().from("providers").upsert({
    user_id: auth.user.id,
    name: profile.fullName,
    title: input.title,
    category: input.category,
    location: input.location,
    price_from: input.priceFrom,
    bio: input.bio,
    initials,
  }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function uploadAvatar(file: File) {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const path = `${auth.user.id}/avatar.${extension}`;
  const { error: uploadError } = await getSupabase().storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data } = getSupabase().storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error } = await getSupabase().from("profiles").update({ avatar_url: avatarUrl }).eq("id", auth.user.id);
  if (error) throw new Error(error.message);
  return avatarUrl;
}

export async function rateTask(taskId: string, providerId: string, score: number, review: string) {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const { error } = await getSupabase().from("ratings").insert({
    task_id: taskId, provider_id: providerId, user_id: auth.user.id, score, review,
  });
  if (error) throw new Error(error.message);
}

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await getSupabase().from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({ id: item.id, title: item.title, body: item.body, href: item.href ?? undefined, readAt: item.read_at ?? undefined, createdAt: item.created_at }));
}

export async function markNotificationRead(id: string) {
  const { error } = await getSupabase().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getTaskLocation(taskId: string): Promise<TaskLocation | undefined> {
  const { data, error } = await getSupabase().from("task_locations").select("*").eq("task_id", taskId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { latitude: data.latitude, longitude: data.longitude, updatedAt: data.updated_at } : undefined;
}

export async function publishTaskLocation(taskId: string, latitude: number, longitude: number) {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const { error } = await getSupabase().from("task_locations").upsert({
    task_id: taskId, provider_user_id: auth.user.id, latitude, longitude, updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function sendMessage(conversationId: string, body: string) {
  const { data: auth } = await getSupabase().auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const { error } = await getSupabase().from("messages").insert({
    conversation_id: conversationId,
    sender_id: auth.user.id,
    body: body.trim(),
  });
  if (error) throw new Error(error.message);
  await getSupabase().from("conversations").update({
    last_message: body.trim(),
    updated_at: new Date().toISOString(),
  }).eq("id", conversationId);
}
