import { asc, desc } from "drizzle-orm";

export function mapOrderToDrizzle(
  orderByFields: Record<string, 1 | -1>,
  schema
) {
  return Object.entries(orderByFields)
    .filter(([field]) => field !== "")
    .map(([field, order]) => {
      const direction = order === 1 ? asc : desc;
      return direction(schema[field]);
    });
}
