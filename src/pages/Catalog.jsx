import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { Button } from "../components/ui/Button";

export const Catalog = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Простые фильтры для MVP
  const [filters, setFilters] = useState({
    game: "all",
    sort: "newest",
  });

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/listings", { params: filters });
      setListings(data);
    } catch (e) {
      console.error("Ошибка загрузки каталога", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-bg2 p-4 rounded-xl border border-brd">
        <h1 className="text-2xl font-bold">🛒 Каталог аккаунтов</h1>

        <div className="flex gap-4">
          <select
            className="bg-bg border border-brd rounded-lg p-2 text-white outline-none"
            value={filters.game}
            onChange={(e) => setFilters({ ...filters, game: e.target.value })}
          >
            <option value="all">Все игры</option>
            <option value="wot">World of Tanks</option>
            <option value="wotb">WoT Blitz</option>
          </select>

          <select
            className="bg-bg border border-brd rounded-lg p-2 text-white outline-none"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Сначала новые</option>
            <option value="asc">Сначала дешевые</option>
            <option value="desc">Сначала дорогие</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-secondary text-xl">
          Загрузка товаров...
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-bg2 rounded-xl border border-brd">
          <span className="text-4xl">🏜️</span>
          <p className="text-text-secondary mt-4">
            Пока нет активных объявлений. Будьте первым!
          </p>
          <Link to="/sell">
            <Button variant="primary" className="mt-4">
              Продать аккаунт
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((l) => (
            <Link
              key={l.id}
              to={`/listing/${l.id}`}
              className="group card bg-bg2 border border-brd rounded-xl overflow-hidden hover:border-accent transition-colors flex flex-col"
            >
              {/* Картинка товара */}
              <div className="h-48 bg-bg relative overflow-hidden">
                {l.images && l.images.length > 0 ? (
                  <img
                    src={`http://localhost:3000${l.images[0]}`}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎮
                  </div>
                )}
                {l.promo === "premium" && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                    PREMIUM
                  </div>
                )}
              </div>

              {/* Инфо */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-text-secondary mb-1 flex justify-between">
                  <span>
                    {l.game === "wot" ? "World of Tanks" : "WoT Blitz"}
                  </span>
                  <span>{l.server}</span>
                </div>
                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                  {l.title}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-4 bg-bg p-2 rounded-lg">
                  <div>⚔️ {l.battles} боев</div>
                  <div>🏆 {l.winrate}%</div>
                  <div>⭐ {l.tier10} топов</div>
                  <div>💰 {l.premiums} прем.</div>
                </div>

                <div className="mt-auto flex justify-between items-center">
                  <div className="font-bold text-xl text-accent">
                    {l.final_price} ₽
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-1">
                    <div className="w-5 h-5 bg-brd rounded-full flex items-center justify-center text-[10px] text-white overflow-hidden">
                      {l.seller_avatar ? (
                        <img src={`http://localhost:3000${l.seller_avatar}`} />
                      ) : (
                        l.seller_name[0].toUpperCase()
                      )}
                    </div>
                    {l.seller_name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
