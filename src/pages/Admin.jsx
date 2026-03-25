import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button } from "../components/ui/Button";

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("moderation");

  const [pendingListings, setPendingListings] = useState([]);
  const [supportChats, setSupportChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "support") {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "moderation") {
        const { data } = await api.get("/api/admin/listings");
        setPendingListings(data);
      } else if (activeTab === "support") {
        const { data } = await api.get("/api/admin/chats");
        setSupportChats(data);
      }
    } catch (e) {
      console.error("Ошибка загрузки админки", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    if (
      !window.confirm(
        `Вы уверены, что хотите ${status === "approved" ? "одобрить" : "отклонить"} это объявление?`,
      )
    )
      return;
    try {
      await api.put(`/api/admin/listings/${id}/status`, { status });
      setPendingListings(pendingListings.filter((l) => l.id !== id));
      alert("✅ Статус обновлен!");
    } catch (e) {
      alert("Ошибка при обновлении");
    }
  };

  // Защита роута (пускаем только админов)
  if (!user || (user.role !== "admin" && user.role !== "support")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-bg2 p-4 rounded-xl border border-brd">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          👑 Панель Управления
        </h1>
        <div className="flex gap-2 bg-bg p-1 rounded-lg border border-brd">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === "moderation" ? "bg-accent text-white" : "text-text-secondary hover:text-white"}`}
            onClick={() => setActiveTab("moderation")}
          >
            🛡️ Модерация
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === "support" ? "bg-accent text-white" : "text-text-secondary hover:text-white"}`}
            onClick={() => setActiveTab("support")}
          >
            💬 Саппорт
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Загрузка данных...</div>
      ) : (
        <div className="bg-bg2 border border-brd rounded-xl p-6">
          {/* Вкладка Модерации */}
          {activeTab === "moderation" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-4">
                Ожидают проверки ({pendingListings.length})
              </h2>
              {pendingListings.length === 0 ? (
                <div className="text-center text-text-secondary py-10 bg-bg rounded-lg border border-brd">
                  Нет объявлений на модерацию 🎉
                </div>
              ) : (
                pendingListings.map((l) => (
                  <div
                    key={l.id}
                    className="flex justify-between items-center p-4 bg-bg border border-brd rounded-lg"
                  >
                    <div>
                      <div className="font-bold text-lg">{l.title}</div>
                      <div className="text-xs text-text-secondary mt-1">
                        Продавец: {l.seller_name} |{" "}
                        {l.game === "wot" ? "WoT" : "Blitz"} ({l.server}) |
                        Цена: {l.price}₽
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleStatusChange(l.id, "approved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Одобрить
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(l.id, "rejected")}
                        className="text-red-500 hover:border-red-500"
                      >
                        ❌ Отклонить
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Вкладка Поддержки */}
          {activeTab === "support" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-4">Открытые тикеты</h2>
              {supportChats.length === 0 ? (
                <div className="text-center text-text-secondary py-10 bg-bg rounded-lg border border-brd">
                  Нет активных чатов поддержки
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportChats.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-bg border border-brd rounded-lg flex justify-between items-center hover:border-accent transition-colors"
                    >
                      <div>
                        <div className="font-bold text-sm">
                          Пользователь: {c.other_name}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          Чат #{c.id}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          alert(
                            "Чтобы админ мог прямо тут открыть чат, нам нужно встроить окно чата. Для начала - список загружен успешно!",
                          )
                        }
                      >
                        👀 Открыть
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
