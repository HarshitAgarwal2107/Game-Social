import fetch from "node-fetch";
import { getPG } from "../config/db.js";

const RAWG_API_KEY = process.env.RAWG_API_KEY || "";
const RAWG_BASE = "https://api.rawg.io/api";

// -------------------- helpers --------------------

function normalizeName(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(a = "", b = "") {
  a = normalizeName(a);
  b = normalizeName(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const as = new Set(a.split(" "));
  const bs = new Set(b.split(" "));
  let common = 0;
  for (const t of as) if (bs.has(t)) common++;
  const score = common / Math.max(as.size, bs.size);
  return Math.min(1, Math.max(0, score));
}

// -------------------- DB --------------------

export async function getMappingBySteamId(steamId) {
  console.log("[steamRawgMap] getMappingBySteamId:", steamId);
  const pool = getPG();
  const { rows } = await pool.query(
    `SELECT steam_id, rawg_id, source, confidence, metadata
     FROM steam_rawg_map
     WHERE steam_id = $1
     LIMIT 1`,
    [steamId]
  );
  console.log("[steamRawgMap] mapping result:", rows[0] ?? null);
  return rows[0] ?? null;
}

export async function upsertMapping(steamId, rawgId, opts = {}) {
  const { source = "manual", confidence = 1.0, metadata = null } = opts;
  console.log("[steamRawgMap] upsertMapping:", {
    steamId,
    rawgId,
    source,
    confidence
  });

  const pool = getPG();
  const { rows } = await pool.query(
    `
    INSERT INTO steam_rawg_map
      (steam_id, rawg_id, source, confidence, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5, now(), now())
    ON CONFLICT (steam_id) DO UPDATE
      SET rawg_id = EXCLUDED.rawg_id,
          source = EXCLUDED.source,
          confidence = EXCLUDED.confidence,
          metadata = EXCLUDED.metadata,
          updated_at = now()
    RETURNING *;
    `,
    [steamId, String(rawgId), source, confidence, metadata]
  );

  console.log("[steamRawgMap] upserted row:", rows[0]);
  return rows[0];
}

// -------------------- RAWG search --------------------

export async function searchRawgByName(name, page_size = 10) {
  console.log("[steamRawgMap] searchRawgByName:", name);

  const params = new URLSearchParams({
    search: name,
    page_size: String(page_size)
  });
  if (RAWG_API_KEY) params.set("key", RAWG_API_KEY);

  const url = `${RAWG_BASE}/games?${params.toString()}`;
  const r = await fetch(url);

  if (!r.ok) {
    console.error("[steamRawgMap] RAWG search failed:", r.status);
    throw new Error(`RAWG search failed ${r.status}`);
  }

  const json = await r.json();
  console.log(
    "[steamRawgMap] RAWG results:",
    json.results?.length || 0
  );

  return Array.isArray(json.results) ? json.results : [];
}

// -------------------- auto match --------------------

export async function autoMatchRawg(steamId, steamName, opts = {}) {
  const { threshold = 0.55 } = opts;
  console.log("[steamRawgMap] autoMatchRawg:", {
    steamId,
    steamName,
    threshold
  });

  const candidates = await searchRawgByName(steamName, 8);
  if (!candidates.length) {
    console.warn("[steamRawgMap] no RAWG candidates");
    return null;
  }

  let best = null;

  for (const c of candidates) {
    const rawgName = c.name || c.slug || "";
    const score = nameSimilarity(steamName, rawgName);

    console.log("  candidate:", {
      rawgId: c.id,
      rawgName,
      score
    });

    if (!best || score > best.score) {
      best = { rawgId: c.id, score, candidate: c };
    }
  }

  if (!best || best.score < threshold) {
    console.warn("[steamRawgMap] best score below threshold:", best);
    return null;
  }

  console.log("[steamRawgMap] match selected:", best);
  return best;
}

// -------------------- bulk sync --------------------

export async function syncUnmappedFromLatestBucket({
  limit = 500,
  threshold = 0.55
} = {}) {
  console.log("[steamRawgMap] syncUnmappedFromLatestBucket start", {
    limit,
    threshold
  });

  const pool = getPG();
  const client = await pool.connect();

  try {
    const lb = await client.query(`
      SELECT bucket_id
      FROM steamspy_trending
      WHERE bucket_id IS NOT NULL
      GROUP BY bucket_id
      ORDER BY MAX(snapshot_time) DESC
      LIMIT 1
    `);

    let rows;
    if (lb.rowCount > 0) {
      console.log("[steamRawgMap] using bucket:", lb.rows[0].bucket_id);
      rows = await client.query(
        `SELECT steam_id, name
         FROM steamspy_trending
         WHERE bucket_id = $1
         LIMIT $2`,
        [lb.rows[0].bucket_id, limit]
      );
    } else {
      console.log("[steamRawgMap] fallback to latest snapshot");
      const ls = await client.query(
        `SELECT snapshot_time
         FROM steamspy_trending
         ORDER BY snapshot_time DESC
         LIMIT 1`
      );
      if (ls.rowCount === 0) return { processed: 0, matched: 0 };
      rows = await client.query(
        `SELECT steam_id, name
         FROM steamspy_trending
         WHERE snapshot_time = $1
         LIMIT $2`,
        [ls.rows[0].snapshot_time, limit]
      );
    }

    let processed = 0;
    let matched = 0;

    for (const c of rows.rows) {
      processed++;
      console.log("[steamRawgMap] processing steam_id:", c.steam_id);

      const existing = await client.query(
        `SELECT 1 FROM steam_rawg_map WHERE steam_id = $1 LIMIT 1`,
        [c.steam_id]
      );
      if (existing.rowCount > 0) {
        console.log("  already mapped, skipping");
        continue;
      }

      try {
        const result = await autoMatchRawg(
          c.steam_id,
          c.name || "",
          { threshold }
        );

        if (!result) {
          console.warn("  no valid match");
          await client.query(
            `INSERT INTO steam_rawg_conflicts
             (steam_id, tried_payload, reason, created_at)
             VALUES ($1,$2,$3, now())`,
            [c.steam_id, JSON.stringify({ name: c.name }), "no-good-candidate"]
          );
          continue;
        }

        await client.query(
          `INSERT INTO steam_rawg_map
           (steam_id, rawg_id, source, confidence, metadata, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5, now(), now())
           ON CONFLICT (steam_id) DO NOTHING`,
          [
            c.steam_id,
            String(result.rawgId),
            "auto",
            result.score,
            JSON.stringify(result.candidate)
          ]
        );

        matched++;
        console.log("  mapped → RAWG:", result.rawgId);

      } catch (e) {
        console.error("  exception:", e.message);
        await client.query(
          `INSERT INTO steam_rawg_conflicts
           (steam_id, tried_payload, reason, created_at)
           VALUES ($1,$2,$3, now())`,
          [
            c.steam_id,
            JSON.stringify({ name: c.name, err: e.message }),
            "exception"
          ]
        );
      }
    }

    console.log("[steamRawgMap] sync finished", { processed, matched });
    return { processed, matched };

  } finally {
    client.release();
  }
}
