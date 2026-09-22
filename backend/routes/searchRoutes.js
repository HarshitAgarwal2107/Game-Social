import express from "express";
import { getPG } from "../config/db.js";
import logger from "../config/logger.js";
import { searchLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/* The search bar filters by platform family ("playstation"), but games list
   individual consoles ("PlayStation 4", "PS Vita"). Matching the family name
   exactly only ever hit the one console that shares it: "playstation" found
   just the PS1, "xbox" just the original Xbox, and "nintendo" nothing at all.
   Each family expands to the RAWG platform names it covers (as they appear in
   games.platforms), matching how the cards group platforms. */
const PLATFORM_FAMILIES = {
  pc: ["PC", "macOS", "Linux"],
  playstation: [
    "PlayStation", "PlayStation 2", "PlayStation 3", "PlayStation 4",
    "PlayStation 5", "PSP", "PS Vita",
  ],
  xbox: ["Xbox", "Xbox 360", "Xbox One", "Xbox Series S/X"],
  nintendo: [
    "Nintendo Switch", "Nintendo 3DS", "Nintendo DS", "Nintendo DSi",
    "Wii", "Wii U", "Nintendo 64", "GameCube", "NES", "SNES",
    "Game Boy", "Game Boy Color", "Game Boy Advance",
  ],
  mobile: ["iOS", "Android"],
};

router.get("/games", searchLimiter, async (req, res) => {
  try {
    const {
      q = "",
      genres = "",
      platforms = ""
    } = req.query;

    // The dropdown asks for 15; the /search page pages through with
    // limit + offset. Capped so one request can't pull a huge slice.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 60);
    const offset = Math.min(Math.max(parseInt(req.query.offset, 10) || 0, 0), 5000);

    // if (!q || q.length < 3) return res.json([]);
    // A platform alone is not a search (see GameSearch.jsx); it only narrows
    // a text or genre search.
    if (!q && !genres) return res.json([]);


    const pg = getPG();

    const where = [];
    const values = [];
    let idx = 1;

    where.push(`name ILIKE $${idx}`);
    values.push(`%${q}%`);
    idx++;

    where.push(`suggestions_count IS NOT NULL`);

    if (genres) {
     where.push(`
    EXISTS (
      SELECT 1
      FROM unnest(genres) g
      WHERE lower(g) = ANY($${idx})
    )
  `);
     values.push(genres.split(",").map(g => g.toLowerCase()));
      idx++;
    }

    // Unknown family keys are ignored; if none are valid, no platform filter.
    const platformNames = platforms
      .split(",")
      .flatMap(f => PLATFORM_FAMILIES[f.trim().toLowerCase()] ?? [])
      .map(p => p.toLowerCase());

    if (platformNames.length) {
      where.push(`
    EXISTS (
      SELECT 1
      FROM unnest(platforms) p
      WHERE lower(p) = ANY($${idx})
    )
  `);
      values.push(platformNames);
      idx++;
    }

    // id last so the order is total and paging never repeats or skips rows.
    const orderBy = `
      similarity(name, $${idx}) DESC,
      suggestions_count DESC,
      id
    `;
    values.push(q);
    idx++;

    const sql = `
      SELECT id, name, suggestions_count, metacritic, rating,
             background_image, genres, platforms,
             -- Year taken in SQL: released is a date, and node-postgres turns
             -- a date into local midnight, which serialises as the previous
             -- day in UTC (a Jan 1 release would read as the year before).
             EXTRACT(YEAR FROM released)::int AS year
      FROM games
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit, offset);

    const { rows } = await pg.query(sql, values);
    res.json(rows);
  } catch (e) {
    logger.error({ err: e }, "search failed");
    res.status(500).json([]);
  }
});

export default router;
