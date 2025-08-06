import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Chat from "./components/Chat";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";

function App() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem("adminToken"));

  const handleLogin = () => setIsAdmin(true);
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  };

  return (
    <Router>
      <nav className="bg-blue-600 p-4 flex justify-center gap-8 mb-8 shadow">
        <Link to="/" className="text-white font-semibold hover:underline">User Chat</Link>
        <Link to="/admin" className="text-white font-semibold hover:underline">Admin Dashboard</Link>
        {isAdmin && (
          <button onClick={handleLogout} className="text-white font-semibold hover:underline ml-4">Logout</button>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route
          path="/admin"
          element={
            isAdmin ? <AdminDashboard /> : <AdminLogin onLogin={handleLogin} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;