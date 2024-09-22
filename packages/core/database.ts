import pg from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./database";
const connectionString = process.env.DATABASE_URL ?? "";

const client = pg(connectionString, { prepare: false });
const db = drizzle(client, { schema });

export { db };
