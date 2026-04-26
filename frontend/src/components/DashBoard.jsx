import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    username: ""
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setUser(data);
        setForm({
          displayName: data.displayName || "",
          username: data.username || ""
        });
      })
      .catch(() =>
        setError("Failed to load user. Please try logging in again.")
      );
  }, []);

  const handleLogout = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/logout`,
      { method: "POST", credentials: "include" }
    );
    if (res.ok) window.location.href = "/";
    else setError("Logout failed");
  };

  const handleConnect = provider => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form)
        }
      );

      if (!res.ok) throw new Error();
      const updated = await res.json();
      setUser(updated);
      setEditing(false);
    } catch {
      setError("Profile update failed");
    }
  };

  const isConnected = provider =>
    user?.linkedAccounts?.some(a => a.provider === provider);

  return (
    <div className="dash-root">
      <div className="dash-header">
        <div>
          <h1>Profile</h1>
          <p>Your profile & linked gaming accounts</p>
        </div>

        <div className="header-actions">
          <button
            className="connect-btn"
            onClick={() => setEditing(v => !v)}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {!user ? (
        <div className="dash-loading">Loading profile…</div>
      ) : (
        <div className="dash-grid">
          <section className="dash-card profile-card">
            <div className="profile-main">
              <div className="avatar-glow">
                {user.displayName?.[0] || "U"}
              </div>

              <div className="profile-info">
                {editing ? (
                  <>
                    <input
                      className="profile-input"
                      value={form.displayName}
                      onChange={e =>
                        setForm({ ...form, displayName: e.target.value })
                      }
                      placeholder="Display name"
                    />
                    <input
                      className="profile-input"
                      value={form.username}
                      onChange={e =>
                        setForm({ ...form, username: e.target.value })
                      }
                      placeholder="Username"
                    />
                    <button
                      className="connect-btn save-btn"
                      onClick={handleSave}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <h2>{user.displayName}</h2>
                    <span>{user.username}</span>
                    <span>{user.email}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="dash-card accounts-card">
            <h3>Connected Accounts</h3>

            <div className="accounts-list">
              {["google", "steam", "epic", "riot"].map(p => (
                <div key={p} className="account-row">
                  <span className="provider">{p}</span>
                  {isConnected(p) ? (
                    <span className="status connected">Connected</span>
                  ) : (
                    <button
                      className="connect-btn"
                      onClick={() => handleConnect(p)}
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

<style jsx>{`
:root {
  --glass-bg: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.12);
  --glass-hover: rgba(255,255,255,0.12);
  --blur: blur(14px);
}

.dash-root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  color: #e6edf3;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
  gap: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.dash-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 28px;
}

.dash-card {
  background: var(--glass-bg);
  backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: 28px;
  padding: 28px;
  transition: 0.25s;
}

.dash-card:hover {
  background: var(--glass-hover);
  transform: translateY(-2px);
}

.profile-main {
  display: flex;
  gap: 18px;
  align-items: center;
}

.avatar-glow {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  background: radial-gradient(
    circle at top,
    rgba(124,247,255,0.95),
    rgba(96,165,250,0.55)
  );
  color: #020617;
}

.profile-info h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.profile-info span {
  display: block;
  font-size: 13px;
  opacity: 0.65;
}

.profile-input {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 8px;
  border-radius: 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  color: #e6edf3;
}

.profile-input:focus {
  outline: none;
  border-color: #7cf7ff;
}

.accounts-card h3 {
  margin-bottom: 18px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.account-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  margin-bottom: 12px;
}

.status.connected {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(124,247,255,0.15);
  color: #7cf7ff;
}

.connect-btn {
  padding: 6px 16px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid rgba(124,247,255,0.6);
  background: rgba(124,247,255,0.14);
  color: #e0f2fe;
  cursor: pointer;
}

.save-btn {
  margin-top: 8px;
}

.logout-btn {
  padding: 8px 20px;
  border-radius: 999px;
  border: 1px solid rgba(248,113,113,0.55);
  background: rgba(248,113,113,0.18);
  color: #fecaca;
}

.dash-loading {
  padding: 64px;
  text-align: center;
  opacity: 0.6;
}

.dash-error {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(248,81,73,0.12);
  color: #f85149;
}

@media (max-width: 900px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}
`}</style>
    </div>
  );
}
