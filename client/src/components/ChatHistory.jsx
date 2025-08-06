import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ChatHistory({ sessionId }) {
  const [chats, setChats] = useState([]);
  const token = localStorage.getItem("adminToken");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!sessionId) return;
    axios.get(`http://localhost:5000/api/chats/${sessionId}`,config)
      .then(res => setChats(res.data))
      .catch(console.error);
  }, [sessionId]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!sessionId)
    return <div className="text-gray-500">Select a session to view chat history.</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="text-md font-semibold mb-2 text-blue-600">
        Chat History for <span className="font-mono">{sessionId}</span>
      </h4>
      <div className="h-72 overflow-y-auto border rounded p-3 bg-gray-50">
        {chats.length === 0 && (
          <div className="text-gray-500 text-center">No messages in this session.</div>
        )}
        {chats.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-tr-none"
                  : msg.sender === "bot"
                    ? "bg-gray-200 text-gray-800 rounded-tl-none"
                    : "bg-green-200 text-green-900"
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">
                  {msg.sender}
                </span>
                <span className={`text-xs ${msg.sender === "user"
                    ? "text-blue-100"
                    : msg.sender === "bot"
                      ? "text-gray-500"
                      : "text-green-700"
                  }`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div>{msg.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}