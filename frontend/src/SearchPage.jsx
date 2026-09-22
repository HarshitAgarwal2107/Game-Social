import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GameSearch from "./components/GameSearch";
import GameCard from "./components/GameCard";
import Footer from "./components/Footer";
import { toPlatformFamilies } from "./utils/normalizeGames";
import styles from "./SearchPage.module.css";

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 40;

const splitList = (v) => (v ? v.split(",").filter(Boolean) : []);

// /api/search/games rows -> the shape GameCard expects.
function toCard(g) {
  return {
    id: String(g.id),
    rawgId: g.id,
    title: g.name,
    cover: g.background_image || "",
    year: g.year ?? null,
    genres: g.genres ?? [],
    platforms: toPlatformFamilies(g.platforms),
    metacritic: g.metacritic ?? null,
    rating: g.rating ?? null,
  };
}

/**
 * Full results for a search: everything /api/search/games matches, as game
 * cards, loaded a page at a time as you scroll. Reached by pressing Enter in
 * the search bar or picking one of its suggestions. The query lives in the
 * URL (?q, &genres, &platforms), so results can be linked, reloaded and
 * walked with Back/Forward.
 */
export default function SearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const genresParam = params.get("genres") ?? "";
  const platformsParam = params.get("platforms") ?? "";
  const genres = splitList(genresParam);
  const platforms = splitList(platformsParam);
  const valid = q.trim().length > 0 || genres.length > 0;

  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Bumped on every new search; a response for an older one is dropped.
  const searchId = useRef(0);
  const sentinelRef = useRef(null);

  async function loadPage(offset, id) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        q,
        genres: genresParam,
        platforms: platformsParam,
        // One extra row tells us whether another page exists.
        limit: String(PAGE_SIZE + 1),
        offset: String(offset),
      });
      const res = await fetch(`${API_URL}/api/search/games?${qs}`);
      if (id !== searchId.current) return;
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Too many searches, please slow down.");
        setHasMore(false);
        return;
      }
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const rows = await res.json();
      if (id !== searchId.current) return;
      setItems((prev) => [...prev, ...rows.slice(0, PAGE_SIZE).map(toCard)]);
      setHasMore(rows.length > PAGE_SIZE);
    } catch (e) {
      if (id === searchId.current) setError(e.message);
    } finally {
      if (id === searchId.current) setLoading(false);
    }
  }

  // New search whenever the URL's query changes.
  useEffect(() => {
    const id = ++searchId.current;
    setItems([]);
    setHasMore(false);
    setError("");
    if (valid) loadPage(0, id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, genresParam, platformsParam]);

  // Next page when the bottom of the grid comes into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPage(items.length, searchId.current);
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, items.length]);

  // Same as the homepage: the dock gets out of the way once the page is
  // scrolled all the way down to the footer.
  const endRef = useRef(null);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setAtEnd(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const heading = q.trim()
    ? <>Results for <span className={styles.query}>“{q.trim()}”</span></>
    : genres.length
      ? <>Browsing <span className={styles.query}>{genres.join(", ")}</span></>
      : "Search";

  const filters = [
    ...(q.trim() ? genres : []),
    ...platforms.map((p) => ({ pc: "PC", playstation: "PlayStation", xbox: "Xbox", nintendo: "Nintendo", mobile: "Mobile" })[p] ?? p),
  ];

  return (
    <div className={styles.page}>
      <main className={styles.results}>
        <header className={styles.header}>
          <div className={styles.kicker}>Search</div>
          <h1 className={styles.title}>{heading}</h1>
          <div className={styles.meta}>
            {filters.map((f) => (
              <span key={f} className={styles.filterTag}>{f}</span>
            ))}
            {valid && items.length > 0 && (
              <span className={styles.count}>
                {items.length}{hasMore ? "+" : ""} {items.length === 1 && !hasMore ? "game" : "games"}
              </span>
            )}
          </div>
        </header>

        {!valid && (
          <p className={styles.empty}>Type a game name and press Enter, or pick a genre.</p>
        )}

        {valid && !loading && !error && items.length === 0 && (
          <p className={styles.empty}>No games match this search. Try fewer filters or a shorter name.</p>
        )}

        {error && <p className={`${styles.empty} ${styles.error}`}>{error}</p>}

        {items.length > 0 && (
          <div className={styles.grid}>
            {items.map((g) => (
              <GameCard key={g.id} game={g} onOpen={() => navigate(`/game/${g.rawgId}`)} />
            ))}
          </div>
        )}

        {loading && <p className={styles.loading}>Loading…</p>}
        <div ref={sentinelRef} aria-hidden="true" />
      </main>

      <Footer />
      <div ref={endRef} className={styles.endMarker} aria-hidden="true" />

      {/* Keyed by the search so it resets to the URL's values on Back/Forward
          and after each submit. */}
      <GameSearch
        key={params.toString()}
        hidden={atEnd}
        live
        initialQuery={q}
        initialGenres={genres}
        initialPlatforms={platforms}
      />
    </div>
  );
}
