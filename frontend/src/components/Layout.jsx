import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";
import {
  Heart,
  Home,
  User,
  MessageCircle,
  LogOut,
  Activity,
  Building2
} from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // No minimal navbar for now
  const minimalNav = false;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case "patient":
        return <User className="h-4 w-4" />;
      case "donor":
        return <Heart className="h-4 w-4" />;
      case "bloodbank":
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getUserTypeName = (userType) => {
    switch (userType) {
      case "patient":
        return "Patient";
      case "donor":
        return "Donor";
      case "bloodbank":
        return "Blood Bank";
      default:
        return "User";
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">
                LifeFlow
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {/* Home */}
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "text-red-600 bg-red-50"
                    : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>

              {/* Prediction (VISIBLE FOR ALL) */}
              <Link
                to="/prediction"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/prediction")
                    ? "text-red-600 bg-red-50"
                    : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Prediction</span>
              </Link>

              {/* Visitor Links */}
              {!user && !minimalNav && (
                <>
                  <Link
                    to="/register?type=patient"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    <User className="h-4 w-4" />
                    <span>Patient</span>
                  </Link>

                  <Link
                    to="/register?type=donor"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    <Heart className="h-4 w-4" />
                    <span>Donor</span>
                  </Link>

                  <Link
                    to="/register?type=bloodbank"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Blood Bank</span>
                  </Link>
                </>
              )}

              {/* Logged-in Links */}
              {user && !minimalNav && (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/dashboard")
                        ? "text-red-600 bg-red-50"
                        : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/messages"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/messages")
                        ? "text-red-600 bg-red-50"
                        : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                  </Link>

                  <Link
                    to="/profile"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/profile")
                        ? "text-red-600 bg-red-50"
                        : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
                    {getUserTypeIcon(user.userType)}
                    <span className="text-sm font-medium text-red-700">
                      {getUserTypeName(user.userType)}
                    </span>
                  </div>

                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user.name}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {!minimalNav && (
                    <>
                      <Link to="/login">
                        <Button variant="ghost" size="sm">
                          Login
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Register
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="flex-1">
        {children}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-6 w-6 text-red-600" />
              <span className="text-lg font-semibold text-gray-900">
                LifeFlow
              </span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600 mb-1">
                "Every drop counts"
              </p>
              <p className="text-xs text-gray-500">
                © 2025 LifeFlow. Connecting lives through blood donation.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
