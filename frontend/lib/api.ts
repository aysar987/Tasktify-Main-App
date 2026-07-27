import axios from "axios";
import type { Provider, Task } from "@/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export async function login(identifier: string, password: string) {
  const response = await api.post<ApiResponse<{ accessToken: string }>>("/auth/login", { identifier, password });
  return response.data.data;
}

export async function register(username: string, phone: string, email: string, password: string) {
  const response = await api.post<ApiResponse<{ user: { id: string } }>>("/auth/register", { username, phone, email, password });
  return response.data.data;
}

export async function resetPassword(email: string) {
  await api.post("/auth/reset-password", { email });
}

export async function verifyAccount(userId: string, code: string) {
  await api.post("/auth/verify", { userId, code });
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
  const response = await api.post<ApiResponse<Task>>("/tasks", {
    ...payload,
    // Temporary seeded user while authentication is hidden.
    userId: "00000000-0000-0000-0000-000000000001",
  });
  return response.data.data;
}

export async function getProviders(query = "", category = "") {
  const response = await api.get<ApiResponse<Provider[]>>("/providers", { params: { q: query, category } });
  return response.data.data;
}
