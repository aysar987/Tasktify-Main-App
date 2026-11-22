import { getSupabase } from "@/lib/supabase";
import type { Banner, Conversation, Message, Notification, MarketplaceListing, MarketplaceListingService, Payment, PaymentMethod, Profile, Provider, ProviderVerificationStatus, Rating, Task, TaskClient, TaskLocation, TaskPerspective, TaskStatus, TermsStatus } from "@/types";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.tasktify.id"
    : "http://localhost:8080")
).replace(/\/$/, "");

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  /** `field` names the input a validation error is about, e.g. "title". */
  error?: { code: string; message: string; field?: string };
  requestId?: string;
};

type TaskResponse = {
  id: string;
  title: string;
  location: string;
  addressHidden?: Task["addressHidden"];
  budget: number;
  schedule: string;
  status: TaskStatus;
  provider?: Provider;
  note: string;
  perspective?: TaskPerspective;
  images?: string[];
  clientName?: string;
  client?: TaskClient;
  endedAt?: string;
};

function mapTask(row: TaskResponse): Task {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    addressHidden: row.addressHidden,
    budget: row.budget,
    date: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(row.schedule)),
    status: row.status,
    provider: row.provider,
    note: row.note,
    perspective: row.perspective,
    images: row.images ?? [],
    clientName: row.clientName,
    client: row.client,
    endedAt: row.endedAt,
  };
}

/**
 * An API error that keeps the backend's error code (e.g. "CASH_CONFIRMATION_REQUIRED")
 * and, for validation errors, the field it is about (e.g. "title").
 */
export class ApiError extends Error {
  constructor(message: string, readonly code?: string, readonly field?: string) {
    super(message);
    this.name = "ApiError";
  }
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
    // The terms changed (or were never accepted): ask once, then come back here.
    if (payload.error?.code === "TERMS_ACCEPTANCE_REQUIRED" && typeof window !== "undefined" && window.location.pathname !== "/terms-accept") {
      const next = window.location.pathname + window.location.search;
      window.location.assign(`/terms-accept?next=${encodeURIComponent(next)}`);
    }
    throw new ApiError(payload.error?.message ?? "Operasi gagal diproses.", payload.error?.code, payload.error?.field);
  }
  return payload.data as T;
}

type CreateTaskResponse = {
  task: TaskResponse;
  payment?: Payment & { redirectUrl?: string };
};

export async function createTask(payload: {
  title: string;
  location: string;
  budget: number;
  schedule: string;
  note: string;
  providerId?: string;
  /** Lapak the order was placed from; its review then counts toward that lapak. */
  marketplaceListingId?: string;
  method: PaymentMethod;
  image?: File;
}) {
  const form = new FormData();
  form.set("title", payload.title);
  form.set("location", payload.location);
  form.set("budget", String(payload.budget));
  form.set("schedule", payload.schedule);
  form.set("note", payload.note);
  if (payload.providerId) form.set("providerId", payload.providerId);
  if (payload.marketplaceListingId) form.set("marketplaceListingId", payload.marketplaceListingId);
  form.set("method", payload.method);
  if (payload.image) form.set("image", payload.image);
  const result = await apiRequest<CreateTaskResponse>("/tasks", {
    method: "POST",
    body: form,
  });
  return { task: mapTask(result.task), payment: result.payment };
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

/** Task actions give up after this long, so a hung request ends in an error instead of a spinner. */
const TASK_ACTION_TIMEOUT_MS = 20000;
function taskActionSignal() {
  return typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(TASK_ACTION_TIMEOUT_MS) : undefined;
}

export async function claimTask(id: string) {
  return mapTask(
    await apiRequest<TaskResponse>(`/tasks/${encodeURIComponent(id)}/claim`, {
      method: "POST",
      signal: taskActionSignal(),
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
      signal: taskActionSignal(),
    }),
  );
}

export async function transitionTask(
  id: string,
  transition: "accept" | "reject" | "start" | "complete",
  options: { cashReceived?: boolean } = {},
) {
  return mapTask(
    await apiRequest<TaskResponse>(`/tasks/${encodeURIComponent(id)}/transition`, {
      method: "POST",
      signal: taskActionSignal(),
      // cashReceived with "complete" confirms the cash payment in the same action.
      body: JSON.stringify({ transition, cashReceived: options.cashReceived ?? false }),
    }),
  );
}

export async function getMarketplaceListings(query = "", category = "") {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category && category !== "Semua") params.set("category", category);
  const suffix = params.size ? `?${params.toString()}` : "";
  const listings = await apiRequest<MarketplaceListing[]>(`/marketplace/listings${suffix}`, {}, false);
  return listings.map(normalizeMarketplaceListing);
}

export async function getMarketplaceListing(id: string): Promise<MarketplaceListing> {
  const listing = await apiRequest<MarketplaceListing | null>(
    `/marketplace/listings/${encodeURIComponent(id)}`,
    {},
    false,
  );
  if (!listing) throw new Error("Lapak tidak ditemukan atau belum dipublikasikan.");
  return normalizeMarketplaceListing(listing);
}

function normalizeMarketplaceListing(listing: MarketplaceListing): MarketplaceListing {
  const units: MarketplaceListingService["unit"][] = [
    "per_pasangan",
    "per_item",
    "per_jam",
    "per_meter",
    "per_kg",
    "per_unit",
    "sekali_datang",
  ];
  const services = Array.isArray(listing.services) ? listing.services : [];
  return {
    ...listing,
    whatsapp: listing.whatsapp ?? "",
    fullAddress: listing.fullAddress ?? "",
    serviceTypes: Array.isArray(listing.serviceTypes) ? listing.serviceTypes : ["buyer_location"],
    operatingHours: listing.operatingHours ?? {},
    instagramUrl: listing.instagramUrl ?? "",
    tiktokUrl: listing.tiktokUrl ?? "",
    termsWarranty: listing.termsWarranty ?? "",
    services: services.map((service) => ({
      ...service,
      price: Number.isSafeInteger(service.price) ? service.price : listing.priceFrom,
      unit: units.includes(service.unit) ? service.unit : "per_unit",
      duration: service.duration ?? "",
      isActive: service.isActive ?? true,
    })),
  };
}

export async function getMyMarketplaceListing(): Promise<MarketplaceListing | null> {
  return apiRequest<MarketplaceListing | null>("/me/marketplace-listing");
}

export async function saveMarketplaceListing(payload: {
  name: string;
  category: string;
  location: string;
  description: string;
  whatsapp: string;
  fullAddress: string;
  serviceTypes: ("buyer_location" | "provider_travel" | "pickup_delivery")[];
  operatingHours: MarketplaceListing["operatingHours"];
  instagramUrl: string;
  tiktokUrl: string;
  termsWarranty: string;
  image?: File;
  services: MarketplaceListingService[];
}) {
  const form = new FormData();
  form.set("name", payload.name);
  form.set("category", payload.category);
  form.set("location", payload.location);
  form.set("description", payload.description);
  form.set("whatsapp", payload.whatsapp);
  form.set("fullAddress", payload.fullAddress);
  form.set("serviceTypes", JSON.stringify(payload.serviceTypes));
  form.set("operatingHours", JSON.stringify(payload.operatingHours));
  form.set("instagramUrl", payload.instagramUrl);
  form.set("tiktokUrl", payload.tiktokUrl);
  form.set("termsWarranty", payload.termsWarranty);
  if (payload.image) form.set("image", payload.image);
  form.set("services", JSON.stringify(payload.services));
  return apiRequest<MarketplaceListing>("/me/marketplace-listing", {
    method: "PUT",
    body: form,
  });
}

/** Records that the signed-in user accepted the given Syarat & Ketentuan version. */
export async function acceptTerms(termsVersion: string) {
  return apiRequest<TermsStatus>("/me/terms-acceptance", {
    method: "POST",
    body: JSON.stringify({ termsVersion }),
  });
}

export async function getProfile(): Promise<Profile> {
  return apiRequest<Profile>("/me");
}

export async function updateProfile(
  profile: Omit<Profile, "id" | "avatarUrl" | "provider" | "role" | "verification" | "terms">,
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

export async function getUnreadConversationCount(): Promise<number> {
  const result = await apiRequest<{ count: number }>("/conversations/unread-count");
  return result.count;
}

export async function markConversationRead(conversationId: string) {
  await apiRequest<void>(`/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
  });
}

export async function getPushConfig(): Promise<{ publicKey: string; enabled: boolean }> {
  return apiRequest<{ publicKey: string; enabled: boolean }>("/push/public-key");
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  await apiRequest<void>("/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}

export async function deletePushSubscription(endpoint: string) {
  await apiRequest<void>("/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}

/**
 * `viewing` tells the server the reader is looking at this chat right now, so
 * it does not push new messages to their devices while they are reading.
 */
export async function getMessages(conversationId: string, viewing = false): Promise<Message[]> {
  return apiRequest<Message[]>(
    `/conversations/${encodeURIComponent(conversationId)}/messages${viewing ? "?viewing=1" : ""}`,
  );
}

/**
 * Submits "Verifikasi akun" (KTP photo). `returnTo` is the in-app page to come
 * back to once it is approved, e.g. the task the user wanted to take.
 */
export async function submitAccountVerification(ktpFile: File, returnTo?: string) {
  const form = new FormData();
  form.set("ktp", ktpFile);
  if (returnTo) form.set("returnTo", returnTo);
  return apiRequest<Provider>("/me/verification", {
    method: "PUT",
    body: form,
  });
}

/** Backend error codes meaning the account must be verified first. */
export const VERIFICATION_ERROR_CODES = ["VERIFICATION_REQUIRED", "VERIFICATION_PENDING", "VERIFICATION_REJECTED"];

async function apiRequestBlobUrl(path: string): Promise<string> {
  const {
    data: { session },
    error,
  } = await getSupabase().auth.getSession();
  if (error || !session) {
    throw new Error("Sesi Anda berakhir. Silakan masuk kembali.");
  }
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
  } catch {
    throw new Error("Layanan belum dapat dihubungi. Coba beberapa saat lagi.");
  }
  if (!response.ok) {
    throw new Error("Gagal memuat gambar.");
  }
  return URL.createObjectURL(await response.blob());
}

const taskImageCache = new Map<string, Promise<string>>();

/** Loads a task photo (an API path from `task.images`) with the bearer token; cached per session. */
export function getTaskImageUrl(path: string): Promise<string> {
  let pending = taskImageCache.get(path);
  if (!pending) {
    pending = apiRequestBlobUrl(path);
    pending.catch(() => taskImageCache.delete(path));
    taskImageCache.set(path, pending);
  }
  return pending;
}

export function getOwnProviderKtpUrl(): Promise<string> {
  return apiRequestBlobUrl("/me/provider/ktp");
}

export function getProviderKtpUrl(providerId: string): Promise<string> {
  return apiRequestBlobUrl(`/admin/providers/${encodeURIComponent(providerId)}/ktp`);
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

export async function getBanners(): Promise<Banner[]> {
  return (await apiRequest<Banner[]>("/banners")).map(normalizeBanner);
}

function normalizeBanner(banner: Banner): Banner {
  const mobileImageUrl = banner.mobileImageUrl || banner.imageUrl;
  return {
    ...banner,
    imageUrl: mobileImageUrl,
    mobileImageUrl,
    desktopImageUrl: banner.desktopImageUrl || mobileImageUrl,
  };
}

export async function getAdminMarketplaceListings(
  status?: ProviderVerificationStatus,
): Promise<MarketplaceListing[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<MarketplaceListing[]>(`/admin/marketplace-listings${suffix}`);
}

export async function verifyMarketplaceListing(id: string): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>(
    `/admin/marketplace-listings/${encodeURIComponent(id)}/verify`,
    { method: "POST" },
  );
}

export async function rejectMarketplaceListing(
  id: string,
  note = "",
): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>(
    `/admin/marketplace-listings/${encodeURIComponent(id)}/reject`,
    { method: "POST", body: JSON.stringify({ note }) },
  );
}

export async function deleteMarketplaceListing(id: string): Promise<void> {
  await apiRequest<void>(`/admin/marketplace-listings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** Opens the conversation about a task with its provider, creating it on first use. */
export async function startTaskChat(taskId: string): Promise<Conversation> {
  return apiRequest<Conversation>(`/tasks/${encodeURIComponent(taskId)}/chat`, { method: "POST" });
}

export async function startProviderChat(providerId: string): Promise<Conversation> {
  return apiRequest<Conversation>(`/providers/${encodeURIComponent(providerId)}/chat`, {
    method: "POST",
  });
}

export async function startMarketplaceListingChat(listingId: string): Promise<Conversation> {
  return apiRequest<Conversation>(`/marketplace/listings/${encodeURIComponent(listingId)}/chat`, {
    method: "POST",
  });
}

export async function getAdminBanners(): Promise<Banner[]> {
  return (await apiRequest<Banner[]>("/admin/banners")).map(normalizeBanner);
}

type BannerFormPayload = {
  mobileImage?: File;
  desktopImage?: File;
  href: string;
  sortOrder: number;
  active: boolean;
};

function bannerFormData(payload: BannerFormPayload): FormData {
  const form = new FormData();
  if (payload.mobileImage) form.set("mobileImage", payload.mobileImage);
  if (payload.desktopImage) form.set("desktopImage", payload.desktopImage);
  form.set("href", payload.href);
  form.set("sortOrder", String(payload.sortOrder));
  form.set("active", String(payload.active));
  return form;
}

export async function createBanner(payload: BannerFormPayload): Promise<Banner> {
  return apiRequest<Banner>("/admin/banners", {
    method: "POST",
    body: bannerFormData(payload),
  });
}

export async function updateBanner(id: string, payload: BannerFormPayload): Promise<Banner> {
  return apiRequest<Banner>(`/admin/banners/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: bannerFormData(payload),
  });
}

export async function deleteBanner(id: string): Promise<void> {
  await apiRequest<void>(`/admin/banners/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
