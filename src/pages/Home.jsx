import { Link } from "react-router-dom";
import { Shield, MessageSquare, Snowflake, Headphones } from "lucide-react";

export const Home = () => {
  return (
    <div className="space-y-12">
      <section className="relative text-center py-16">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float pointer-events-none" />

        <h1 className="text-4xl md:text-5xl font-black mb-4 relative z-10">
          Купи аккаунт
          <br />
          <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
            быстро и безопасно
          </span>
        </h1>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          Маркетплейс аккаунтов World of Tanks и WoT Blitz
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/catalog" className="btn-primary text-lg px-8 py-3">
            🛍 Каталог
          </Link>
          <Link to="/sell" className="btn-secondary text-lg px-8 py-3">
            💰 Продать
          </Link>
        </div>

        <div className="flex justify-center gap-10 mt-12 flex-wrap">
          <Stat value="500+" label="Аккаунтов" />
          <Stat value="12к+" label="Пользователей" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          🛡 Почему LeShop?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature
            icon={<Shield size={28} />}
            title="Гарант"
            desc="Деньги после подтверждения"
          />
          <Feature
            icon={<MessageSquare size={28} />}
            title="Чат"
            desc="Безопасная передача данных"
          />
          <Feature
            icon={<Snowflake size={28} />}
            title="Защита"
            desc="Замороженный баланс"
          />
          <Feature
            icon={<Headphones size={28} />}
            title="Поддержка"
            desc="Решение споров 24/7"
          />
        </div>
      </section>
    </div>
  );
};

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl font-black bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
      {value}
    </div>
    <div className="text-xs text-text-muted">{label}</div>
  </div>
);

const Feature = ({ icon, title, desc }) => (
  <div className="card p-5 text-center hover:-translate-y-1 hover:border-accent transition-all">
    <div className="text-accent mb-2 flex justify-center">{icon}</div>
    <h3 className="font-bold text-sm mb-1">{title}</h3>
    <p className="text-xs text-text-muted">{desc}</p>
  </div>
);
