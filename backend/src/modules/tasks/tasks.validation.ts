import { z } from "zod";

// input saat client posting task baru
export const createTaskSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  category: z.string().min(2),
  budget: z.number().int().positive("Budget harus angka positif"),
  deadline: z.string().datetime().optional(),   // format ISO, opsional
});

// filter & pagination saat browse marketplace (?category=...&page=2)
export const listTaskQuerySchema = z.object({
  category: z.string().optional(),
  minBudget: z.coerce.number().int().optional(),
  maxBudget: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});