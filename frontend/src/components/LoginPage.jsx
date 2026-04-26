import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    identifier: "",
    email: "",
    password: "",
    newPassword: "",
  });


  const [otp, setOtp] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const checkSession = async () => {
      try {
        setCheckingSession(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          setCheckingSession(false);
          return;
        }

        const data = await res.json();
        if (data && (data.user || data.email)) {
          navigate("/dashboard", { replace: true });
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setCheckingSession(false);
        }
      }
    };

    checkSession();
    return () => controller.abort();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setMessage("OTP sent to your email. Please verify.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "OTP verification failed");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setMessage("OTP sent to your email for password reset.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Password reset failed");

      setMessage("Password reset successful. You can now login.");
      setIsForgotPassword(false);
      setOtpSent(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
  };

  if (checkingSession) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Checking session...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {isForgotPassword
            ? "Reset Password"
            : isSignup
            ? "Create Account"
            : "Welcome Back"}
        </h2>

        {!otpSent && isSignup && (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {!otpSent && !isSignup && !isForgotPassword && (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="identifier"
              placeholder="Email or Username"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p
              className="toggle-text"
              onClick={() => {
                setIsForgotPassword(true);
                setError("");
                setMessage("");
              }}
            >
              Forgot Password?
            </p>
          </form>
        )}

        {isSignup && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {isForgotPassword && !otpSent && (
          <form onSubmit={handleForgotPassword}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {isForgotPassword && otpSent && !otpVerified && (
          <form onSubmit={handleResetPassword}>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        {!isForgotPassword && (
          <>
            <div className="divider">
              <span>OR</span>
            </div>
            <div className="social-buttons">
              <button onClick={() => handleSocialLogin("google")}>
                Login with Google
              </button>
              <button onClick={() => handleSocialLogin("steam")}>
                Login with Steam
              </button>
              <button onClick={() => handleSocialLogin("epic")}>
                Login with Epic Games
              </button>
            </div>
          </>
        )}

        <p
          onClick={() => {
            setIsSignup(!isSignup);
            setOtpSent(false);
            setError("");
            setMessage("");
            setIsForgotPassword(false);
          }}
          className="toggle-text"
        >
          {isSignup ? "Already have an account? Login here" : "Don't have an account? Sign up here"}
        </p>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          background: var(--color-bg-primary);
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
          box-shadow: var(--shadow-xl);
          backdrop-filter: blur(20px);
        }

        .auth-card h2 {
          font-size: var(--text-3xl);
          font-weight: var(--weight-bold);
          margin: 0 0 var(--space-8) 0;
          text-align: center;
          color: var(--color-text-primary);
        }

        .auth-card form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .auth-card input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--text-base);
          transition: all var(--transition-base);
        }

        .auth-card input:focus {
          border-color: var(--color-border-focus);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }

        .auth-card input::placeholder {
          color: var(--color-text-muted);
        }

        .auth-card button[type="submit"] {
          width: 100%;
          padding: var(--space-3) var(--space-5);
          background: var(--color-accent-primary);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-size: var(--text-base);
          font-weight: var(--weight-semibold);
          cursor: pointer;
          transition: all var(--transition-base);
          margin-top: var(--space-2);
        }

        .auth-card button[type="submit"]:hover:not(:disabled) {
          background: var(--color-accent-primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
        }

        .auth-card button[type="submit"]:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-card button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .auth-card button[type="submit"]:focus-visible {
          outline: 2px solid var(--color-border-focus);
          outline-offset: 2px;
        }

        .toggle-text {
          cursor: pointer;
          margin-top: var(--space-4);
          text-align: center;
          font-size: var(--text-sm);
          color: var(--color-accent-primary);
          transition: color var(--transition-base);
        }

        .toggle-text:hover {
          color: var(--color-accent-primary-hover);
          text-decoration: underline;
        }

        .success-text {
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--color-success-bg);
          border: 1px solid rgba(46, 160, 67, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-success);
          font-size: var(--text-sm);
          text-align: center;
          line-height: var(--leading-relaxed);
        }

        .error-text {
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--color-error-bg);
          border: 1px solid rgba(248, 81, 73, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-error);
          font-size: var(--text-sm);
          text-align: center;
          line-height: var(--leading-relaxed);
        }

        .divider {
          display: flex;
          align-items: center;
          margin: var(--space-6) 0;
          text-align: center;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--color-border-primary);
        }

        .divider span {
          padding: 0 var(--space-4);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .social-buttons button {
          width: 100%;
          padding: var(--space-3) var(--space-5);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .social-buttons button:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-border-focus);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .social-buttons button:active {
          transform: translateY(0);
        }

        .social-buttons button:focus-visible {
          outline: 2px solid var(--color-border-focus);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
