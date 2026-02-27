import { z } from "zod";

export const renewSubscriptionSchema = z.object({
  months: z.number().int().min(1).max(12).default(1),
  amountPen: z.number().min(1),
});

