import { getSupabase } from "@/lib/supabase";
import type {
  Conversation,
  Message,
  Notification,
  Payment,
  PaymentMethod,
  Profile,
  Provider,
  ProviderVerificationStatus,
  Rating,
  Task,
  TaskLocation,
  TaskStatus,
} from "@/types";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.tasktify.id"
    : "http://localhost:8080")
).replace(/\/$/, "");

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  requestId?: string;
};

type TaskResponse = {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  schedule: string;
  status: TaskStatus;
  provider?: Provider;
  note: string;
  perspective?: "client" | "provider";
};

function mapTask(row: TaskResponse): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    budget: row.budget,
    date: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(row.schedule)),
    status: row.status,
    provider: row.provider,
    note: row.note,
    perspective: row.perspective,
  };
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const {
      data: { session },
      error,
    } = await getSupabase().auth.getSession();
    if (error || !session) {
      throw new Error("Sesi Anda berakhir. Silakan masuk kembali.");
    }
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("Layanan belum dapat dihubungi. Coba beberapa saat lagi.");
  }

  if (response.status === 204) return undefined as T;

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("Respons layanan tidak valid.");
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Operasi gagal diproses.");
  }
  return payload.data as T;
}

export async function createTask(payload: {
  title: string;
  category: string;
  location: string;
  budget: number;
  schedule: string;
  note: string;
  providerId?: string;
}) {
  return mapTask(
    await apiRequest<TaskResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function getTasks() {
  return (await apiRequest<TaskResponse[]>("/tasks")).map(mapTask);
}

export async function getTask(id: string) {
  return mapTask(await apiRequest<TaskResponse>(`/tasks/${encodeURIComponent(id)}`));
}

export async function getOpenTasks() {
  return (await apiRequest<TaskResponse[]>("/marketplace/tasks")).map(mapTask);
}

export async function getOpenTask(id: string) {
  return mapTask(
    await apiRequest<TaskResponse>(`/marketplace/tasks/${encodeURIComponent(id)}`),
  );
}

export async function claimTask(id: string) {
  return mapTask(
    await apiRequest<TaskResponse>(`/tasks/${encodeURIComponent(id)}/claim`, {
      method: "POST",
    }),
  );
}

export async function getActiveMarketplaceTask(): Promise<Task | undefined> {
  const task = await apiRequest<TaskResponse | null>("/marketplace/tasks/active");
  return task ? mapTask(task) : undefined;
}

export async function cancelTask(id: string) {
  return mapTask(
    await apiRequest<TaskResponse>(`/tasks/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    }),
  );
}

export async function transitionTask(
  id: string,
  transition: "accept" | "reject" | "start" | "complete",
) {
  return mapTask(
    await apiRequest<TaskResponse>(`/tasks/${encodeURIComponent(id)}/transition`, {
      method: "POST",
      body: JSON.stringify({ transition }),
    }),
  );
}

export async function getProviders(query = "", category = "") {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category && category !== "Semua") params.set("category", category);
  const suffix = params.size ? `?${params.toString()}` : "";
  return apiRequest<Provider[]>(`/providers${suffix}`, {}, false);
}

export async function getProfile(): Promise<Profile> {
  return apiRequest<Profile>("/me");
}

export async function updateProfile(
  profile: Omit<Profile, "id" | "avatarUrl" | "provider" | "role">,
) {
  const { data } = await getSupabase().auth.getUser();
  if (data.user?.email && profile.email !== data.user.email) {
    const { error } = await getSupabase().auth.updateUser({ email: profile.email });
    if (error) throw new Error(error.message);
  }
  return apiRequest<Profile>("/me", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function getConversations(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>("/conversations");
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return apiRequest<Message[]>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}

export async function saveProviderProfile(input: {
  title: string;
  category: string;
  location: string;
  priceFrom: number;
  bio: string;
}) {
  return apiRequest<Provider>("/me/provider", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.set("avatar", file);
  const result = await apiRequest<{ avatarUrl: string }>("/me/avatar", {
    method: "POST",
    body: form,
  });
  return result.avatarUrl;
}

export async function rateTask(
  taskId: string,
  providerId: string,
  score: number,
  review: string,
) {
  return apiRequest<Rating>("/ratings", {
    method: "POST",
    body: JSON.stringify({ taskId, providerId, score, review }),
  });
}

export async function getTaskRating(taskId: string): Promise<Rating | undefined> {
  const rating = await apiRequest<Rating | null>(
    `/tasks/${encodeURIComponent(taskId)}/rating`,
    {},
    false,
  );
  return rating ?? undefined;
}

export async function getProviderRatings(providerId: string): Promise<Rating[]> {
  return apiRequest<Rating[]>(
    `/providers/${encodeURIComponent(providerId)}/ratings`,
    {},
    false,
  );
}

export async function getProvider(id: string): Promise<Provider> {
  return apiRequest<Provider>(`/providers/${encodeURIComponent(id)}`, {}, false);
}

export async function createPayment(
  taskId: string,
  method: PaymentMethod = "online",
): Promise<Payment & { redirectUrl?: string }> {
  return apiRequest<Payment & { redirectUrl?: string }>(
    `/tasks/${encodeURIComponent(taskId)}/payment`,
    { method: "POST", body: JSON.stringify({ method }) },
  );
}

export async function confirmCashPayment(taskId: string): Promise<Payment> {
  return apiRequest<Payment>(
    `/tasks/${encodeURIComponent(taskId)}/payment/confirm-cash`,
    { method: "POST" },
  );
}

export async function getPayment(taskId: string): Promise<Payment | undefined> {
  const payment = await apiRequest<Payment | null>(
    `/tasks/${encodeURIComponent(taskId)}/payment`,
  );
  return payment ?? undefined;
}

export function subscribePayment(
  taskId: string,
  onChange: (payment: Payment) => void,
) {
  const timer = window.setInterval(() => {
    getPayment(taskId)
      .then((payment) => {
        if (payment) onChange(payment);
      })
      .catch(() => undefined);
  }, 3000);
  return () => window.clearInterval(timer);
}

export async function getNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications");
}

export async function markNotificationRead(id: string) {
  await apiRequest<void>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

export async function getTaskLocation(
  taskId: string,
): Promise<TaskLocation | undefined> {
  const location = await apiRequest<TaskLocation | null>(
    `/tasks/${encodeURIComponent(taskId)}/location`,
  );
  return location ?? undefined;
}

export async function publishTaskLocation(
  taskId: string,
  latitude: number,
  longitude: number,
) {
  return apiRequest<TaskLocation>(`/tasks/${encodeURIComponent(taskId)}/location`, {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function sendMessage(conversationId: string, body: string) {
  return apiRequest<Message>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: JSON.stringify({ body: body.trim() }) },
  );
}

export async function getAdminProviders(status?: ProviderVerificationStatus): Promise<Provider[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<Provider[]>(`/admin/providers${suffix}`);
}

export async function verifyProvider(id: string): Promise<Provider> {
  return apiRequest<Provider>(`/admin/providers/${encodeURIComponent(id)}/verify`, {
    method: "POST",
  });
}

export async function rejectProvider(id: string, note = ""): Promise<Provider> {
  return apiRequest<Provider>(`/admin/providers/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
