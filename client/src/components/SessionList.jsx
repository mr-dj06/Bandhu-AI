import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SessionList({ onSelect }) {
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem("adminToken");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/sessions", config);
        const sessionIds = response.data;

        // Fetch details for each session
        const sessionDetails = await Promise.all(
          sessionIds.map(async (sessionId) => {
            try {
              const chatResponse = await axios.get(`http://localhost:5000/api/chats/${sessionId}`, config);
              const messages = chatResponse.data;

              return {
                sessionId,
                messageCount: messages.length,
                firstMessage: messages.length > 0 ? messages[0].timestamp : null,
                lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
              };
            } catch (error) {
              console.error(`Error fetching details for session ${sessionId}:`, error);
              return { sessionId, messageCount: 0, firstMessage: null, lastMessage: null };
            }
          })
        );

        setSessions(sessionDetails);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'No messages';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 text-blue-600">Active Sessions ({sessions.length})</h3>
      <ul className="space-y-2">
        {sessions.length === 0 && (
          <li className="text-gray-500 text-center">No active sessions</li>
        )}
        {sessions.map((session) => (
          <li key={session.sessionId}>
            
            <button
              onClick={() => onSelect(session.sessionId)}
              className="w-full text-left p-3 rounded bg-blue-100 hover:bg-blue-200 transition"
            >
              <div className="font-mono text-sm mb-1">{session.sessionId}</div>
              <div className="text-xs text-gray-600">
                Messages: {session.messageCount} |
                Started: {formatTime(session.firstMessage)} |
                Last: {formatTime(session.lastMessage)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}