import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/Modal";

export const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const { data } = await api.get(`/api/listings/${id}`);
      setListing(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowBuyModal(true);
  };

  const confirmBuy = async () => {
    try {
      setBuying(true);
      const { data } = await api.post(`/api/orders/buy/${id}`);
      setShowBuyModal(false);
      navigate(`/messages?chat=${data.chatId}`);
    } catch (e) {
      alert(e.response?.data?.error || "Ошибка");
    } finally {
      setBuying(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!listing) return <div>Не найдено</div>;

  const finalPrice = Math.round(
    listing.price * (1 - (listing.discount || 0) / 100),
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-3">
            <div className="aspect-video bg-bg-secondary rounded-xl overflow-hidden">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                  {listing.game === "wot" ? "🎖️" : "📱"}
                </div>
              )}
            </div>
            {listing.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div
                className={`inline-block px-2 py-1 rounded-md text-xs font-semibold mb-2 ${
                  listing.game === "wot"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-orange-500/15 text-orange-400"
                }`}
              >
                {listing.game === "wot" ? "World of Tanks" : "WoT Blitz"} •{" "}
                {listing.server}
              </div>
              <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-success">
                  {finalPrice.toLocaleString()}₽
                </span>
                {listing.discount > 0 && (
                  <span className="text-text-muted line-through">
                    {listing.price?.toLocaleString()}₽
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Бои"
                value={(listing.battles || 0).toLocaleString()}
              />
              <Stat label="Винрейт" value={`${listing.winrate || 0}%`} />
              <Stat label="Танков X" value={listing.tier10 || 0} />
              <Stat label="Прем. техника" value={listing.premiums || 0} />
              <Stat
                label="Тип доступа"
                value={
                  listing.access_type === "full" ? "🔓 Полный" : "🔒 Частичный"
                }
              />
            </div>

            {listing.description && (
              <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                <h3 className="font-semibold text-sm mb-2 text-text-secondary">
                  📝 Описание
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center font-bold text-sm">
                {listing.seller_avatar ? (
                  <img
                    src={listing.seller_avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  listing.seller_name?.[0]
                )}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {listing.seller_name}
                </div>
                <div className="text-xs text-text-muted">Продавец</div>
              </div>
            </div>

            <Button
              variant="success"
              size="lg"
              className="w-full"
              onClick={handleBuy}
            >
              💳 Купить сейчас
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title="💳 Подтверждение покупки"
      >
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">{listing.title}</p>
          <p className="text-3xl font-black text-success">
            {finalPrice.toLocaleString()}₽
          </p>
          <p className="text-sm text-text-muted">
            Ваш баланс: {user?.balance?.toLocaleString()}₽
          </p>

          {user?.balance < finalPrice ? (
            <div className="text-danger text-sm">Недостаточно средств</div>
          ) : (
            <Button
              variant="success"
              size="lg"
              className="w-full"
              onClick={confirmBuy}
              disabled={buying}
            >
              {buying ? "Обработка..." : "Подтвердить оплату"}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-bg-secondary p-3 rounded-xl border border-border">
    <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">
      {label}
    </div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);
