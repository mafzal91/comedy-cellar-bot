import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  schema: ["./packages/core/**/*.sql.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Resource.DbUrl.value,
  },
});
