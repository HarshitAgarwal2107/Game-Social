import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
// import { useVoiceChat } from "../hooks/useVoiceChat";  // ← Commented out

const POLL_INTERVAL = 8000;
const SIDEBAR_WIDTH = 220;   // ↓ narrower
const HANDLE_WIDTH = 32;     // ↓ slimmer handle

export default function SidebarRight() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const lastIdsRef = useRef([]);
  
  // Game page detection
  const isGamePage = location.pathname.startsWith("/game/");
  const gameId = isGamePage ? params.id : null;
  const [gameName, setGameName] = useState(null);
  
  // Auth and Socket
  const {
    currentUser,
    isAuthenticated,
    authChecked,
    requireLogin,
  } = useAuth();
  
  const { socket, connected } = useSocket(
    authChecked,
    isAuthenticated,
    currentUser
  );
  
  // // Voice Chat (fully commented out)
  // const {
  //   joined: voiceJoined,
  //   micOn,
  //   participants,
  //   join: joinVoice,
  //   leave: leaveVoice,
  //   toggleMic,
  // } = useVoiceChat(socket, gameId, currentUser, requireLogin);
  
  // Fetch game name when on game page
  useEffect(() => {
    if (!isGamePage || !gameId) {
      setGameName(null);
      return;
    }
    
    let cancelled = false;
    
    async function fetchGameName() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gameLookup/${gameId}`);
        if (!res.ok) return;
        const game = await res.json();
        if (!cancelled && game?.name) {
          setGameName(game.name);
        }
      } catch (err) {
        console.error("Failed to fetch game name", err);
      }
    }
    
    fetchGameName();
    return () => { cancelled = true; };
  }, [isGamePage, gameId]);

  async function fetchNotifications() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        credentials: "include"
      });
      if (!res.ok) return;

      const data = await res.json();
      const newIds = data.map(n => n._id);

      const changed =
        newIds.length !== lastIdsRef.current.length ||
        newIds.some((id, i) => id !== lastIdsRef.current[i]);

      if (changed) {
        lastIdsRef.current = newIds;
        setNotifications(data);
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  async function openNotification(n) {
    await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${n._id}/read`, {
      method: "POST",
      credentials: "include"
    });
    navigate(n.url);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <aside className={`right-sidebar ${open ? "open" : ""}`}>
      {/* Toggle handle */}
      <div className="toggle" onClick={() => setOpen(o => !o)}>
        {open ? "→" : "←"}
      </div>

      {/* Panel */}
      <div className="panel">
        <div className="header">
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>

        {notifications.length === 0 && (
          <div className="empty">No notifications</div>
        )}

        {notifications.map(n => (
          <div
            key={n._id}
            className={`notification ${n.read ? "read" : "unread"}`}
            onClick={() => openNotification(n)}
          >
            <div className="text">{n.text}</div>
            <div className="time">
              {new Date(n.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {/* Voice Chat Section (fully commented out) */}
        {/* {isGamePage && gameId && (
          <div className="voice-section">
            <div className="voice-header">
              <h3>Voice Chat</h3>
            </div>
            <div className="voice-game-name">{gameName || "Loading..."}</div>
            
            {!voiceJoined ? (
              <button
                onClick={joinVoice}
                disabled={!isAuthenticated || !socket || !connected}
                className="voice-btn voice-btn-join"
              >
                Join Voice
              </button>
            ) : (
              <>
                <button
                  onClick={leaveVoice}
                  className="voice-btn voice-btn-leave"
                >
                  Leave Voice
                </button>
                <button
                  onClick={toggleMic}
                  className={`voice-btn voice-btn-mic ${micOn ? "on" : "off"}`}
                >
                  {micOn ? "Mic On" : "Mic Off"}
                </button>
                
                {participants.length > 0 && (
                  <div className="voice-participants">
                    <div className="voice-participants-title">
                      Participants ({participants.length})
                    </div>
                    {participants.map((p) => {
                      const isYou = p.socketId === socket?.id;
                      return (
                        <div
                          key={p.socketId}
                          className={`voice-participant ${p.speaking ? "speaking" : ""}`}
                        >
                          <div className="voice-participant-info">
                            <div className="voice-avatar">
                              {p.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="voice-participant-name">
                              {p.name}
                              {isYou && <span className="voice-you"> (You)</span>}
                            </div>
                          </div>
                          <div className="voice-participant-status">
                            {p.muted
                              ? "Muted"
                              : p.speaking
                              ? "Speaking"
                              : "Listening"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )} */}
      </div>

      <style jsx>{`
        .right-sidebar {
          position: fixed;
          top: 0;
          right: -${SIDEBAR_WIDTH}px;
          height: 100vh;
          width: ${SIDEBAR_WIDTH + HANDLE_WIDTH}px;
          display: flex;
          z-index: 60;
          transition: right 0.28s ease;
          pointer-events: auto;
        }

        .right-sidebar.open {
          right: 0;
        }

        /* Toggle handle */
        .toggle {
          width: ${HANDLE_WIDTH}px;
          height: 100%;
          background: rgba(15, 23, 42, 0.95);
          color: #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          user-select: none;
          box-shadow: -3px 0 10px rgba(0,0,0,0.45);
        }

        /* Panel */
        .panel {
          width: ${SIDEBAR_WIDTH}px;
          background: #020617;
          border-left: 1px solid #1e293b;
          padding: 10px;
          overflow-y: auto;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #e5e7eb;
        }

        .badge {
          background: #ef4444;
          color: white;
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 11px;
          font-weight: 600;
        }

        /* Notification card */
        .notification {
          position: relative;
          padding: 8px 8px 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 6px;
          background: #020617;
          transition: background 0.15s ease;
        }

        .notification.unread {
          background: #0b1220;
        }

        .notification.unread::before {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 2px;
          background: #60a5fa;
        }

        .notification.read {
          opacity: 0.55;
        }

        .notification:hover {
          background: #1e293b;
        }

        .text {
          font-size: 13px;
          color: #e5e7eb;
          line-height: 1.35;
        }

        .time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .empty {
          color: #64748b;
          margin-top: 12px;
          font-size: 13px;
        }
        
        /* Voice Chat styles removed since feature is disabled */
      `}</style>
    </aside>
  );
}