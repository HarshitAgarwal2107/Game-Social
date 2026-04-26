// src/components/GameReviews.jsx
import React from "react";
import ReviewComments from "./ReviewComments";
import TagSelector from "./TagSelector";
import { PRO_TAGS, CON_TAGS } from "../shared/reviewTags";
import MentionInput from "../MentionInput";

import {
  Crown,
  ThumbsDown,
  Meh,
  Sparkles,
  Heart,
  HeartOff,
  Pencil,
  Trash2,
  CheckCircle
} from "lucide-react";

const VERDICTS = {
  awful_fun: {
    label: "A disaster, but kind of funny",
    Icon: ThumbsDown,
    color: "#f85149"
  },
  subpar: {
    label: "Subpar slop",
    Icon: Meh,
    color: "#d29922"
  },
  almost_good: {
    label: "Almost had something",
    Icon: Sparkles,
    color: "#58a6ff"
  },
  perfection: {
    label: "Perfection",
    Icon: Crown,
    color: "#2ea043"
  }
};

export default function GameReviews({
  gameId,
  reviews,
  setReviews,
  owned,
  myReview,
  setMyReview,
  reviewLoading,
  currentUserId
}) {
  const [editingReviewId, setEditingReviewId] = React.useState(null);

  const isMine = r => String(r.userId) === String(currentUserId);
  const isLikedByMe = r =>
    Array.isArray(r.likes) &&
    currentUserId &&
    r.likes.some(id => String(id) === String(currentUserId));

  const submitReview = async () => {
    const isEdit = Boolean(editingReviewId);
    const url = isEdit
      ? `${import.meta.env.VITE_API_URL}/api/reviews/${editingReviewId}`
      : `${import.meta.env.VITE_API_URL}/api/reviews/${gameId}`;

    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(myReview)
    });

    const saved = await res.json();

    setReviews(prev =>
      isEdit
        ? prev.map(r => (r._id === saved._id ? saved : r))
        : [saved, ...prev]
    );

    setEditingReviewId(null);
    setMyReview({});
  };

  return (
    <div className="review-section">
      <h2>Community Reviews</h2>

      <div className="review-count">
        {reviews.length} community review{reviews.length !== 1 && "s"}
      </div>

      <div className="review-list">
        {reviews.map(r => {
          const V = VERDICTS[r.verdict];
          const VerdictIcon = V.Icon;

          return (
            <div key={r._id} className="review-card">
              <div className="verdict-pill" style={{ color: V.color }}>
                <VerdictIcon size={14} />
                {V.label}
              </div>

              <div className="review-meta">
                Played {r.playtimeHours ?? "?"} hrs
                {r.completed && (
                  <>
                    {" "}
                    • <CheckCircle size={12} /> Completed
                  </>
                )}
              </div>

              {r.title && <h4>{r.title}</h4>}
              {r.body && <p>{r.body}</p>}

              <button
                className={`like-btn ${isLikedByMe(r) ? "liked" : ""}`}
                onClick={async () => {
                  const liked = isLikedByMe(r);

                  await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reviews/${r._id}/${liked ? "unlike" : "like"}`,
                    { method: "POST", credentials: "include" }
                  );

                  setReviews(prev =>
                    prev.map(rv =>
                      rv._id === r._id
                        ? {
                            ...rv,
                            likes: liked
                              ? rv.likes.filter(
                                  id =>
                                    String(id) !== String(currentUserId)
                                )
                              : [...(rv.likes || []), currentUserId]
                          }
                        : rv
                    )
                  );
                }}
              >
                {isLikedByMe(r) ? (
                  <>
                    <HeartOff size={14} /> Unlike
                  </>
                ) : (
                  <>
                    <Heart size={14} /> Like
                  </>
                )}
                <span className="like-count">{r.likes.length}</span>
              </button>

              {isMine(r) && (
                <div className="review-actions">
                  <button
                    onClick={() => {
                      setEditingReviewId(r._id);
                      setMyReview({
                        title: r.title || "",
                        body: r.body || "",
                        pros: r.pros || [],
                        cons: r.cons || [],
                        verdict: r.verdict,
                        completed: r.completed || false
                      });
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this review?")) return;

                      await fetch(
                        `${import.meta.env.VITE_API_URL}/api/reviews/${r._id}`,
                        { method: "DELETE", credentials: "include" }
                      );

                      setReviews(prev =>
                        prev.filter(rv => rv._id !== r._id)
                      );
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}

              <ReviewComments
                reviewId={r._id}
                currentUserId={currentUserId}
              />
            </div>
          );
        })}
      </div>

      {owned && (
        <div className="write-review">
          <h3>{editingReviewId ? "Edit your review" : "Write your review"}</h3>

          <MentionInput
            value={myReview.title || ""}
            onChange={v => setMyReview({ ...myReview, title: v })}
            placeholder="Title (optional)"
            rows={1}
          />

          <MentionInput
            value={myReview.body || ""}
            onChange={v => setMyReview({ ...myReview, body: v })}
            placeholder="Your thoughts..."
            rows={4}
          />

          <TagSelector
            tags={PRO_TAGS}
            selected={myReview.pros || []}
            onChange={v => setMyReview({ ...myReview, pros: v })}
          />

          <TagSelector
            tags={CON_TAGS}
            selected={myReview.cons || []}
            onChange={v => setMyReview({ ...myReview, cons: v })}
          />

          <div className="verdict-picker">
            {Object.entries(VERDICTS).map(([key, v]) => {
              const Icon = v.Icon;
              return (
                <button
                  key={key}
                  onClick={() =>
                    setMyReview({ ...myReview, verdict: key })
                  }
                  className={myReview.verdict === key ? "active" : ""}
                  style={{ color: v.color }}
                >
                  <Icon size={16} />
                  {v.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={submitReview}
            disabled={reviewLoading || !myReview.verdict}
          >
            {editingReviewId ? "Update Review" : "Submit Review"}
          </button>

          {editingReviewId && (
            <button
              onClick={() => {
                setEditingReviewId(null);
                setMyReview({});
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        :root {
          --glass-bg: rgba(255,255,255,0.04);
          --glass-border: rgba(255,255,255,0.12);
          --blur: blur(14px);
        }

        .review-section {
          margin-top: 48px;
        }

        .review-section h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .review-count {
          font-size: 13px;
          opacity: 0.6;
          margin-bottom: 20px;
        }

        .review-list {
          display: grid;
          gap: 20px;
        }

        .review-card {
          background: var(--glass-bg);
          backdrop-filter: var(--blur);
          border: 1px solid var(--glass-border);
          border-radius: 28px;
          padding: 24px;
          transition: all 0.25s ease;
        }

        .review-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.35);
        }

        .verdict-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.25),
            rgba(255,255,255,0.05)
          );
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(6px);
          margin-bottom: 6px;
        }

        .review-meta {
          font-size: 11px;
          opacity: 0.6;
          margin-bottom: 10px;
        }

        .review-card h4 {
          font-size: 18px;
          margin: 10px 0 6px;
        }

        .review-card p {
          opacity: 0.85;
          line-height: 1.65;
        }

        .like-btn {
          margin-top: 12px;
          background: transparent;
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
        }

        .like-btn.liked {
          background: rgba(248,81,73,0.15);
          border-color: rgba(248,81,73,0.6);
          color: #f85149;
        }

        .review-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .review-actions button {
          background: transparent;
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
        }

        .write-review {
          margin-top: 40px;
          background: var(--glass-bg);
          backdrop-filter: var(--blur);
          border: 1px solid var(--glass-border);
          border-radius: 32px;
          padding: 28px;
        }

        .write-review h3 {
          font-size: 22px;
          margin-bottom: 20px;
        }

        .verdict-picker {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 20px 0 28px;
        }

        .verdict-picker button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 52px;
          padding: 0 22px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          white-space: nowrap;
        }

        .verdict-picker svg {
          flex-shrink: 0;
          stroke-width: 2.2;
        }

        .verdict-picker button.active {
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.18),
            rgba(255,255,255,0.06)
          );
          border-color: currentColor;
          box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 40%, transparent);
          color: white;
        }

        .write-review button:not(.verdict-picker button) {
          background: linear-gradient(
            135deg,
            rgba(46,160,67,0.9),
            rgba(46,160,67,0.6)
          );
          border: none;
          border-radius: 999px;
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          margin-right: 10px;
        }

        .write-review button:disabled {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  );
}
