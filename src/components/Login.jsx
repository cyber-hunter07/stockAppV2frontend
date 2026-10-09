import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getSetupStatus, register as registerApi } from "../api";

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", identifier: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { getSetupStatus().then((result) => setNeedsSetup(result.needsSetup)).catch(() => {}); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.identifier, form.password);
      } else {
        await registerApi({ name: form.name, username: form.username, email: form.email, password: form.password, role: "Administrator" });
        setSuccess("Account created! You can log in now.");
        setMode("login");
        setForm({ ...form, identifier: form.username, password: "" });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-banner">
          <div className="logo-circle"><img src="/mvit-emblem.jpeg" alt="Manakula Vinayagar Institute of Technology emblem" /></div>
          <h1>MANAKULA VINAYAGAR<br />INSTITUTE OF TECHNOLOGY</h1>
          <p className="college-sub">An Autonomous Institution | Puducherry</p>
          <span className="system-tag">Stock Management System</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {needsSetup && <div className="login-tabs">
            <button type="button" className={mode === "login" ? "ltab active" : "ltab"} onClick={() => setMode("login")}>Sign In</button>
            <button type="button" className={mode === "register" ? "ltab active" : "ltab"} onClick={() => setMode("register")}>Set Up First Admin</button>
          </div>}

          {mode === "register" && (
            <>
              <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
              <input name="username" placeholder="Username" value={form.username} onChange={handleChange} pattern="[A-Za-z0-9._-]{3,30}" title="3–30 letters, numbers, dots, underscores, or hyphens" required />
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            </>
          )}
          {mode === "login" && <input name="identifier" autoComplete="username" placeholder="Username or email" value={form.identifier} onChange={handleChange} required />}
          <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="Password" value={form.password} onChange={handleChange} required />

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Administrator"}
          </button>
        </form>
      </div>
    </div>
  );
}
