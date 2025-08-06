import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const sessionId = localStorage.getItem("sessionId") || (() => {
  const id = Math.random().toString(36).substr(2, 9);
  localStorage.setItem("sessionId", id);
  return id;
})();

const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
  query: { sessionId },
  transports: ['websocket', 'polling'],
  forceNew: true
});

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Debug socket connection
    socket.on("connect", () => {
      console.log("Connected to server with sessionId:", sessionId);
      console.log("Socket ID:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("bot_response", (msg) => {
      console.log("Received bot response:", msg);
      setMessages((prev) => [...prev, { sender: "bot", message: msg }]);
    });

    // Test event
    socket.on("test", (data) => {
      console.log("Test event received:", data);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("bot_response");
      socket.off("test");
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    console.log("Sending message:", input);
    setMessages((prev) => [...prev, { sender: "user", message: input }]);
    socket.emit("user_message", input);
    setInput("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const testConnection = () => {
    console.log("Testing connection...");
    socket.emit("test", "Hello from client");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Chat Assistant</h2>
        
        {/* Connection status */}
        <div className={`text-sm mb-2 text-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        {/* Test button */}
        <button
          onClick={testConnection}
          className="w-full mb-4 bg-gray-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-600 transition"
        >
          Test Connection
        </button>

        <div className="h-96 overflow-y-auto border rounded p-3 bg-gray-50 mb-4">
          {messages.length === 0 && (
            <div className="text-gray-500 text-center">Start a conversation...</div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-xl max-w-xs ${msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-tr-none"
                  : "bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
              >
                <span className="block text-xs font-semibold mb-1">
                  {msg.sender === "user" ? "You" : "Bot"}
                </span>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            className="flex-1 border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected}
            className={`px-5 py-2 rounded-r transition ${
              isConnected 
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}