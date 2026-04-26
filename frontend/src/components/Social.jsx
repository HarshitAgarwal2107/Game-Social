import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Social() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(null);

  const [friends, setFriends] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  /* ===========================
     LOAD FRIENDS
  =========================== */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/friends`, { credentials: "include" })
      .then(r => (r.ok ? r.json() : []))
      .then(setFriends)
      .catch(() => {});
  }, []);

  /* ===========================
     LOAD FRIEND ACTIVITY
  =========================== */
  useEffect(() => {
    setActivityLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/friends/activity`, { credentials: "include" })
      .then(r => (r.ok ? r.json() : []))
      .then(setActivity)
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, []);

  /* ===========================
     USER SEARCH
  =========================== */
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/search?username=${encodeURIComponent(query)}`,
          { credentials: "include", signal: controller.signal }
        );

        if (!res.ok) return;

        const data = await res.json();
        setResults(data);
      } catch (err) {
        if (err.name !== "AbortError") setError("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleAddFriend = async (e, userId) => {
    e.stopPropagation();
    setAdding(userId);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/add/${userId}`, {
        method: "POST",
        credentials: "include"
      });

      if (res.ok) {
        setResults(prev =>
          prev.map(u =>
            u._id === userId ? { ...u, isFriend: true } : u
          )
        );
      }
    } finally {
      setAdding(null);
    }
  };

  const openProfile = (username) => {
    navigate(`/u/${username}`);
  };

  const openActivity = (a) => {
    if (a.url) navigate(a.url);
  };

  return (
    <div className="social-container">
      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="social-input"
      />

      {/* FRIENDS */}
      {friends.length > 0 && (
        <div className="social-section">
          <div className="social-section-title">Friends</div>
          <div className="social-row">
            {friends.map(f => (
              <div
                key={f._id}
                className="social-friend-item"
                onClick={() => openProfile(f.username)}
              >
                {f.avatar && (
                  <img src={f.avatar} alt="" className="social-avatar-small" />
                )}
                @{f.username}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FRIEND ACTIVITY */}
      <div className="social-section">
        <div className="social-section-title">Friend Activity</div>

        {activityLoading && <div className="social-info">Loading activity…</div>}

        {!activityLoading && activity.length === 0 && (
          <div className="social-info">No recent activity</div>
        )}

        {activity.map(a => (
          <div
            key={a._id}
            className="social-activity-item"
            onClick={() => openActivity(a)}
          >
            <strong>{a.actorId?.displayName}</strong>{" "}
            <span>{a.text}</span>
            <div className="social-time">
              {new Date(a.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH RESULTS */}
      {loading && <p className="social-info">Searching…</p>}
      {error && <p className="social-error">{error}</p>}

      <ul className="social-list">
        {results.map(user => (
          <li
            key={user._id}
            className="social-item"
            onClick={() => openProfile(user.username)}
          >
            {user.avatar && (
              <img src={user.avatar} alt="" className="social-avatar" />
            )}

            <div className="social-item-content">
              <strong>@{user.username}</strong>
              <div className="social-sub">{user.displayName}</div>
            </div>

            {!user.isFriend && (
              <button
                className="social-add-btn"
                disabled={adding === user._id}
                onClick={(e) => handleAddFriend(e, user._id)}
              >
                +
              </button>
            )}
          </li>
        ))}
      </ul>

      <style jsx>{`
        .social-container {
          max-width: 600px;
          margin: var(--space-6) auto;
          padding: 0 var(--space-4);
        }

        .social-input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-primary);
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          font-size: var(--text-base);
          transition: all var(--transition-base);
          margin-bottom: var(--space-4);
        }

        .social-input:focus {
          border-color: var(--color-border-focus);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }

        .social-input::placeholder {
          color: var(--color-text-muted);
        }

        .social-section {
          margin-top: var(--space-4);
          padding: var(--space-5);
          background: var(--color-bg-elevated);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border-primary);
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(16px);
        }

        .social-section-title {
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          margin-bottom: var(--space-4);
        }

        .social-row {
          display: flex;
          gap: var(--space-3);
          overflow-x: auto;
          padding-bottom: var(--space-2);
        }

        .social-row::-webkit-scrollbar {
          height: 4px;
        }

        .social-friend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          white-space: nowrap;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-secondary);
          transition: all var(--transition-base);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          color: var(--color-text-primary);
        }

        .social-friend-item:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-border-focus);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .social-avatar-small {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--color-border-primary);
        }

        .social-activity-item {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border-secondary);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .social-activity-item:last-child {
          border-bottom: none;
        }

        .social-activity-item:hover {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          transform: translateX(4px);
        }

        .social-activity-item strong {
          color: var(--color-text-primary);
          font-weight: var(--weight-semibold);
        }

        .social-activity-item span {
          color: var(--color-text-secondary);
        }

        .social-time {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          margin-top: var(--space-1);
          font-weight: var(--weight-medium);
        }

        .social-list {
          list-style: none;
          padding: 0;
          margin-top: var(--space-4);
        }

        .social-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border-secondary);
          cursor: pointer;
          transition: all var(--transition-base);
          background: var(--color-bg-elevated);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-2);
        }

        .social-item:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-border-focus);
          transform: translateX(4px);
          box-shadow: var(--shadow-md);
        }

        .social-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--color-border-primary);
        }

        .social-item-content {
          flex: 1;
        }

        .social-item-content strong {
          display: block;
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .social-sub {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }

        .social-add-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: var(--color-success);
          color: white;
          font-size: var(--text-lg);
          font-weight: var(--weight-bold);
          cursor: pointer;
          transition: all var(--transition-base);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .social-add-btn:hover:not(:disabled) {
          background: #238636;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(46, 160, 67, 0.4);
        }

        .social-add-btn:active:not(:disabled) {
          transform: scale(1.05);
        }

        .social-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .social-add-btn:focus-visible {
          outline: 2px solid var(--color-border-focus);
          outline-offset: 2px;
        }

        .social-info {
          margin-top: var(--space-4);
          color: var(--color-text-tertiary);
          font-size: var(--text-sm);
          text-align: center;
          padding: var(--space-4);
        }

        .social-error {
          margin-top: var(--space-4);
          color: var(--color-error);
          font-size: var(--text-sm);
          padding: var(--space-4);
          background: var(--color-error-bg);
          border: 1px solid rgba(248, 81, 73, 0.3);
          border-radius: var(--radius-lg);
        }
      `}</style>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {};

export default Social;
