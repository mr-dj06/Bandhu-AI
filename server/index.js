// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Models
const ChatMessage = mongoose.model('ChatMessage', new mongoose.Schema({
    sessionId: String,
    sender: String, // 'user', 'bot', 'admin'
    message: String,
    timestamp: { type: Date, default: Date.now }
}));

// Socket.IO logic
io.on('connection', (socket) => {
    let sessionId = socket.handshake.query.sessionId || socket.id;
    console.log('Client connected with sessionId:', sessionId);

    socket.on('user_message', async (msg) => {
        console.log('Received user message:', msg, 'from session:', sessionId);
        
        try {
            // Save user message
            await ChatMessage.create({ sessionId, sender: 'user', message: msg });
            console.log('User message saved to database');

            // Fetch last 5 messages for context
            const chatHistory = await ChatMessage.find({ sessionId })
                .sort({ timestamp: -1 })
                .limit(5)
                .lean();
            console.log('Chat history fetched:', chatHistory.length, 'messages');

            // Reverse to chronological order
            chatHistory.reverse();

            // Call OpenAI API with chat history
            console.log('Calling OpenAI API...');
            const botReply = await generateAIResponse(msg, chatHistory);
            console.log('OpenAI response:', botReply);

            // Save bot response
            await ChatMessage.create({ sessionId, sender: 'bot', message: botReply });
            console.log('Bot response saved to database');

            // Emit bot response
            socket.emit('bot_response', botReply);
            console.log('Bot response emitted to client');
        } catch (error) {
            console.error('Error processing user message:', error);
            socket.emit('bot_response', 'Sorry, I encountered an error. Please try again.');
        }
    });

    socket.on('test', (data) => {
        console.log('Test event received from client:', data);
        socket.emit('test', 'Hello from server!');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', sessionId);
    });

    // Optionally: handle admin messages, etc.
});

// OpenAI API logic
const OpenAIApi = require('openai');
const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

const generateAIResponse = async (message, chatHistory = []) => {
    try {
        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful customer support assistant. Be concise, friendly, and professional.",
            },
            ...chatHistory.slice(-5).map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.message,
            })),
            { role: "user", content: message },
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 150,
            temperature: 0.7,
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API error:", error);
        return "I'm sorry, I'm having trouble responding right now. Please try again later.";
    }
};

// Simple in-memory admin user (for demo; use DB in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10); // hash at startup

// Admin login route
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Middleware to protect admin routes
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// REST endpoint for admin to fetch sessions and chats
app.get('/api/sessions', adminAuth, async (req, res) => {
    const sessions = await ChatMessage.distinct('sessionId');
    res.json(sessions);
});

app.get('/api/sessions/stats', adminAuth, async (req, res) => {
    try {
        const sessions = await ChatMessage.distinct('sessionId');
        const sessionStats = await Promise.all(
            sessions.map(async (sessionId) => {
                const messages = await ChatMessage.find({ sessionId }).sort('timestamp');
                return {
                    sessionId,
                    messageCount: messages.length,
                    firstMessage: messages.length > 0 ? messages[0].timestamp : null,
                    lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
                };
            })
        );
        res.json(sessionStats);
    } catch (error) {
        console.error('Error fetching session stats:', error);
        res.status(500).json({ error: 'Failed to fetch session statistics' });
    }
});

app.get('/api/chats/:sessionId', adminAuth, async (req, res) => {
    const chats = await ChatMessage.find({ sessionId: req.params.sessionId }).sort('timestamp');
    res.json(chats);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));