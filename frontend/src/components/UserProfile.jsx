import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VERDICTS = {
  awful_fun: { label: "A disaster, but kind of funny", emoji: "🤡", color: "#f85149" },
  subpar: { label: "Subpar slop", emoji: "🥱", color: "#d29922" },
  almost_good: { label: "Almost had something", emoji: "😬", color: "#58a6ff" },
  perfection: { label: "Perfection", emoji: "👑", color: "#2ea043" }
};

function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Profile
        const profileRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(username)}/profile`,
          { credentials: "include" }
        );
        if (!profileRes.ok) throw new Error("Profile not found");
        const profileData = await profileRes.json();
        if (cancelled) return;
        setUser(profileData);

        // 2. Fetch Library (in parallel for better perf)
        const libraryPromise = fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(username)}/library`,
          { credentials: "include" }
        ).then(res => res.ok ? res.json() : null);

        // 3. Fetch Reviews (in parallel)
        const reviewsPromise = fetch(
          `${import.meta.env.VITE_API_URL}/api/reviews/user/${encodeURIComponent(username)}`,
          { credentials: "include" }
        ).then(res => res.ok ? res.json() : []);

        const [libraryData, reviewsData] = await Promise.all([libraryPromise, reviewsPromise]);

        if (!cancelled) {
          setLibrary(libraryData);
          setReviews(reviewsData || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError("User not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return <div className="profile-center">Loading profile…</div>;
  }

  if (error) {
    return (
      <div className="profile-center">
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="profile-back">Go back</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <button onClick={() => navigate(-1)} className="profile-back">
        ← Back
      </button>

      {/* PROFILE CARD */}
      <div className="profile-card">
        <h2>@{user.username}</h2>
        <p className="profile-name">{user.displayName}</p>
        <div className="profile-stats">
          <div>
            <strong>{user.friendsCount}</strong>
            <span>Friends</span>
          </div>
        </div>
      </div>

      {/* LIBRARY */}
      <div className="profile-section">
        <h3>🎮 Game Library</h3>

        {!library?.linked && <p className="profile-muted">Library not linked</p>}
        {library?.linked && library.games?.length === 0 && <p className="profile-muted">No games found</p>}
        {library?.linked && library.games?.length > 0 && (
          <ul className="profile-game-list">
            {library.games.slice(0, 12).map((g, i) => (
              <li key={i} className="profile-game-item">
                {g.rawg?.name || g.steam?.name || "Unknown Game"}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* REVIEWS */}
      <div className="profile-section">
        <h3>📝 Reviews</h3>

        {reviews.length === 0 && <p className="profile-muted">No public reviews</p>}

        {reviews.map(r => (
          <div key={r._id} className="profile-review-card">
            <div
              className="profile-verdict"
              style={{ background: VERDICTS[r.verdict]?.color || "#666" }}
            >
              {VERDICTS[r.verdict]?.emoji || "❓"} {VERDICTS[r.verdict]?.label || "Unknown verdict"}
            </div>

            <div className="profile-meta">
              Played {r.playtimeHours ?? "?"} hrs
              {r.completed && " • Completed"}
            </div>

            <h4>{r.title || "Untitled Review"}</h4>
            {r.body && <p>{r.body}</p>}

            {(r.pros?.length > 0 || r.cons?.length > 0) && (
              <div className="profile-tag-section">
                {r.pros?.length > 0 && (
                  <div>
                    <div className="profile-tag-title">👍 Pros</div>
                    <div className="profile-tag-row">
                      {r.pros.map((p, i) => (
                        <span key={i} className="profile-pro-tag">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {r.cons?.length > 0 && (
                  <div>
                    <div className="profile-tag-title">👎 Cons</div>
                    <div className="profile-tag-row">
                      {r.cons.map((c, i) => (
                        <span key={i} className="profile-con-tag">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Your existing <style jsx> block remains unchanged */}
      <style jsx>{`
        
        .profile-container {
          max-width: 900px;
          margin: var(--space-8) auto;
          padding: 0 var(--space-5);
          color: var(--color-text-primary);
        }

        .profile-center {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          color: var(--color-text-tertiary);
          font-size: var(--text-base);
        }

        .profile-back {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          color: var(--color-accent-primary);
          cursor: pointer;
          margin-bottom: var(--space-4);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          transition: all var(--transition-base);
        }

        .profile-back:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-border-focus);
          transform: translateX(-2px);
        }

        .profile-back:focus-visible {
          outline: 2px solid var(--color-border-focus);
          outline-offset: 2px;
        }

        .profile-card {
          background: var(--color-bg-elevated);
          padding: var(--space-6);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border-primary);
          margin-bottom: var(--space-5);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(16px);
        }

        .profile-card h2 {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          margin: 0 0 var(--space-2) 0;
          color: var(--color-text-primary);
        }

        .profile-name {
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
          font-size: var(--text-base);
        }

        .profile-stats {
          display: flex;
          gap: var(--space-8);
          margin-top: var(--space-5);
        }

        .profile-stats div {
          display: flex;
          flex-direction: column;
        }

        .profile-stats strong {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          color: var(--color-text-primary);
        }

        .profile-stats span {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
        }

        .profile-section {
          background: var(--color-bg-elevated);
          padding: var(--space-6);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border-primary);
          margin-bottom: var(--space-5);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(16px);
        }

        .profile-section h3 {
          font-size: var(--text-xl);
          font-weight: var(--weight-bold);
          margin: 0 0 var(--space-5) 0;
          color: var(--color-text-primary);
        }

        .profile-muted {
          color: var(--color-text-tertiary);
          font-size: var(--text-sm);
          padding: var(--space-4);
          text-align: center;
        }

        .profile-game-list {
          list-style: none;
          padding: 0;
          margin-top: var(--space-4);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .profile-game-item {
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          transition: all var(--transition-base);
        }

        .profile-game-item:hover {
          border-color: var(--color-border-focus);
          background: var(--color-bg-tertiary);
          transform: translateY(-2px);
        }

        .profile-review-card {
          background: var(--color-bg-secondary);
          padding: var(--space-5);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border-primary);
          margin-bottom: var(--space-4);
          transition: all var(--transition-base);
        }

        .profile-review-card:hover {
          border-color: var(--color-border-focus);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .profile-verdict {
          display: inline-block;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-2);
          letter-spacing: 0.025em;
        }

        .profile-meta {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          margin: var(--space-2) 0;
          font-weight: var(--weight-medium);
        }

        .profile-review-card h4 {
          font-size: var(--text-lg);
          font-weight: var(--weight-semibold);
          margin: var(--space-3) 0 var(--space-2) 0;
          color: var(--color-text-primary);
        }

        .profile-review-card p {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: var(--space-2) 0;
        }

        .profile-tag-section {
          margin-top: var(--space-4);
        }

        .profile-tag-title {
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          color: var(--color-text-tertiary);
          margin-bottom: var(--space-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .profile-pro-tag {
          padding: var(--space-1) var(--space-3);
          background: var(--color-success-bg);
          border: 1px solid var(--color-success);
          color: var(--color-success);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-medium);
        }

        .profile-con-tag {
          padding: var(--space-1) var(--space-3);
          background: var(--color-error-bg);
          border: 1px solid var(--color-error);
          color: var(--color-error);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-medium);
        }

      `}</style>
    </div>
  );
}


      <style jsx>{`
        .profile-container {
          max-width: 900px;
          margin: var(--space-8) auto;
          padding: 0 var(--space-5);
          color: var(--color-text-primary);
        }

        .profile-center {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          color: var(--color-text-tertiary);
          font-size: var(--text-base);
        }

        .profile-back {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          color: var(--color-accent-primary);
          cursor: pointer;
          margin-bottom: var(--space-4);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          transition: all var(--transition-base);
        }

        .profile-back:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-border-focus);
          transform: translateX(-2px);
        }

        .profile-back:focus-visible {
          outline: 2px solid var(--color-border-focus);
          outline-offset: 2px;
        }

        .profile-card {
          background: var(--color-bg-elevated);
          padding: var(--space-6);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border-primary);
          margin-bottom: var(--space-5);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(16px);
        }

        .profile-card h2 {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          margin: 0 0 var(--space-2) 0;
          color: var(--color-text-primary);
        }

        .profile-name {
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
          font-size: var(--text-base);
        }

        .profile-stats {
          display: flex;
          gap: var(--space-8);
          margin-top: var(--space-5);
        }

        .profile-stats div {
          display: flex;
          flex-direction: column;
        }

        .profile-stats strong {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          color: var(--color-text-primary);
        }

        .profile-stats span {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
        }

        .profile-section {
          background: var(--color-bg-elevated);
          padding: var(--space-6);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border-primary);
          margin-bottom: var(--space-5);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(16px);
        }

        .profile-section h3 {
          font-size: var(--text-xl);
          font-weight: var(--weight-bold);
          margin: 0 0 var(--space-5) 0;
          color: var(--color-text-primary);
        }

        .profile-muted {
          color: var(--color-text-tertiary);
          font-size: var(--text-sm);
          padding: var(--space-4);
          text-align: center;
        }

        .profile-game-list {
          list-style: none;
          padding: 0;
          margin-top: var(--space-4);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .profile-game-item {
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          transition: all var(--transition-base);
        }

        .profile-game-item:hover {
          border-color: var(--color-border-focus);
          background: var(--color-bg-tertiary);
          transform: translateY(-2px);
        }

        .profile-review-card {
          background: var(--color-bg-secondary);
          padding: var(--space-5);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border-primary);
          margin-bottom: var(--space-4);
          transition: all var(--transition-base);
        }

        .profile-review-card:hover {
          border-color: var(--color-border-focus);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .profile-verdict {
          display: inline-block;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-2);
          letter-spacing: 0.025em;
        }

        .profile-meta {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          margin: var(--space-2) 0;
          font-weight: var(--weight-medium);
        }

        .profile-review-card h4 {
          font-size: var(--text-lg);
          font-weight: var(--weight-semibold);
          margin: var(--space-3) 0 var(--space-2) 0;
          color: var(--color-text-primary);
        }

        .profile-review-card p {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: var(--space-2) 0;
        }

        .profile-tag-section {
          margin-top: var(--space-4);
        }

        .profile-tag-title {
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          color: var(--color-text-tertiary);
          margin-bottom: var(--space-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .profile-pro-tag {
          padding: var(--space-1) var(--space-3);
          background: var(--color-success-bg);
          border: 1px solid var(--color-success);
          color: var(--color-success);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-medium);
        }

        .profile-con-tag {
          padding: var(--space-1) var(--space-3);
          background: var(--color-error-bg);
          border: 1px solid var(--color-error);
          color: var(--color-error);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-medium);
        }
      `}</style>

export default UserProfile;
