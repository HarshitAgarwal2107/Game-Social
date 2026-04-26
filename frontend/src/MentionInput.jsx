import React, { useState, useEffect, useRef } from "react";

export default function MentionInput({
  value,
  onChange,
  placeholder,
  rows = 3
}) {
  const [query, setQuery] = useState(null);
  const [results, setResults] = useState([]);
  const [cursor, setCursor] = useState(0);
  const ref = useRef();

  useEffect(() => {
    if (!query) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/users/search?username=${query}`, {
      credentials: "include"
    })
      .then(r => r.ok ? r.json() : [])
      .then(setResults);
  }, [query]);

  const handleChange = (e) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;

    setCursor(pos);
    onChange(text);

    const slice = text.slice(0, pos);
    const match = slice.match(/@([a-zA-Z0-9_]*)$/);

    setQuery(match ? match[1] : null);
  };

  const insertMention = (username) => {
    const before = value.slice(0, cursor).replace(/@[\w]*$/, `@${username} `);
    const after = value.slice(cursor);
    onChange(before + after);
    setQuery(null);
    setResults([]);
    ref.current.focus();
  };

  return (
    <div className="mention-container">
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className="mention-textarea"
      />

      {query && results.length > 0 && (
        <div className="mention-dropdown">
          {results.map(u => (
            <div
              key={u._id}
              className="mention-item"
              onMouseDown={() => insertMention(u.username)}
            >
              @{u.username}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

      <style jsx>{`
        .mention-container {
          position: relative;
        }

        .mention-textarea {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          font-family: inherit;
          line-height: var(--leading-relaxed);
          transition: all var(--transition-base);
          resize: vertical;
        }

        .mention-textarea:focus {
          border-color: var(--color-border-focus);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }

        .mention-textarea::placeholder {
          color: var(--color-text-muted);
        }

        .mention-dropdown {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-primary);
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          z-index: 50;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          backdrop-filter: blur(20px);
          margin-bottom: var(--space-2);
        }

        .mention-item {
          padding: var(--space-3) var(--space-4);
          cursor: pointer;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          transition: all var(--transition-base);
          border-bottom: 1px solid var(--color-border-secondary);
        }

        .mention-item:last-child {
          border-bottom: none;
        }

        .mention-item:hover {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .mention-item:active {
          background: var(--color-bg-secondary);
        }
      `}</style>
