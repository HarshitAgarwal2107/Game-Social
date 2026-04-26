// src/components/GameChat.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useTextChat } from "../hooks/useTextChat";

export default function GameChat({ gameId }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const {
    currentUser,
    isAuthenticated,
    authChecked,
    loginPrompt,
    setLoginPrompt,
    requireLogin
  } = useAuth();

  const { socket, connected } = useSocket(
    authChecked,
    isAuthenticated,
    currentUser
  );

  const roomTextId = `game:${gameId}`;

  const {
    joined,
    messages,
    input,
    setInput,
    join,
    leave,
    send
  } = useTextChat(socket, connected, roomTextId, currentUser, requireLogin);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="gc-wrap">
      {loginPrompt && (
        <div className="gc-login">
          <span>{loginPrompt}</span>
          <button onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => setLoginPrompt(null)} className="ghost">
            Dismiss
          </button>
        </div>
      )}

      <div className="gc-header">
        <h2>Community Chat</h2>

        {!joined ? (
          <button
            onClick={join}
            disabled={!isAuthenticated || !connected}
            className="primary"
          >
            {connected ? "Join Chat" : "Connecting…"}
          </button>
        ) : (
          <button onClick={leave} className="secondary">
            Leave
          </button>
        )}
      </div>

      {joined && (
        <div className="gc-panel">
          <div className="gc-messages">
            {messages.length === 0 && (
              <div className="gc-empty">
                Be the first to say something
              </div>
            )}

            {messages.map((m, i) => {
              const mine = m.from === currentUser?.username;
              return (
                <div
                  key={m.ts + i}
                  className={`gc-msg ${mine ? "mine" : ""}`}
                >
                  <div className="author">{m.from}</div>
                  <div className="bubble">{m.text}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="gc-input-bar"
            onSubmit={e => {
              e.preventDefault();
              send(e);
            }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message the community…"
              maxLength={500}
            />
            <button disabled={!input.trim()}>Send</button>
          </form>
        </div>
      )}

      <style jsx>{`
        .gc-wrap {
          width: 100%;
        }

        /* ─── login prompt ─── */
        .gc-login {
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: center;
          background: rgba(255, 196, 0, 0.08);
          border: 1px solid rgba(255, 196, 0, 0.25);
          padding: 14px 20px;
          border-radius: 16px;
          margin-bottom: 28px;
          color: #ffd66b;
          font-size: 14px;
        }

        .gc-login button {
          all: unset;
          cursor: pointer;
          color: #79c0ff;
        }

        .gc-login .ghost {
          opacity: 0.6;
        }

        /* ─── header ─── */
        .gc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .gc-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
        }

        .gc-header button {
          all: unset;
          cursor: pointer;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 14px;
          transition: all 0.25s ease;
        }

        .gc-header .primary {
          background: linear-gradient(90deg, #58a6ff, #79c0ff);
          color: #06101d;
          font-weight: 600;
        }

        .gc-header .primary:hover {
          box-shadow: 0 8px 28px rgba(88, 166, 255, 0.45);
          transform: translateY(-1px);
        }

        .gc-header .secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* ─── panel ─── */
        .gc-panel {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }

        .gc-messages {
          padding: 24px;
          height: 420px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .gc-empty {
          margin: auto;
          opacity: 0.5;
          font-size: 14px;
        }

        /* ─── messages ─── */
        .gc-msg {
          max-width: 70%;
        }

        .gc-msg.mine {
          align-self: flex-end;
          text-align: right;
        }

        .gc-msg .author {
          font-size: 12px;
          opacity: 0.6;
          margin-bottom: 4px;
        }

        .gc-msg .bubble {
          background: rgba(255, 255, 255, 0.08);
          padding: 12px 16px;
          border-radius: 16px;
          line-height: 1.45;
          font-size: 14px;
        }

        .gc-msg.mine .bubble {
          background: linear-gradient(
            135deg,
            rgba(88, 166, 255, 0.9),
            rgba(121, 192, 255, 0.9)
          );
          color: #06101d;
        }

        /* ─── input bar (IMPROVED) ─── */
        .gc-input-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.35),
            rgba(0, 0, 0, 0.55)
          );
        }

        .gc-input-bar input {
          flex: 1;
          all: unset;
          padding: 14px 18px;
          border-radius: 999px;
          font-size: 14px;
          line-height: 1.4;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #e6edf3;
          transition: all 0.25s ease;
        }

        .gc-input-bar input::placeholder {
          color: rgba(230, 237, 243, 0.45);
        }

        .gc-input-bar input:focus {
          border-color: rgba(121, 192, 255, 0.8);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(121, 192, 255, 0.18);
        }

        .gc-input-bar button {
          all: unset;
          cursor: pointer;
          padding: 12px 22px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          background: linear-gradient(135deg, #58a6ff, #79c0ff);
          color: #06101d;
          transition: all 0.25s ease;
        }

        .gc-input-bar button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(88, 166, 255, 0.45);
        }

        .gc-input-bar button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .gc-input-bar button:disabled {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.4);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
