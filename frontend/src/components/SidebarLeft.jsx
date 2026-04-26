import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  LogIn,
  Library,
  MessageSquare
} from "lucide-react";

export default function SidebarLeft() {
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
      credentials: "include"
    })
      .then(r => (r.ok ? r.json() : null))
      .then(user => setAuthenticated(Boolean(user)))
      .catch(() => {});
  }, []);

  const links = [
    { to: "/", label: "Home", icon: Home },
    authenticated
      ? { to: "/dashboard", label: "Profile", icon: LayoutDashboard }
      : { to: "/login", label: "Login", icon: LogIn },
    { to: "/library", label: "Library", icon: Library },
    { to: "/social", label: "Social", icon: MessageSquare }
  ];

  return (
    <div className="hover-rail">
      <div className="brand-vertical" onClick={() => navigate("/")}>
        GAMESOCIAL
      </div>

      {links.map(l => (
        <NavLink key={l.to} to={l.to} className="hover-btn">
          <span className="icon">
            <l.icon size={18} strokeWidth={1.75} />
          </span>
          <span className="label">{l.label}</span>
        </NavLink>
      ))}

      <style jsx>{`
        .hover-rail {
          position: fixed;
          left: 12px;
          top: 45%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
          pointer-events: auto;
        }

        .brand-vertical {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 16px;
          letter-spacing: 0.55em;
          font-weight: 900;
          color: #f1f5ff;
          text-shadow:
            0 0 10px rgba(120, 180, 255, 0.55),
            0 0 24px rgba(120, 180, 255, 0.35);
          margin-bottom: 46px;
          cursor: pointer;
          user-select: none;
        }

        .hover-btn {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(20, 30, 45, 0.85);
          text-decoration: none;
          color: #cfe7f3;
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          overflow: hidden;
          transition:
            width 0.25s ease,
            background 0.25s ease,
            border-radius 0.25s ease;
        }

        .hover-btn:hover {
          width: 110px;
          border-radius: 999px;
          background: rgba(60, 120, 255, 0.18);
        }

        .icon {
          position: absolute;
          left: 22px;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .label {
          position: absolute;
          left: 52px;
          top: 50%;
          transform: translateY(-50%) translateX(-6px);
          white-space: nowrap;
          opacity: 0;
          transition: all 0.25s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .hover-btn:hover .label {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        .hover-btn.active {
          background: rgba(90, 160, 255, 0.35);
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
