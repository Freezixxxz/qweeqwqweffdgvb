import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (form.password !== form.password2) {
          alert("Пароли не совпадают");
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password);
      }
      navigate("/");
    } catch (e) {
      alert(e.response?.data?.error || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "👋 Вход" : "📝 Регистрация"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Никнейм"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <Input
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {!isLogin && (
            <Input
              label="Подтверждение пароля"
              type="password"
              value={form.password2}
              onChange={(e) => setForm({ ...form, password2: e.target.value })}
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-text-secondary">
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent hover:underline"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
};
