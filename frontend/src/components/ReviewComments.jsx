import React, { useEffect, useState } from "react";
import CommentItem from "./CommentItem";
import MentionInput from "../MentionInput";

function updateLikesRecursive(list, commentId, userId, liked) {
  return list.map(c => {
    if (String(c._id) === String(commentId)) {
      return {
        ...c,
        likes: liked
          ? [...(c.likes || []), userId]
          : (c.likes || []).filter(id => String(id) !== String(userId))
      };
    }
    if (c.replies?.length) {
      return { ...c, replies: updateLikesRecursive(c.replies, commentId, userId, liked) };
    }
    return c;
  });
}

function updateCommentRecursive(list, id, body) {
  return list.map(c => {
    if (String(c._id) === String(id)) {
      return { ...c, body, edited: true };
    }
    if (c.replies?.length) {
      return { ...c, replies: updateCommentRecursive(c.replies, id, body) };
    }
    return c;
  });
}

function deleteCommentRecursive(list, id) {
  return list
    .filter(c => String(c._id) !== String(id))
    .map(c =>
      c.replies ? { ...c, replies: deleteCommentRecursive(c.replies, id) } : c
    );
}

function buildTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c._id] = { ...c, replies: [] };
  });

  comments.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c._id]);
    } else {
      roots.push(map[c._id]);
    }
  });

  return roots;
}

export default function ReviewComments({ reviewId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}/comments`, { credentials: "include" })
      .then(r => r.json())
      .then(setComments)
      .catch(() => {});
  }, [reviewId]);

  async function toggleLike(commentId) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/comments/${commentId}/like`, {
      method: "POST",
      credentials: "include"
    });
    const json = await res.json();
    if (typeof json.liked !== "boolean") return;

    setComments(prev =>
      updateLikesRecursive(prev, commentId, currentUserId, json.liked)
    );
  }

  async function submitEdit() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/comments/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: editText })
    });

    const updated = await res.json();

    setComments(prev =>
      updateCommentRecursive(prev, updated._id, updated.body)
    );

    setEditingId(null);
    setEditText("");
  }

  async function deleteComment(id) {
    if (!window.confirm("Delete this comment and its replies?")) return;

    await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/comments/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    setComments(prev => deleteCommentRecursive(prev, id));
  }

  async function submit() {
    if (!text.trim()) return;

    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: text, parentId: replyTo })
    });

    const saved = await res.json();
    setComments(prev => [...prev, saved]);
    setText("");
    setReplyTo(null);
    setLoading(false);
  }

  const tree = buildTree(comments);

  return (
    <div className="review-comments">
      {tree.map(c => (
        <CommentItem
          key={c._id}
          comment={c}
          onReply={setReplyTo}
          onToggleLike={toggleLike}
          onEdit={(comment) => {
            setEditingId(comment._id);
            setEditText(comment.body);
          }}
          onDelete={deleteComment}
          currentUserId={currentUserId}
        />
      ))}

      {editingId && (
        <>
          <MentionInput value={editText} onChange={setEditText} rows={3} />
          <button onClick={submitEdit}>Update</button>
          <button onClick={() => setEditingId(null)}>Cancel</button>
        </>
      )}

      <MentionInput
        value={text}
        onChange={setText}
        placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
        rows={3}
      />

      <button onClick={submit} disabled={loading}>
        {replyTo ? "Reply" : "Comment"}
      </button>
    
<style jsx>{`
  :root {
    --glass-bg: rgba(255,255,255,0.04);
    --glass-bg-strong: rgba(255,255,255,0.08);
    --glass-border: rgba(255,255,255,0.12);
    --glass-hover: rgba(255,255,255,0.12);
    --blur: blur(12px);
  }

  /* ================= CONTAINER ================= */

  .review-comments {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  /* ================= TEXTAREA / INPUT ================= */

  textarea {
    width: 100%;
    margin-top: 14px;
    background: rgba(255,255,255,0.03);
    color: white;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    padding: 12px 16px;
    font-size: 14px;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
    backdrop-filter: blur(6px);
    transition: all 0.2s ease;
  }

  textarea::placeholder {
    color: rgba(255,255,255,0.4);
  }

  textarea:focus {
    outline: none;
    background: rgba(255,255,255,0.06);
    border-color: rgba(96,165,250,0.6);
    box-shadow: 0 0 0 2px rgba(96,165,250,0.15);
  }

  /* ================= BUTTONS ================= */

  button {
    margin-top: 12px;
    margin-right: 10px;
    background: linear-gradient(
      135deg,
      rgba(46,160,67,0.9),
      rgba(46,160,67,0.6)
    );
    border: none;
    color: white;
    padding: 8px 20px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(6px);
    transition: all 0.2s ease;
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(46,160,67,0.35);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4);
    cursor: not-allowed;
    box-shadow: none;
  }

  button:focus-visible {
    outline: 2px solid rgba(96,165,250,0.6);
    outline-offset: 2px;
  }

  /* ================= EDIT MODE BUTTONS ================= */

  button:nth-of-type(2) {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: rgba(255,255,255,0.85);
  }

  button:nth-of-type(2):hover:not(:disabled) {
    background: var(--glass-hover);
    box-shadow: none;
  }
`}</style>

    </div>
  );
}
