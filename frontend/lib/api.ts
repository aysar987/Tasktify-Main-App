import { getSupabase } from "@/lib/supabase";
import type { Provider, Task, TaskStatus } from "@/types";

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
};

type TaskRow = {
  id: string;
  title: string;
  category: string;
  location: string;
  min_budget: number;
  max_budget: number;
  schedule: string;
  note: string;
  status: TaskStatus;
  provider?: ProviderRow | null;
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
  };
}

async function invokeTasks<T>(body: Record<string, unknown>) {
  const { data, error } = await getSupabase().functions.invoke<{
    success: boolean;
    data?: T;
    message?: string;
  }>("tasks", { body });

  if (error) throw new Error(error.message);
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
}) {
  return mapTask(await invokeTasks<TaskRow>({ action: "create", task: payload }));
}

export async function getTasks() {
  const rows = await invokeTasks<TaskRow[]>({ action: "list" });
  return rows.map(mapTask);
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
