import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GameChat from "../components/GameChat";
import GameReviews from "../components/GameReviews";

export default function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const [myReview, setMyReview] = useState({
    verdict: null,
    title: "",
    body: "",
    pros: [],
    cons: [],
    completed: false
  });

  const heroIntervalRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
      credentials: "include"
    })
      .then(r => (r.ok ? r.json() : null))
      .then(me => me?._id && setCurrentUserId(String(me._id)));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const r = await fetch(
          `${import.meta.env.VITE_API_URL}/api/gameLookup/${id}`
        );
        let j = null;
        if (r.ok) {
          j = await r.json();
          const steam = j.steam;
          if (steam) {
            if (!cancelled) {
              setGame({
                name: steam.name || "Unknown Game",
                description:
                  steam.detailed_description ||
                  steam.short_description ||
                  "",
                heroImage: steam.header_image || "",
                release: steam.release_date?.date || null,
                metacritic: steam.metacritic || null,
                price: steam.price_overview || null,
                genres: (steam.genres || []).map(g => g.description),
                categories: (steam.categories || []).map(c => c.description),
                screenshots: steam.screenshots || []
              });
            }
          } else {
            // Fallback to RAWG when Steam data unavailable
            const r2 = await fetch(
              `${import.meta.env.VITE_API_URL}/api/rawg/game/${id}`
            );
            const rawg = await r2.json().catch(() => null);
            if (r2.ok && rawg && !cancelled) {
              setGame({
                name: rawg.name || "Unknown Game",
                description: rawg.description || rawg.description_raw || "",
                heroImage: rawg.background_image || "",
                release: rawg.released || null,
                metacritic: rawg.metacritic ? { score: rawg.metacritic } : null,
                price: null,
                genres: (rawg.genres || []).map(g => g.name),
                categories: (rawg.tags || []).map(t => t.name),
                screenshots: (rawg.short_screenshots || []).map(s => ({ path_full: s.image }))
              });
            } else {
              if (!cancelled) setError("Steam data unavailable");
            }
          }
        } else {
          // Fallback to RAWG when Steam lookup fails
          const r2 = await fetch(
            `${import.meta.env.VITE_API_URL}/api/rawg/game/${id}`
          );
          const rawg = await r2.json().catch(() => null);
          if (r2.ok && rawg && !cancelled) {
            setGame({
              name: rawg.name || "Unknown Game",
              description: rawg.description || rawg.description_raw || "",
              heroImage: rawg.background_image || "",
              release: rawg.released || null,
              metacritic: rawg.metacritic ? { score: rawg.metacritic } : null,
              price: null,
              genres: (rawg.genres || []).map(g => g.name),
              categories: (rawg.tags || []).map(t => t.name),
              screenshots: (rawg.short_screenshots || []).map(s => ({ path_full: s.image }))
            });
          } else {
            if (!cancelled) setError("Failed to load game");
          }
        }

        const owns = await fetch(
          `${import.meta.env.VITE_API_URL}/api/me/owns/${id}`,
          { credentials: "include" }
        );
        const ownsJson = owns.ok ? await owns.json() : {};
        if (!cancelled) setOwned(Boolean(ownsJson.owned));
      } catch (e) {
        if (!cancelled) setError(e.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => (cancelled = true);
  }, [id]);

  const heroScreenshots = game?.screenshots?.slice(0, 10) || [];

  useEffect(() => {
    if (!heroScreenshots.length) {
      setHeroIndex(0);
      return;
    }

    heroIntervalRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroScreenshots.length);
    }, 5000);

    return () => {
      if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
    };
  }, [heroScreenshots.length]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reviews/game/${id}`, {
      credentials: "include"
    })
      .then(r => (r.ok ? r.json() : []))
      .then(j => Array.isArray(j) && setReviews(j));
  }, [id]);

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page error">{error}</div>;
  if (!game) return <div className="page">Game not found</div>;

  const heroBg =
    heroScreenshots.length > 0
      ? heroScreenshots[heroIndex]?.path_full || game.heroImage
      : game.heroImage;

  const shouldTruncate = game.description.length > 600;

  return (
    <div className="game-details-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>{game.name}</h1>
          <div className="hero-meta">
            {game.release && <span>{game.release}</span>}
            {game.metacritic && (
              <span>
                Metacritic <strong>{game.metacritic.score}</strong>
              </span>
            )}
            {game.price && (
              <span className="price">
                {game.price.final_formatted}
              </span>
            )}
          </div>
          <div className="tags">
            {game.genres.map(g => (
              <span key={g}>{g}</span>
            ))}
            {game.categories.map(c => (
              <span key={c} className="soft">
                {c}
              </span>
            ))}
          </div>
        </div>

        {heroScreenshots.length > 1 && (
          <div className="hero-dashes">
            {heroScreenshots.map((_, i) => (
              <button
                key={i}
                className={i === heroIndex ? "dash active" : "dash"}
                onClick={() => setHeroIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      <section className="section first">
        <div className="desc-wrap">
          <div
            className={`desc ${
              showFullDesc || !shouldTruncate ? "open" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: game.description }}
          />

          {!showFullDesc && shouldTruncate && (
            <div className="desc-vignette" />
          )}
        </div>

        {shouldTruncate && (
          <button
            className="toggle"
            onClick={() => setShowFullDesc(v => !v)}
          >
            {showFullDesc ? "Less" : "More"}
          </button>
        )}
      </section>

      <section className="section">
        <GameReviews
          gameId={id}
          reviews={reviews}
          setReviews={setReviews}
          owned={owned}
          setOwned={setOwned}
          myReview={myReview}
          setMyReview={setMyReview}
          currentUserId={currentUserId}
        />
      </section>

      <section className="section section-chat">
        <div className="section-inner">
          <GameChat gameId={id} />
        </div>
      </section>

      <style jsx>{`
        .game-details-container {
          background: #0b0f16;
          color: #e6edf3;
          min-height: 100vh;
        }

        .section-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-button {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 30;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 10px 18px;
          border-radius: 999px;
          cursor: pointer;
          margin-top:20px;
        }

        .hero {
          height: 560px;
          position: relative;
          display: flex;
          align-items: flex-end;
          background-size: cover;
          background-position: center;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(11, 15, 22, 1) 0%,
            rgba(11, 15, 22, 0.7) 40%,
            rgba(11, 15, 22, 0.25) 65%,
            transparent 85%
          );
        }

        .hero-content {
          position: relative;
          z-index: 2;
          padding: 0 64px 64px;
          max-width: 800px;
        }

        .hero-dashes {
          position: absolute;
          bottom: 26px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .dash {
          all: unset;
          width: 22px;
          height: 5px;
          background: rgba(255, 255, 255, 0.35);
          border-radius: 3px;
          cursor: pointer;
        }

        .dash.active {
          width: 34px;
          background: linear-gradient(90deg, #58a6ff, #79c0ff);
        }

        .section {
          padding: 48px 64px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .desc-wrap {
          position: relative;
        }

        .desc {
          line-height: 1.8;
          font-size: 16px;
          max-height: 240px;
          overflow: hidden;
          transition: max-height 0.6s ease;
        }

        .desc.open {
          max-height: 3000px;
        }

        .desc-vignette {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 120px;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            rgba(11, 15, 22, 0) 0%,
            rgba(11, 15, 22, 0.6) 40%,
            rgba(11, 15, 22, 0.85) 70%,
            rgba(11, 15, 22, 1) 100%
          );
        }

        .toggle {
          all: unset;
          margin-top: 24px;
          color: #79c0ff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
