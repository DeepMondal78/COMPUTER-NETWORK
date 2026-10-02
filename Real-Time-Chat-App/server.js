require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// .env ফাইল থেকে API Key লোড করা হচ্ছে
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('chat message', async (data) => {
        console.log(`Message from ${data.user}: ${data.text}`);
        
        io.emit('chat message', data);

        if (data.user !== 'ChatBot') {
            try {
                let response;
                try {
                    response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: data.text,
                    });
                } catch (modelError) {
                    console.log("gemini-2.5-flash failed, trying alternative model...");
                    
                    response = await ai.models.generateContent({
                        model: 'gemini-1.5-flash',
                        contents: data.text,
                    });
                }

                const aiReply = response.text || "Sorry, I don't have a response for that.";

                const botData = {
                    user: 'ChatBot',
                    text: aiReply
                };

                io.emit('chat message', botData);

            } catch (error) {
                console.error("Gemini API Error:", error);
                const errorData = {
                    user: 'ChatBot',
                    text: "Sorry, Now AI is not available."
                };
                io.emit('chat message', errorData);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`AI Chat server is running on http://localhost:${PORT}`);
});