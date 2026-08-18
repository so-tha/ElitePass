import { z } from "zod";

export const tierSchema = z.object({
  id:        z.string().min(1),
  label:     z.string().min(1),
  priceUnit: z.number().positive(),
  capacity:  z.number().int().positive(),
});

export type Tier = z.infer<typeof tierSchema>;

export const tiersArraySchema = z.array(tierSchema);
