import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (activeTab === "listings") loadListings();
    if (activeTab === "purchases") loadOrders();
    if (activeTab === "transactions") loadTransactions();
  }, [activeTab]);

  const loadListings = async () => {
    try {
      const { data } = await api.get("/api/listings/my/active");
      setListings(data);
    } catch (e) {}
  };

  const loadOrders = async () => {
    try {
      const { data } = await api.get("/api/orders/my/purchases");
      setOrders(data);
    } catch (e) {}
  };

  const loadTransactions = async () => {
    try {
      const { data } = await api.get("/api/transactions");
      setTransactions(data);
    } catch (e) {}
  };

  const setDiscount = async (id, discount) => {
    try {
      await api.put(`/api/listings/${id}/discount`, {
        discount: parseInt(discount),
      });
      loadListings();
    } catch (e) {
      alert(e.response?.data?.error);
    }
  };

  if (!user) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-3xl font-bold overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} className="w-full h-full object-cover" />
          ) : (
            user.name?.[0]
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-text-secondary">{user.email}</p>
          <div className="flex gap-4 mt-2 text-sm font-bold">
            <span className="text-success">
              {user.balance?.toLocaleString()}₽
            </span>
            {user.frozen_balance > 0 && (
              <span className="text-warning">
                ❄️ {user.frozen_balance.toLocaleString()}₽
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["listings", "purchases", "transactions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? "bg-accent text-white" : "bg-bg-card text-text-secondary"}`}
          >
            {tab === "listings"
              ? "📦 Активные"
              : tab === "purchases"
                ? "🛒 Покупки"
                : "💳 Транзакции"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "listings" &&
          listings.map((l) => (
            <div
              key={l.id}
              className="card p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold">{l.title}</h3>
                <p className="text-success font-bold">
                  {l.final_price?.toLocaleString()}₽
                </p>
              </div>
              <select
                className="input w-24 text-xs"
                value={l.discount || 0}
                onChange={(e) => setDiscount(l.id, e.target.value)}
              >
                <option value="0">Без скидки</option>
                <option value="5">-5%</option>
                <option value="10">-10%</option>
                <option value="15">-15%</option>
                <option value="20">-20%</option>
              </select>
            </div>
          ))}

        {activeTab === "purchases" &&
          orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex justify-between">
                <h3 className="font-bold">{o.title}</h3>
                <span className="text-xs bg-bg-secondary px-2 py-1 rounded">
                  {o.status}
                </span>
              </div>
              <p className="text-success font-bold mt-2">
                {o.amount?.toLocaleString()}₽
              </p>
            </div>
          ))}

        {activeTab === "transactions" &&
          transactions.map((t) => (
            <div key={t.id} className="card p-4 flex justify-between">
              <span className="text-sm">{t.description}</span>
              <span
                className={
                  t.amount >= 0
                    ? "text-success font-bold"
                    : "text-danger font-bold"
                }
              >
                {t.amount >= 0 ? "+" : ""}
                {t.amount?.toLocaleString()}₽
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};
