// Grabs a single show (plus its room and full comic lineup) from the shared
// Supabase DB by its Comedy Cellar numeric id — the value stored as show.id.
//
// This exists because there is no fetch-a-show-by-id path elsewhere: the
// Comedy Cellar API is fetch-by-date only, and the only by-key API route
// (GET /api/shows/{timestamp}) keys on the reservation timestamp, not the id.
//
// The DB is shared across every stage, so the row is the same regardless of
// which stage's DbUrl you inject; use prod as the canonical one.
//
// Usage: npx sst shell --stage prod node scripts/get-show.mjs <showId>
//   e.g. npx sst shell --stage prod node scripts/get-show.mjs 20050298
import { createRequire } from "module";
import { Resource } from "sst";

// Resolve the `postgres` driver from packages/core (its dependency) so this
// works regardless of pnpm hoisting, without adding a root dependency.
const require = createRequire(new URL("../packages/core/", import.meta.url));
const postgres = require("postgres");

const id = Number(process.argv[2]);
if (!Number.isInteger(id) || id <= 0) {
  console.error("Usage: node scripts/get-show.mjs <showId>   (positive integer)");
  process.exit(1);
}

// `prepare: false` mirrors packages/core/database.ts — required for the
// Supabase transaction pooler (pgbouncer).
const sql = postgres(Resource.DbUrl.value, { prepare: false });

try {
  const [row] = await sql`
    select
      s.*,
      r.name          as "roomName",
      r."externalId"  as "roomExternalId",
      coalesce(
        json_agg(
          json_build_object(
            'id', c.id,
            'externalId', c."externalId",
            'name', c.name,
            'website', c.website,
            'actEnabled', a.enabled
          ) order by c.name
        ) filter (where c.id is not null),
        '[]'
      ) as lineup
    from show s
    left join room  r on r.id = s."roomId"
    left join act   a on a."showId" = s.id
    left join comic c on c.id = a."comicId"
    where s.id = ${id}
    group by s.id, r.name, r."externalId"
  `;

  if (!row) {
    console.error(`No show found with id ${id}`);
    process.exit(2);
  }

  // Derived fields the API/Show model computes on the fly (show.ts): the club's
  // own `soldout` flag is not trusted, so recompute it locally.
  const max = row.max ?? 0;
  const totalGuests = row.totalGuests ?? 0;
  const enriched = {
    ...row,
    soldout: max > 0 ? totalGuests >= max : null,
    occupancyRate: max > 0 ? totalGuests / max : null,
    reservationUrl: row.timestamp
      ? `https://www.comedycellar.com/reservation/?showid=${row.timestamp}`
      : null,
  };

  console.log(JSON.stringify(enriched, null, 2));
} finally {
  await sql.end();
}
