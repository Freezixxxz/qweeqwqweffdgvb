import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-20 py-10">
      {/* Главный блок (Hero) */}
      <section className="relative bg-bg2 border border-brd rounded-3xl p-10 md:p-20 text-center overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Безопасный рынок аккаунтов <br />{" "}
            <span className="text-accent">World of Tanks</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto">
            Покупай и продавай аккаунты без риска. Деньги замораживаются
            гарантом до полной проверки и передачи данных.
          </p>
          <div className="flex justify-center flex-wrap gap-4 pt-4">
            <Link to="/catalog">
              <Button variant="primary" className="text-lg px-8 py-4">
                🛒 Перейти в каталог
              </Button>
            </Link>
            <Link to={user ? "/sell" : "/auth"}>
              <Button variant="secondary" className="text-lg px-8 py-4">
                💰 Продать аккаунт
              </Button>
            </Link>
          </div>
        </div>

        {/* Декоративные свечения на фоне */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
      </section>

      {/* Блок преимуществ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-8 bg-bg2 border border-brd rounded-2xl text-center hover:border-accent transition-colors duration-300">
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-xl font-bold mb-2">Безопасная сделка</h3>
          <p className="text-text-secondary">
            Мы удерживаем средства покупателя до тех пор, пока он не подтвердит
            получение аккаунта.
          </p>
        </div>

        <div className="card p-8 bg-bg2 border border-brd rounded-2xl text-center hover:border-accent transition-colors duration-300">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-2">Быстрая передача</h3>
          <p className="text-text-secondary">
            Специальный защищенный чат между продавцом и покупателем появляется
            сразу после оплаты.
          </p>
        </div>

        <div className="card p-8 bg-bg2 border border-brd rounded-2xl text-center hover:border-accent transition-colors duration-300">
          <div className="text-5xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-2">Низкая комиссия</h3>
          <p className="text-text-secondary">
            Всего 10% комиссии с успешных продаж. Публикация базовых объявлений
            — абсолютно бесплатно.
          </p>
        </div>
      </section>

      {/* Футер для вида */}
      <footer className="border-t border-brd pt-8 pb-4 text-center text-sm text-text-secondary">
        <p>© 2026 LeShop. Все права защищены.</p>
      </footer>
    </div>
  );
};
