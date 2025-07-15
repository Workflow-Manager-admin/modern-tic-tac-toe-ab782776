import React, { useState, useRef } from "react";
import "./ChatOpenAI.css";

// PUBLIC_INTERFACE
/**
 * Minimal OpenAI Chat Modal for KAVIA Tic Tac Toe frontend.
 * Uses the OpenAI Chat API directly from the browser in "secure token" deployment.
 * UI matches the app color scheme and is responsive & modern.
 * (Requires server-side configuration of the OPENAI_API_KEY as a secure runtime env variable, e.g. VITE / REACT_APP prefix)
 */
function ChatOpenAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. Ask me anything or get game advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  // Call OpenAI Chat API - expects key in env var (public var, e.g. REACT_APP_OPENAI_API_KEY, handled via deployment config)
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Detect API key from env (replace with proxy endpoint approach for production)
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

      if (!apiKey || apiKey.startsWith("sk-") === false) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "OpenAI API key is not configured. Please set OPENAI_API_KEY as a runtime environment variable (see README).",
          },
        ]);
        setLoading(false);
        return;
      }

      const apiRequestBody = {
        model: "gpt-3.5-turbo",
        messages: [
          ...messages,
          userMessage
        ].map(({ role, content }) => ({ role, content })),
        max_tokens: 128,
        temperature: 0.8
      };

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiRequestBody)
      });

      if (!res.ok) {
        throw new Error(`OpenAI error: ${res.status}`);
      }

      const data = await res.json();
      const aiMsg = data.choices?.[0]?.message?.content?.trim() || "No response.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiMsg }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong with the AI response." }
      ]);
    }
    setLoading(false);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(true)}
        aria-label="Open AI chat"
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="var(--button-bg)"/>
          <text x="14" y="18" textAnchor="middle" fontSize="14" fill="var(--button-text)">💬</text>
        </svg>
      </button>
      {/* Modal Chat Panel */}
      {open && (
        <div className="chat-modal-bg" onClick={() => setOpen(false)}>
          <aside className="chat-modal" onClick={e => e.stopPropagation()}>
            <header className="chat-header">
              <span>AI Chat</span>
              <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
            </header>
            <ul className="chat-body">
              {messages.map((msg, idx) => (
                <li
                  key={idx}
                  className={msg.role === "user" ? "chat-msg-user" : "chat-msg-assistant"}
                >
                  <span>{msg.content}</span>
                </li>
              ))}
              {loading && (
                <li className="chat-msg-assistant">
                  <span>…</span>
                </li>
              )}
            </ul>
            <form className="chat-input-row" onSubmit={sendMessage} autoComplete="off">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="Type your question…"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                autoFocus
                aria-label="Chat message input"
              />
              <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
                ➤
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

export default ChatOpenAI;
