import { z } from "zod";
export const updateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});