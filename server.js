import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import Database from "better-sqlite3";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(join(__dirname, "uploads")));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, uuidv4() + "." + file.originalname.split(".").pop()),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const db = new Database("leshop.db");
db.pragma("journal_mode = WAL");

// Инициализация БД... (оставляем ваши CREATE TABLE запросы)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 0,
    frozen_balance REAL DEFAULT 0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    game TEXT,
    server TEXT,
    access_type TEXT DEFAULT 'full',
    title TEXT,
    battles INTEGER DEFAULT 0,
    winrate REAL DEFAULT 0,
    tier10 INTEGER DEFAULT 0,
    premiums INTEGER DEFAULT 0,
    description TEXT,
    price REAL,
    discount INTEGER DEFAULT 0,
    promo TEXT DEFAULT 'free',
    status TEXT DEFAULT 'pending',
    sold INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS listing_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER,
    filename TEXT
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER,
    buyer_id INTEGER,
    seller_id INTEGER,
    amount REAL,
    commission REAL,
    seller_amount REAL,
    status TEXT DEFAULT 'active',
    disputed INTEGER DEFAULT 0,
    chat_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    order_id INTEGER,
    user_id INTEGER
  );
  CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id INTEGER,
    user_id INTEGER,
    muted INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    from_id INTEGER,
    text TEXT,
    is_system INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const adminExists = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get(process.env.ADMIN_EMAIL);
if (!adminExists && process.env.ADMIN_EMAIL) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  db.prepare(
    "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
  ).run(process.env.ADMIN_NAME, process.env.ADMIN_EMAIL, hash, "admin", 99999);
  console.log("Admin создан:", process.env.ADMIN_EMAIL);
}

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error();
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Не авторизован" });
  }
};

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Заполните поля" });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(400).json({ error: "Email занят" });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
    .run(name, email, hash);
  const userId = result.lastInsertRowid;

  const chat = db
    .prepare("INSERT INTO chats (type, user_id) VALUES ('support', ?)")
    .run(userId);
  db.prepare(
    "INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)",
  ).run(chat.lastInsertRowid, userId);
  db.prepare(
    "INSERT INTO messages (chat_id, from_id, text, is_system) VALUES (?, 0, ?, 1)",
  ).run(chat.lastInsertRowid, "👋 Здравствуйте! Чем помочь?");

  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  delete user.password;

  res.json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Неверные данные" });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  delete user.password;
  res.json({ token, user });
});

app.get("/api/auth/me", auth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  delete user.password;
  res.json(user);
});

app.get("/api/listings", (req, res) => {
  const { game, access, server, sort } = req.query;
  let sql = `SELECT l.*, u.name as seller_name, u.avatar as seller_avatar 
             FROM listings l JOIN users u ON l.seller_id = u.id 
             WHERE l.status = 'approved' AND l.sold = 0`;
  const params = [];

  if (game && game !== "all") {
    sql += " AND l.game = ?";
    params.push(game);
  }
  if (access && access !== "all") {
    sql += " AND l.access_type = ?";
    params.push(access);
  }
  if (server && server !== "all") {
    sql += " AND l.server = ?";
    params.push(server);
  }

  sql += " ORDER BY CASE WHEN l.promo = 'premium' THEN 0 ELSE 1 END";
  if (sort === "asc") sql += ", l.price ASC";
  else if (sort === "desc") sql += ", l.price DESC";
  else sql += ", l.created_at DESC";

  const listings = db.prepare(sql).all(...params);

  const result = listings.map((l) => {
    const images = db
      .prepare("SELECT filename FROM listing_images WHERE listing_id = ?")
      .all(l.id)
      .map((i) => "/uploads/" + i.filename);
    return {
      ...l,
      images,
      final_price: Math.round(l.price * (1 - (l.discount || 0) / 100)),
    };
  });

  res.json(result);
});

app.get("/api/listings/:id", (req, res) => {
  const l = db
    .prepare(
      `SELECT l.*, u.name as seller_name, u.avatar as seller_avatar 
                        FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = ?`,
    )
    .get(req.params.id);
  if (!l) return res.status(404).json({ error: "Не найдено" });

  db.prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(
    req.params.id,
  );
  const images = db
    .prepare("SELECT filename FROM listing_images WHERE listing_id = ?")
    .all(l.id)
    .map((i) => "/uploads/" + i.filename);

  res.json({
    ...l,
    images,
    final_price: Math.round(l.price * (1 - (l.discount || 0) / 100)),
  });
});
// ==========================================
// СОЗДАНИЕ ОБЪЯВЛЕНИЯ И ЗАГРУЗКА КАРТИНОК
// ==========================================

app.post("/api/listings", auth, (req, res) => {
  try {
    const {
      game,
      server,
      access_type,
      title,
      battles,
      winrate,
      tier10,
      premiums,
      description,
      price,
      promo,
    } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "Название и цена обязательны" });
    }

    const result = db
      .prepare(
        `
      INSERT INTO listings (seller_id, game, server, access_type, title, battles, winrate, tier10, premiums, description, price, promo, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `,
      )
      .run(
        req.user.id,
        game,
        server,
        access_type,
        title,
        battles || 0,
        winrate || 0,
        tier10 || 0,
        premiums || 0,
        description || "",
        price,
        promo || "free",
      );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Ошибка БД при создании объявления:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.post(
  "/api/listings/:id/images",
  auth,
  upload.array("images", 6),
  (req, res) => {
    try {
      const listing = db
        .prepare("SELECT * FROM listings WHERE id = ? AND seller_id = ?")
        .get(req.params.id, req.user.id);
      if (!listing)
        return res
          .status(404)
          .json({ error: "Объявление не найдено или у вас нет прав" });

      if (req.files) {
        req.files.forEach((f) => {
          db.prepare(
            "INSERT INTO listing_images (listing_id, filename) VALUES (?, ?)",
          ).run(req.params.id, f.filename);
        });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Ошибка при сохранении картинок:", err);
      res.status(500).json({ error: "Ошибка при сохранении картинок" });
    }
  },
);

// ==========================================
app.post("/api/orders/buy/:listingId", auth, (req, res) => {
  const listing = db
    .prepare(
      "SELECT * FROM listings WHERE id = ? AND status = 'approved' AND sold = 0",
    )
    .get(req.params.listingId);
  if (!listing)
    return res
      .status(404)
      .json({ error: "Объявление не найдено или уже продано" });
  if (listing.seller_id === req.user.id)
    return res.status(400).json({ error: "Нельзя купить свой аккаунт" });

  const price = Math.round(listing.price * (1 - (listing.discount || 0) / 100));
  const buyer = db
    .prepare("SELECT balance FROM users WHERE id = ?")
    .get(req.user.id);
  if (buyer.balance < price)
    return res.status(400).json({ error: "Недостаточно средств" });

  // Атомарное обновление для предотвращения двойной покупки
  const updateRes = db
    .prepare("UPDATE listings SET sold = 1 WHERE id = ? AND sold = 0")
    .run(listing.id);
  if (updateRes.changes === 0)
    return res.status(400).json({ error: "Аккаунт только что купили" });

  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(
    price,
    req.user.id,
  );
  db.prepare(
    "INSERT INTO transactions (user_id, amount, description) VALUES (?, ?, ?)",
  ).run(req.user.id, -price, "Покупка: " + listing.title);

  const commission = Math.round(price * 0.1);
  const sellerAmount = price - commission;

  const order = db
    .prepare(
      `INSERT INTO orders (listing_id, buyer_id, seller_id, amount, commission, seller_amount) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      listing.id,
      req.user.id,
      listing.seller_id,
      price,
      commission,
      sellerAmount,
    );

  const chat = db
    .prepare("INSERT INTO chats (type, order_id) VALUES ('order', ?)")
    .run(order.lastInsertRowid);
  const chatId = chat.lastInsertRowid;

  db.prepare("UPDATE orders SET chat_id = ? WHERE id = ?").run(
    chatId,
    order.lastInsertRowid,
  );
  db.prepare(
    "INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)",
  ).run(chatId, req.user.id);
  db.prepare(
    "INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)",
  ).run(chatId, listing.seller_id);

  // Исправлено экранирование переноса строки
  db.prepare(
    "INSERT INTO messages (chat_id, from_id, text, is_system) VALUES (?, 0, ?, 1)",
  ).run(
    chatId,
    `📦 Заказ #${order.lastInsertRowid} оплачен!\n💰 ${price}₽\n\nПродавец, отправьте данные.\nПокупатель, нажмите "Подтвердить".`,
  );

  res.json({ orderId: order.lastInsertRowid, chatId });
});

// Дополнительные роуты чата и транзакций остаются без критичных изменений, они написаны верно...

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});

io.on("connection", (socket) => {
  socket.on("join_chat", (chatId) => socket.join(`chat_${chatId}`));
});
// Тестовое пополнение баланса (для MVP)
app.post("/api/users/topup", auth, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 10)
    return res.status(400).json({ error: "Минимум 10₽" });
  if (amount > 100000)
    return res.status(400).json({ error: "Максимум 100,000₽ за раз" });

  // Начисляем деньги
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(
    amount,
    req.user.id,
  );

  // Записываем в историю транзакций
  db.prepare(
    "INSERT INTO transactions (user_id, amount, description) VALUES (?, ?, ?)",
  ).run(req.user.id, amount, "Тестовое пополнение баланса");

  // Возвращаем обновленного юзера
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  delete user.password;
  res.json({ success: true, user });
});

// ==========================================
// АДМИН-ПАНЕЛЬ И МОДЕРАЦИЯ
// ==========================================

// Получить объявления, ожидающие модерации
app.get("/api/admin/listings", auth, (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "support")
    return res.status(403).json({ error: "Доступ запрещен" });

  const pending = db
    .prepare(
      `
    SELECT l.*, u.name as seller_name 
    FROM listings l JOIN users u ON l.seller_id = u.id 
    WHERE l.status = 'pending' ORDER BY l.created_at ASC
  `,
    )
    .all();
  res.json(pending);
});

// Одобрить или отклонить объявление
app.put("/api/admin/listings/:id/status", auth, (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "support")
    return res.status(403).json({ error: "Доступ запрещен" });

  const { status } = req.body; // 'approved' или 'rejected'
  db.prepare("UPDATE listings SET status = ? WHERE id = ?").run(
    status,
    req.params.id,
  );
  res.json({ success: true });
});

// Получить все чаты поддержки для админа
app.get("/api/admin/chats", auth, (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "support")
    return res.status(403).json({ error: "Доступ запрещен" });

  const chats = db
    .prepare(
      `
    SELECT c.*, u.name as other_name 
    FROM chats c JOIN users u ON c.user_id = u.id 
    WHERE c.type = 'support' ORDER BY c.id DESC
  `,
    )
    .all();
  res.json(chats);
});
