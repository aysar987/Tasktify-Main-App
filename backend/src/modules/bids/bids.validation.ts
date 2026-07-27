import { z } from "zod";
export const createBidSchema = z.object({
  amount: z.number().int().positive(),
  message: z.string().optional(),
});