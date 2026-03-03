import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Eligibility from "./pages/Eligibility";

// Prediction Pages
import PredictionHub from "./pages/PredictionHub";
import DiseasePredictionPage from "./pages/DiseasePredictionPage";
import WBCPredictionPage from "./pages/WBCPredictionPage";

// Protected Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Donations from "./pages/Donations";
import Messages from "./pages/Messages";
import Search from "./pages/Search";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>

            {/* ---------- Public Routes ---------- */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/eligibility" element={<Eligibility />} />

            {/* ---------- Prediction Flow ---------- */}
            <Route path="/prediction" element={<PredictionHub />} />
            <Route
              path="/disease-prediction"
              element={<DiseasePredictionPage />}
            />
            <Route
              path="/wbc-prediction"
              element={<WBCPredictionPage />}
            />

            {/* ---------- Protected Routes ---------- */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/donations"
              element={
                <ProtectedRoute allowedUserTypes={["bloodbank"]}>
                  <Donations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/search"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <Search />
                </ProtectedRoute>
              }
            />

            {/* ---------- Fallback ---------- */}
            <Route path="*" element={<Home />} />

          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
