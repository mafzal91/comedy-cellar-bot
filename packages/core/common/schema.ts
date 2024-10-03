import * as z from "zod";

export const UnixDateRange = z
  .object({
    start: z.coerce.number().int().min(0).optional(),
    end: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    ({ start, end }) => {
      if (start !== undefined && end !== undefined) {
        return start <= end;
      }

      return true;
    },
    {
      message:
        "Invalid range: 'date.start' must be less than or equal to 'date.end' if both are provided",
    }
  );
