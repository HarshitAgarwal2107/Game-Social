import React from "react";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span className="footer-left">
          © {new Date().getFullYear()} GameVerse
        </span>
        <span className="footer-right">
          Built for gamers · Discover · Play · Connect
        </span>
      </div>

      <style jsx>{`
        .app-footer {
          width: 100%;
          padding: 28px 48px; /* ↑ increased height */
          box-sizing: border-box;
          background: linear-gradient(
            to top,
            rgba(5, 7, 12, 0.85),
            rgba(5, 7, 12, 0.55)
          );
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(148, 163, 184, 0.18);
        }

        .footer-inner {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          line-height: 1.8; /* ↑ air */
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .footer-right {
          opacity: 0.85;
        }

        @media (max-width: 768px) {
          .app-footer {
            padding: 24px 20px;
          }

          .footer-inner {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
