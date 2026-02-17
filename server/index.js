import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let db;

// Move to .env in production
const JWT_SECRET = "secretkey";

// =============================
// START SERVER
// =============================
async function startServer() {
  try {
    // ✅ MySQL Connection
    db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "ai_chat_app"
    });

    console.log("✅ Connected to MySQL");

    // ---------------------------
    // TEST ROUTE
    // ---------------------------
    app.get("/", (req, res) => {
      res.send("🚀 Server Running Successfully");
    });

    // ---------------------------
    // REGISTER
    // ---------------------------
    app.post("/register", async (req, res) => {
      try {
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name, email, hashedPassword]
        );

        res.json({ message: "User Registered Successfully" });

      } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // ---------------------------
    // LOGIN
    // ---------------------------
    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        const [rows] = await db.execute(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );

        if (rows.length === 0) {
          return res.status(400).json({ error: "User not found" });
        }

        const valid = await bcrypt.compare(password, rows[0].password);

        if (!valid) {
          return res.status(400).json({ error: "Invalid password" });
        }

        const token = jwt.sign(
          { id: rows[0].id },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.json({
          token,
          userId: rows[0].id
        });

      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // ---------------------------
    // CHAT ROUTE (HF Router)
    // ---------------------------
    app.post("/chat", async (req, res) => {
      try {
        const { message, userId } = req.body;

        if (!message) {
          return res.status(400).json({ error: "Message is required" });
        }

        // Save user message
        await db.execute(
          "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)",
          [userId, message]
        );

        // 🔥 Hugging Face Router (OpenAI compatible format)
        const hfResponse = await fetch(
          "https://router.huggingface.co/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.HF_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "mistralai/Mistral-7B-Instruct-v0.2",
              messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: message }
              ],
              max_tokens: 150,
              temperature: 0.7
            })
          }
        );

        if (!hfResponse.ok) {
          const errorText = await hfResponse.text();
          console.error("HF Error:", errorText);
          return res.status(500).json({
            error: "Hugging Face API Error",
            details: errorText
          });
        }

        const data = await hfResponse.json();

        const aiReply =
          data?.choices?.[0]?.message?.content ||
          "No AI response generated.";

        // Save AI reply
        await db.execute(
          "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)",
          [userId, aiReply]
        );

        res.json({ reply: aiReply });

      } catch (error) {
        console.error("Chat Route Error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // ---------------------------
    // START SERVER
    // ---------------------------
    app.listen(5000, () => {
      console.log("🚀 Server running on port 5000");
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

startServer();
