import React from "react";

export default function CommentItem({
  comment,
  onReply,
  onToggleLike,
  onEdit,
  onDelete,
  depth = 0,
  currentUserId
}) {
  const isMine =
    String(comment.userId?._id || comment.userId) === String(currentUserId);

  const liked =
    Array.isArray(comment.likes) &&
    currentUserId &&
    comment.likes.some(id => String(id) === String(currentUserId));

  return (
    <div className="comment" style={{ marginLeft: depth * 20 }}>
      <div className="comment-meta">
        <strong>{comment.userId?.displayName || "User"}</strong>
        {comment.edited && <span className="edited"> • edited</span>}
      </div>

      <div className="comment-body">{comment.body}</div>

      <div className="comment-actions">
        <button type="button" onClick={() => onReply(comment._id)}>
          Reply
        </button>

        <button
          type="button"
          className={`like-btn ${liked ? "liked" : ""}`}
          onClick={() => onToggleLike(comment._id)}
        >
          {liked ? "💔 Unlike" : "❤️ Like"} {comment.likes?.length || 0}
        </button>

        {isMine && (
          <>
            <button type="button" onClick={() => onEdit(comment)}>
              ✏️ Edit
            </button>

            <button
              type="button"
              className="danger"
              onClick={() => onDelete(comment._id)}
            >
              🗑 Delete
            </button>
          </>
        )}
      </div>

      {comment.replies?.map(r => (
        <CommentItem
          key={r._id}
          comment={r}
          onReply={onReply}
          onToggleLike={onToggleLike}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth + 1}
          currentUserId={currentUserId}
        />
      ))}

<style jsx>{`
  :root {
    --glass-bg: rgba(255,255,255,0.04);
    --glass-bg-strong: rgba(255,255,255,0.08);
    --glass-border: rgba(255,255,255,0.12);
    --glass-hover: rgba(255,255,255,0.12);
    --blur: blur(12px);
  }

  /* ================= COMMENT CARD ================= */

  .comment {
    margin-top: 14px;
    padding: 16px;
    background: var(--glass-bg);
    backdrop-filter: var(--blur);
    border: 1px solid var(--glass-border);
    border-radius: 22px;
    transition: all 0.25s ease;
  }

  .comment:hover {
    background: var(--glass-hover);
    transform: translateY(-1px);
    box-shadow: 0 10px 32px rgba(0,0,0,0.25);
  }

  /* ================= META ================= */

  .comment-meta {
    font-size: 13px;
    opacity: 0.7;
    margin-bottom: 6px;
  }

  .comment-meta strong {
    color: white;
    font-weight: 600;
  }

  .edited {
    font-size: 11px;
    opacity: 0.5;
    margin-left: 6px;
  }

  /* ================= BODY ================= */

  .comment-body {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255,255,255,0.85);
    margin: 10px 0;
  }

  /* ================= ACTIONS ================= */

  .comment-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  button {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: rgba(255,255,255,0.85);
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    backdrop-filter: blur(6px);
    transition: all 0.2s ease;
  }

  button:hover {
    background: var(--glass-hover);
    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(0);
  }

  button:focus-visible {
    outline: 2px solid rgba(96,165,250,0.6);
    outline-offset: 2px;
  }

  /* ================= LIKE ================= */

  .like-btn.liked {
    background: rgba(248,81,73,0.15);
    border-color: rgba(248,81,73,0.6);
    color: #f85149;
  }

  .like-btn.liked:hover {
    background: rgba(248,81,73,0.25);
  }

  /* ================= DELETE ================= */

  .danger {
    border-color: rgba(248,81,73,0.6);
    color: #f85149;
  }

  .danger:hover {
    background: rgba(248,81,73,0.15);
  }
`}</style>

    </div>
  );
}
