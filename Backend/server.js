const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const {
    generateAIResponse,
    streamAIResponse
} = require("./ai");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Welcome to My AI Chatbot Backend!");
});

// AI Chat API
app.post("/api/chat", async(req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid message",
            });
        }

        const aiResponse = await generateAIResponse(message.trim());

        res.json({
            success: true,
            userMessage: message,
            aiResponse: aiResponse,
        });
    } catch (error) {
        console.error("AI Error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while generating AI response",
        });
    }
});


app.post("/api/chat/stream", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message required"
            });
        }

        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        await streamAIResponse(message.trim(), (token) => {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
        });

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("Stream Error:", error);

        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({
                error: "AI streaming failed"
            })}\n\n`);
            res.end();
        } else {
            res.status(500).json({
                success: false,
                message: "Streaming failed"
            });
        }
    }
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});