import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button } from "../components/ui/Button";

export const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const { data } = await api.get(`/api/listings/${id}`);
      setListing(data);
    } catch (e) {
      alert("Товар не найден");
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      alert("Сначала войдите в аккаунт!");
      return navigate("/auth");
    }

    if (user.balance < listing.final_price) {
      const wantToTopup = window.confirm(
        `Недостаточно средств. Ваш баланс: ${user.balance}₽.\nПерейти в профиль для пополнения?`,
      );
      if (wantToTopup) navigate("/profile");
      return;
    }

    const confirmBuy = window.confirm(
      `Подтверждаете покупку за ${listing.final_price} ₽?`,
    );
    if (!confirmBuy) return;

    setBuyLoading(true);
    try {
      const { data } = await api.post(`/api/orders/buy/${listing.id}`);

      // Обновляем баланс юзера локально (списываем деньги визуально)
      updateUser({ balance: user.balance - listing.final_price });

      alert("🎉 Успешная покупка! Переходим в чат с продавцом...");
      navigate("/messages"); // Перекидываем сразу в чаты, чтобы он увидел заказ!
    } catch (e) {
      alert(e.response?.data?.error || "Ошибка при покупке");
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Загрузка...</div>;
  if (!listing) return null;

  const isMyListing = user?.id === listing.seller_id;

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Левая колонка (Галерея и описание) */}
      <div className="flex-1 space-y-6">
        <div className="card bg-bg2 border border-brd rounded-xl overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-bg">
              {listing.images.map((img, i) => (
                <img
                  key={i}
                  src={`http://localhost:3000${img}`}
                  className="w-full h-48 md:h-64 object-cover rounded-md"
                  alt="скриншот"
                />
              ))}
            </div>
          ) : (
            <div className="h-64 bg-bg flex items-center justify-center text-5xl">
              🎮 Нет скриншотов
            </div>
          )}
        </div>

        <div className="card p-6 bg-bg2 border border-brd rounded-xl">
          <h2 className="text-xl font-bold mb-4">Описание от продавца</h2>
          <div className="whitespace-pre-wrap text-text-secondary leading-relaxed">
            {listing.description || "Продавец не оставил описание."}
          </div>
        </div>
      </div>

      {/* Правая колонка (Цена и кнопки) */}
      <div className="w-full md:w-[350px] space-y-6">
        <div className="card p-6 bg-bg2 border border-brd rounded-xl sticky top-24">
          <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>

          <div className="text-xs text-text-secondary mb-6 flex gap-2">
            <span className="bg-bg px-2 py-1 rounded border border-brd">
              {listing.game === "wot" ? "WoT" : "Blitz"}
            </span>
            <span className="bg-bg px-2 py-1 rounded border border-brd">
              {listing.server}
            </span>
            <span className="bg-bg px-2 py-1 rounded border border-brd">
              Просмотров: {listing.views}
            </span>
          </div>

          <div className="text-4xl font-bold text-accent mb-6">
            {listing.final_price} ₽
          </div>

          {isMyListing ? (
            <Button
              variant="secondary"
              className="w-full py-3 mb-4 cursor-not-allowed"
            >
              Это ваш товар
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full py-3 mb-4 text-lg"
              onClick={handleBuy}
              disabled={buyLoading}
            >
              {buyLoading ? "Оформляем..." : "🛒 Купить сейчас"}
            </Button>
          )}

          <div className="pt-4 border-t border-brd">
            <h3 className="text-sm font-bold text-text-secondary mb-3">
              Продавец
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold text-white">
                {listing.seller_name[0].toUpperCase()}
              </div>
              <div>
                <div className="font-bold">{listing.seller_name}</div>
                <div className="text-xs text-green-500">Надежный продавец</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-text-secondary text-center p-3 bg-bg rounded-lg">
            🛡️ <b>Безопасная сделка</b>
            <br />
            Деньги будут заморожены гарантом до момента передачи аккаунта.
          </div>
        </div>
      </div>
    </div>
  );
};
