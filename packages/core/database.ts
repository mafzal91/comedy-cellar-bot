import pg from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { Resource } from "sst";

import * as schema from "./database";
const connectionString = Resource.DbUrl.value ?? "";

const client = pg(connectionString, { prepare: false });
const db = drizzle(client, { schema });

export { db };
