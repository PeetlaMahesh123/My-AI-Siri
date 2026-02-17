import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setChat(prev => [...prev, userMessage]);
    setMessage("");

    try {
      const res = await axios.post("https://my-ai-siri-production.up.railway.app/chat", {
        message,
        userId: 1
      });

      const botMessage = {
        role: "assistant",
        content: res.data.reply
      };

      setChat(prev => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>My SIRI</h1> 🤖
          <p>
            A smart AI-powered assistant integrated into my portfolio.
            Built using React, Node.js, and modern LLM APIs.
            It provides detailed explanations, code examples,
            and interactive technical support.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              💡 Smart Explanations
              <span>Detailed structured technical answers.</span>
            </div>

            <div className="feature-card">
              ⚡ Real-Time AI
              <span>Instant responses using modern AI models.</span>
            </div>

            <div className="feature-card">
              🔐 Secure Backend
              <span>JWT + database integration supported.</span>
            </div>

            <div className="feature-card">
              📱 Floating Widget
              <span>Responsive bottom-right assistant.</span>
            </div>
          </div>

          <div className="cta-buttons">
            <button className="primary-btn">Explore Projects</button>
            <button className="secondary-btn">Contact Me</button>
          </div>
        </div>
      </div>

      {/* ================= FLOATING BUTTON ================= */}
      <div className="ai-toggle" onClick={() => setOpen(!open)}>
        🤖
      </div>

      {/* ================= CHAT PANEL ================= */}
      <div className={`ai-panel ${open ? "open" : ""}`}>
        <div className="ai-header">
          My Siri 🤖
          <span onClick={() => setOpen(false)}>✕</span>
        </div>

        <div className="ai-chat">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`ai-message ${
                msg.role === "user" ? "user" : "bot"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="ai-input">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask anything..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </>
  );
}

export default App;
