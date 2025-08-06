import React, { useState } from "react";
import axios from "axios";

export default function AdminLogin({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/login`, { username, password });
            localStorage.setItem("adminToken", res.data.token);
            onLogin();
        } catch (err) {
            setError("Invalid credentials", err);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
            <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Admin Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition" type="submit">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}