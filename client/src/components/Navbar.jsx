import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, MessageSquare, User } from "lucide-react";

export const Navbar = () => {
  const { user } = useAuth();
  const { logout } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-primary font-semibold text-lg hover:opacity-80 transition-opacity"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="hidden sm:inline">ChatApp</span>
      </button>

      <nav className="flex items-center gap-1">
        <button
          onClick={() => navigate("/")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive("/")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Chats</span>
        </button>
        <button
          onClick={() => navigate("/profile")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive("/profile")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <User className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Profile</span>
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
    </header>
  );
};
