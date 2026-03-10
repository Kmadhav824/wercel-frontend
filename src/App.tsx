
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { Landing } from "./components/landing";
import Features from "./components/Features";
import Infrastructure from "./components/Infrastructure";
import Pricing from "./components/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import "./App.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

// ── Auth Route wrapper (redirect logged-in users away from login/signup) ────
import { useAuth } from "./contexts/AuthContext";
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return !user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* New pages */}
      <Route path="/features" element={<Features />} />
      <Route path="/infrastructure" element={<Infrastructure />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Public: deploy landing page */}
      <Route path="/" element={<Landing />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppShell() {
  const { isDark } = useTheme();

  return (
    <>
      <ThemeToggle />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: isDark ? "#0a0a16" : "#f8fafc",
            color: isDark ? "#fff" : "#0f172a",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(15,23,42,0.15)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: isDark ? "#0a0a16" : "#f8fafc",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: isDark ? "#0a0a16" : "#f8fafc",
            },
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
