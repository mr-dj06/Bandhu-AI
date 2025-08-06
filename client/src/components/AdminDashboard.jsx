import React, { useState } from "react";
import SessionList from "./SessionList";
import ChatHistory from "./ChatHistory";

export default function AdminDashboard() {
    const [selectedSession, setSelectedSession] = useState(null);

    return (
        <div className="flex flex-col md:flex-row gap-6 p-8 min-h-screen bg-gray-100">
            <div className="w-full md:w-1/3">
                <SessionList onSelect={setSelectedSession} />
            </div>
            <div className="w-full md:w-2/3">
                <ChatHistory sessionId={selectedSession} />
            </div>
        </div>
    );
}