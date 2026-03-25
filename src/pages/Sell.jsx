import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom"; // <-- Добавили Navigate
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export const Sell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    game: "wot",
    server: "RU",
    access_type: "full",
    title: "",
    battles: 0,
    winrate: 0,
    tier10: 0,
    premiums: 0,
    description: "",
    price: "",
    promo: "free",
  });

  // Защита роута (если не авторизован - на логин)
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 6) {
      alert("Максимум 6 фотографий!");
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return alert("Введите название и цену");

    setLoading(true);
    try {
      // 1. Создаем объявление (отправляем JSON)
      const { data } = await api.post("/api/listings", {
        ...form,
        battles: Number(form.battles),
        winrate: Number(form.winrate),
        tier10: Number(form.tier10),
        premiums: Number(form.premiums),
        price: Number(form.price),
      });

      // 2. Если есть картинки, загружаем их
      if (images.length > 0 && data.id) {
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img));

        await api.post(`/api/listings/${data.id}/images`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert("🎉 Объявление успешно создано и отправлено на модерацию!");
      navigate("/profile"); // Отправляем в профиль смотреть статус
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка при создании");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💰 Продать аккаунт</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Блок фотографий */}
        <div className="card p-6 bg-bg2 border border-brd rounded-xl">
          <h2 className="text-lg font-semibold mb-4">
            📸 Скриншоты (до 6 шт.)
          </h2>
          <div className="flex gap-4 flex-wrap">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-24 h-24 border border-brd rounded-lg overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-md w-6 h-6 text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="w-24 h-24 border-2 border-dashed border-brd rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                <span className="text-2xl text-text-secondary">+</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Основная информация */}
        <div className="card p-6 bg-bg2 border border-brd rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">🎮 Информация</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Игра
              </label>
              <select
                className="w-full bg-bg border border-brd rounded-lg p-2 text-white"
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
              >
                <option value="wot">World of Tanks</option>
                <option value="wotb">WoT Blitz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Сервер
              </label>
              <select
                className="w-full bg-bg border border-brd rounded-lg p-2 text-white"
                value={form.server}
                onChange={(e) => setForm({ ...form, server: e.target.value })}
              >
                <option value="RU">RU</option>
                <option value="EU">EU</option>
                <option value="NA">NA</option>
                <option value="ASIA">ASIA</option>
              </select>
            </div>
          </div>

          <Input
            label="Название *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Краткое описание аккаунта"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Бои"
              type="number"
              value={form.battles}
              onChange={(e) => setForm({ ...form, battles: e.target.value })}
            />
            <Input
              label="Винрейт (%)"
              type="number"
              step="0.1"
              value={form.winrate}
              onChange={(e) => setForm({ ...form, winrate: e.target.value })}
            />
            <Input
              label="Топов (X лвл)"
              type="number"
              value={form.tier10}
              onChange={(e) => setForm({ ...form, tier10: e.target.value })}
            />
            <Input
              label="Премиум танков"
              type="number"
              value={form.premiums}
              onChange={(e) => setForm({ ...form, premiums: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Описание
            </label>
            <textarea
              className="w-full bg-bg border border-brd rounded-lg p-3 text-white min-h-[100px]"
              placeholder="Дополнительная информация..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* Цена и Тариф */}
        <div className="card p-6 bg-bg2 border border-brd rounded-xl">
          <h2 className="text-lg font-semibold mb-4">💵 Цена</h2>
          <Input
            label="Цена (₽) *"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 text-lg"
          disabled={loading}
        >
          {loading ? "Публикация..." : "📤 Разместить объявление"}
        </Button>
      </form>
    </div>
  );
};
