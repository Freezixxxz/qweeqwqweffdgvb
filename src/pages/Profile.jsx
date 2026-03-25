import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button } from "../components/ui/Button";

export const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);

  // Загружаем историю транзакций при открытии профиля
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data } = await api.get("/api/transactions");
      setTransactions(data);
    } catch (e) {
      console.error("Ошибка загрузки транзакций", e);
    }
  };

  const handleTopup = async () => {
    // Для MVP используем простой встроенный prompt браузера
    const amountStr = prompt("💵 Введите сумму пополнения (в рублях):", "1000");
    if (!amountStr) return;

    const amount = Number(amountStr);
    if (isNaN(amount) || amount < 10) return alert("Минимум 10₽");

    try {
      const { data } = await api.post("/api/users/topup", { amount });
      updateUser(data.user); // Обновляем баланс в шапке (через контекст)
      loadTransactions(); // Обновляем список транзакций
      alert(`✅ Баланс успешно пополнен на ${amount}₽`);
    } catch (e) {
      alert(e.response?.data?.error || "Ошибка пополнения");
    }
  };

  // Защита роута
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">👤 Мой профиль</h1>

      {/* Карточка пользователя */}
      <div className="card p-6 flex flex-col md:flex-row justify-between items-center bg-bg2 border border-brd rounded-xl gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-text-secondary">{user.email}</p>
            <div className="mt-1 text-xs px-2 py-1 bg-bg border border-brd rounded-md inline-block">
              Роль:{" "}
              {user.role === "admin" ? "Администратор 👑" : "Пользователь"}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="text-sm text-text-secondary">Доступный баланс</div>
          <div className="text-4xl font-bold text-accent mb-3">
            {user.balance} ₽
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTopup} variant="primary">
              💳 Пополнить
            </Button>
            <Button onClick={logout} variant="secondary">
              Выйти
            </Button>
          </div>
        </div>
      </div>

      {/* История транзакций */}
      <div className="card p-6 bg-bg2 border border-brd rounded-xl">
        <h2 className="text-lg font-bold mb-4">🧾 История транзакций</h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {transactions.length === 0 ? (
            <div className="text-center text-text-secondary py-6">
              У вас еще не было финансовых операций
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3 bg-bg border border-brd rounded-lg hover:border-accent/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{tx.description}</span>
                  <span className="text-xs text-text-secondary">
                    {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`font-bold text-lg ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount} ₽
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
