import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { Button } from "../components/ui/Button";

export const Catalog = () => {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({
    game: "all",
    access: "all",
    server: "all",
    price_from: "",
    price_to: "",
    sort: "new",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== "all") params.append(key, val);
      });

      // ИСПРАВЛЕНО: обратные кавычки вместо прямых слэшей
      const { data } = await api.get(`/api/listings?${params}`);
      setListings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🛍️ Каталог</h1>
        <span className="text-text-muted text-sm">{listings.length} акк.</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border">
        <FilterChip
          label="Все"
          active={filters.game === "all"}
          onClick={() => setFilters((f) => ({ ...f, game: "all" }))}
        />
        <FilterChip
          label="WoT"
          active={filters.game === "wot"}
          onClick={() => setFilters((f) => ({ ...f, game: "wot" }))}
        />
        <FilterChip
          label="Blitz"
          active={filters.game === "wotb"}
          onClick={() => setFilters((f) => ({ ...f, game: "wotb" }))}
        />

        <div className="w-px h-6 bg-border" />

        <select
          className="input w-24 text-xs py-1.5"
          value={filters.server}
          onChange={(e) =>
            setFilters((f) => ({ ...f, server: e.target.value }))
          }
        >
          <option value="all">Все сервера</option>
          <option value="RU">RU</option>
          <option value="EU">EU</option>
          <option value="NA">NA</option>
          <option value="ASIA">ASIA</option>
        </select>

        <div className="w-px h-6 bg-border" />

        <input
          type="number"
          placeholder="От"
          className="input w-20 text-xs py-1.5"
          value={filters.price_from}
          onChange={(e) =>
            setFilters((f) => ({ ...f, price_from: e.target.value }))
          }
        />
        <span className="text-text-muted">—</span>
        <input
          type="number"
          placeholder="До"
          className="input w-20 text-xs py-1.5"
          value={filters.price_to}
          onChange={(e) =>
            setFilters((f) => ({ ...f, price_to: e.target.value }))
          }
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? "bg-accent/20 text-accent border border-accent"
        : "bg-bg-card border border-border text-text-secondary hover:border-accent"
    }`}
  >
    {label}
  </button>
);

const ListingCard = ({ listing }) => {
  const finalPrice = Math.round(
    listing.price * (1 - (listing.discount || 0) / 100),
  );

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="card group hover:-translate-y-1 hover:border-accent transition-all"
    >
      <div className="h-28 relative bg-bg-secondary overflow-hidden">
        {listing.images?.[0] ? (
          <img src={listing.images[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            {listing.game === "wot" ? "🎖️" : "📱"}
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
          {listing.discount > 0 && (
            <span className="px-1.5 py-0.5 bg-danger/90 text-white text-[10px] font-bold rounded">
              -{listing.discount}%
            </span>
          )}
          {listing.promo === "premium" && (
            <span className="px-1.5 py-0.5 bg-warning/90 text-white text-[10px] font-bold rounded">
              ⭐
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded text-white ${
              listing.access_type === "full" ? "bg-success/90" : "bg-accent/90"
            }`}
          >
            {listing.access_type === "full" ? "🔓" : "🔒"}
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <div
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1.5 ${
            listing.game === "wot"
              ? "bg-red-500/15 text-red-400"
              : "bg-orange-500/15 text-orange-400"
          }`}
        >
          {listing.game === "wot" ? "WoT" : "Blitz"}
        </div>

        <h3 className="font-bold text-xs mb-2 line-clamp-2 leading-tight min-h-[2rem]">
          {listing.title}
        </h3>

        <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
          <div>
            <div className="text-text-muted uppercase text-[8px]">Бои</div>
            <div className="font-semibold">
              {(listing.battles || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-text-muted uppercase text-[8px]">WR</div>
            <div className="font-semibold">{listing.winrate || 0}%</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-sm font-bold text-success">
              {finalPrice.toLocaleString()}₽
            </span>
            {listing.discount > 0 && (
              <span className="text-[10px] text-text-muted line-through ml-1">
                {listing.price?.toLocaleString()}
              </span>
            )}
          </div>
          <Button size="sm" variant="success" className="!px-2 !py-1">
            💳
          </Button>
        </div>
      </div>
    </Link>
  );
};
