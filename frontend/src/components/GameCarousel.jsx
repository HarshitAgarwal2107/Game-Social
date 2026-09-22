import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeGames } from "../utils/normalizeGames";
import { useCarouselScroll } from "../hooks/useCarouselScroll";
import GameCard from "./GameCard";
import styles from "./GameCarousel.module.css";

export default function GameCarousel({
  url,
  title,
  badgeText = null,
  showHero = false,
  renderSubtitle = null,
  renderDateTag = null,
  limit = 10,
}) {
  const navigate = useNavigate();
  const { carouselRef, handleMouseMove, handleMouseLeave } = useCarouselScroll();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${url}?limit=${limit}`);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const json = await resp.json();
        if (cancelled) return;
        setItems(normalizeGames(Array.isArray(json) ? json : json.data || []));
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [url, limit]);

  const openGame = (item) => {
    const id = item.rawgId ?? item.id;
    if (id) navigate(`/game/${id}`);
  };

  const hero = showHero ? items[0] : null;
  const rest = showHero ? items.slice(1) : items;

  return (
    <section className={styles.section}>
      {loading && <div className={styles.muted}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {hero && (
        <div className={styles.heroWrap}>
          <div
            className={styles.hero}
            onClick={() => openGame(hero)}
            role="button"
            tabIndex={0}
          >
            <img src={hero.cover} alt={hero.title} className={styles.heroBg} />
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              {badgeText && <span className={styles.badge}>{badgeText}</span>}
              <div className={styles.heroTitle}>{hero.title}</div>
              {renderSubtitle && (
                <div className={`${styles.heroSub} ${styles.muted}`}>
                  {renderSubtitle(hero)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div className={styles.rowWrap}>
            <div
              className={styles.carousel}
              ref={carouselRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {rest.map((item) => (
                <GameCard
                  key={item.id}
                  game={item}
                  subtitle={renderSubtitle ? renderSubtitle(item) : null}
                  dateTag={renderDateTag ? renderDateTag(item) : null}
                  onOpen={() => openGame(item)}
                />
              ))}
            </div>

            {/* Progressive blur under the left sidebar only. Four stacked
                layers of increasing radius: a single layer can only fade its
                own opacity, which blends a full-strength blur with the sharp
                image underneath and reads as ghosting, not as a ramp. */}
            <div className={styles.edge} aria-hidden="true">
              <span className={styles.blur1} />
              <span className={styles.blur2} />
              <span className={styles.blur3} />
              <span className={styles.blur4} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
