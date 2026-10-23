import React, { useState, useRef, useEffect } from "react";
import { askNLQuery } from "../api";

const SUGGESTIONS = [
  "How many departments are there?",
  "How do I record a new purchase?",
  "How do I approve a scrap request?",
];

const BotIcon = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="8" width="16" height="12" rx="4" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3.2" r="1.2" fill="currentColor" />
    <circle cx="9" cy="14" r="1.3" fill="currentColor" className="bot-eye" />
    <circle cx="15" cy="14" r="1.3" fill="currentColor" className="bot-eye" />
    <path d="M2 13v3M22 13v3" />
  </svg>
);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I am the Stock Assistant. Ask in English about stock records, app features, permissions, or procedures." },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async (text) => {
    const q = (text ?? question).trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const history = messages
        .filter((message) => message.role === "user" || (message.role === "bot" && message.kind !== "inventory"))
        .map((message) => ({ role: message.role === "bot" ? "assistant" : "user", text: message.text }));
      const { answer, kind } = await askNLQuery(q, history);
      setMessages((prev) => [...prev, { role: "bot", text: answer || "No answer found.", kind }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || (err.code === "ERR_NETWORK" ? "Could not reach the assistant service. Check the connection and try again." : err.message || "Sorry, couldn't process that.");
      setMessages((prev) => [...prev, { role: "bot", text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="chat-popup">
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar"><BotIcon size={22} /></div>
              <div>
                <div className="chat-title">Stock Bot</div>
                <div className="chat-status"><span className="dot" /> English support</div>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>

          <p className="chat-privacy-note">Questions go to the configured AI provider; stock records stay in the app. Do not enter passwords or secrets.</p>

          <div className="chat-window">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
            ))}
            {loading && (
              <div className="chat-bubble bot typing"><span /><span /><span /></div>
            )}
            {messages.length === 1 && (
              <div className="chat-chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input aria-label="Ask the Stock Assistant" maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask an English question about stock or this app..." />
            <button type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      )}

      <button className={`chat-fab ${open ? "open" : ""}`} onClick={() => setOpen(!open)} aria-label="Open AI chat">
        <span className="fab-ring" />
        <span className="fab-icon">{open ? "✕" : <BotIcon />}</span>
      </button>
    </>
  );
}
