import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  ShoppingBag,
  PlusCircle,
  MessageSquare,
  Shield,
  Settings,
  User,
} from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            className="w-10 h-10 rounded-xl object-cover brightness-75 saturate-50"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="text-xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            LeShop
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" active={isActive("/")}>
            <Home size={16} /> <span className="hidden sm:inline">Главная</span>
          </NavLink>
          <NavLink to="/catalog" active={isActive("/catalog")}>
            <ShoppingBag size={16} />{" "}
            <span className="hidden sm:inline">Каталог</span>
          </NavLink>
          {user && (
            <>
              <NavLink to="/sell" active={isActive("/sell")}>
                <PlusCircle size={16} />{" "}
                <span className="hidden sm:inline">Продать</span>
              </NavLink>
              <NavLink to="/messages" active={isActive("/messages")}>
                <MessageSquare size={16} />{" "}
                <span className="hidden sm:inline">Чаты</span>
              </NavLink>
            </>
          )}

          <div className="flex-1" />

          {user?.role === "support" && (
            <NavLink to="/support" active={isActive("/support")}>
              <Shield size={16} />{" "}
              <span className="hidden sm:inline">Саппорт</span>
            </NavLink>
          )}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-red-500 font-bold hover:text-red-400 transition-colors"
            >
              👑 Админка
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-transparent hover:border-border hover:bg-bg-card transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-sm font-bold overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name?.[0]
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold leading-tight">
                  {user.name}
                </div>
                <div className="text-xs font-bold text-success">
                  {user.balance?.toLocaleString()}₽
                  {user.frozen_balance > 0 && (
                    <span className="text-warning ml-1">
                      ❄️{user.frozen_balance}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/auth" className="btn-primary">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ children, to, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? "text-white bg-accent/10"
        : "text-text-secondary hover:text-white hover:bg-bg-card"
    }`}
  >
    {children}
  </Link>
);
