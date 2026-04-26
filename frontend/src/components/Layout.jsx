import React from "react";
import { Outlet } from "react-router-dom";
import SidebarLeft from "./SidebarLeft";
import SidebarRight from "./SidebarRight";
import Footer from "./Footer";

export default function Layout() {
  return (
    <>
      <div className="aurora-bg" />

      <div className="left-float-zone">
        <div className="left-hover-tint" />
        <aside className="sidebar-left">
          <SidebarLeft />
        </aside>
      </div>

      <main className="main-content">
        <div className="main-scrollable">
          <Outlet />
        </div>
      </main>

      <aside className="sidebar-right">
        <SidebarRight />
      </aside>

      <style jsx>{`
        html,
        body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          background: #05070c;
        }

        .aurora-bg {
          position: fixed;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(55% 38% at 12% 18%, rgba(80, 190, 255, 0.32), transparent 60%),
            radial-gradient(48% 34% at 78% 12%, rgba(120, 110, 255, 0.30), transparent 58%),
            radial-gradient(42% 30% at 28% 82%, rgba(60, 230, 150, 0.24), transparent 58%),
            radial-gradient(38% 28% at 88% 72%, rgba(200, 120, 255, 0.26), transparent 56%),
            radial-gradient(30% 22% at 50% 50%, rgba(120, 160, 255, 0.12), transparent 60%);
          filter: blur(70px) saturate(120%) brightness(1.08);
        }

        .left-float-zone {
          position: fixed;
          top: 0;
          left: 0;
          width: 420px;
          height: 100vh;
          z-index: 50;
          pointer-events: none;
        }

        .left-hover-tint {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.55) 0%,
            rgba(0, 0, 0, 0.35) 25%,
            rgba(0, 0, 0, 0.18) 50%,
            rgba(0, 0, 0, 0.08) 70%,
            rgba(0, 0, 0, 0) 100%
          );
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .left-float-zone:hover .left-hover-tint {
          opacity: 1;
        }

        .sidebar-left {
          position: absolute;
          top: 0;
          left: 0;
          width: 320px;
          height: 100%;
          pointer-events: none;
        }

        .sidebar-left :global(*) {
          pointer-events: auto;
        }

        .sidebar-right {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          z-index: 50;
          pointer-events: none;
        }

        .sidebar-right :global(*) {
          pointer-events: auto;
        }

        .main-content {
          position: fixed;
          inset: 0;
          z-index: 10;
          background: transparent;
          overflow: hidden;
        }

        .main-scrollable {
          height: 100vh;
          overflow-y: auto;
          padding: 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .main-scrollable::-webkit-scrollbar {
          width: 8px;
        }

        .main-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .sidebar-right {
            display: none;
          }

          .left-float-zone {
            width: 100%;
          }

          .main-scrollable {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
