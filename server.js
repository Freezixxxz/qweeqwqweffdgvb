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

// Инициализация
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// CORS для React
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Создаем папки
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, uuidv4() + "." + file.originalname.split(".").pop()),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// SQLite
const db = new Database("leshop.db");
db.pragma("journal_mode = WAL");

// Инициализация БД
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
  
  CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    buyer_id INTEGER,
    seller_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'open',
    resolution TEXT,
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

// Создаем админа
const adminExists = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get(process.env.ADMIN_EMAIL);
if (!adminExists) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  db.prepare(
    "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
  ).run(process.env.ADMIN_NAME, process.env.ADMIN_EMAIL, hash, "admin", 99999);
  console.log("Admin создан:", process.env.ADMIN_EMAIL);
}

// Middleware auth
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Нет токена");
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Не авторизован" });
  }
};

// Роуты

// Auth
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

  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  res.json({
    token,
    user: { id: userId, name, email, role: "user", balance: 0 },
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Неверные данные" });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token, user: { ...user, password: undefined } });
});

app.get("/api/auth/me", auth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ ...user, password: undefined });
});

// Listings
app.get("/api/listings", (req, res) => {
  const { game, access, server, price_from, price_to, sort } = req.query;
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

  sql += ' ORDER BY CASE WHEN l.promo = "premium" THEN 0 ELSE 1 END';
  if (sort === "asc") sql += ", l.price ASC";
  else if (sort === "desc") sql += ", l.price DESC";
  else sql += ", l.created_at DESC";

  const listings = db.prepare(sql).all(...params);

  const result = listings
    .map((l) => {
      const images = db
        .prepare("SELECT filename FROM listing_images WHERE listing_id = ?")
        .all(l.id)
        .map((i) => "/uploads/" + i.filename);
      const finalPrice = Math.round(l.price * (1 - l.discount / 100));
      if (price_from && finalPrice < parseInt(price_from)) return null;
      if (price_to && finalPrice > parseInt(price_to)) return null;
      return { ...l, images, final_price: finalPrice };
    })
    .filter(Boolean);

  res.json(result);
});

app.get("/api/listings/:id", (req, res) => {
  const l = db
    .prepare(
      `SELECT l.*, u.name as seller_name, u.avatar as seller_avatar 
                        FROM listings l JOIN users u ON l.seller_id = u.id 
                        WHERE l.id = ?`,
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
    final_price: Math.round(l.price * (1 - l.discount / 100)),
  });
});

app.post("/api/listings", auth, (req, res) => {
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
  if (!title || !price)
    return res.status(400).json({ error: "Название и цена обязательны" });

  let fee = 0;
  if (promo === "premium") {
    if (price <= 500) fee = 19;
    else if (price <= 1000) fee = 34;
    else if (price <= 2500) fee = 49;
    else if (price <= 5000) fee = 79;
    else fee = 129;

    const user = db
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(req.user.id);
    if (user.balance < fee)
      return res.status(400).json({ error: "Недостаточно средств" });
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(
      fee,
      req.user.id,
    );
  }

  const result = db
    .prepare(
      `INSERT INTO listings 
    (seller_id, game, server, access_type, title, battles, winrate, tier10, premiums, description, price, promo) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      req.user.id,
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
    );

  res.json({ id: result.lastInsertRowid, fee });
});

app.post(
  "/api/listings/:id/images",
  auth,
  upload.array("images", 6),
  (req, res) => {
    const listing = db
      .prepare("SELECT * FROM listings WHERE id = ? AND seller_id = ?")
      .get(req.params.id, req.user.id);
    if (!listing) return res.status(404).json({ error: "Не найдено" });
    req.files.forEach((f) =>
      db
        .prepare(
          "INSERT INTO listing_images (listing_id, filename) VALUES (?, ?)",
        )
        .run(req.params.id, f.filename),
    );
    res.json({ count: req.files.length });
  },
);

app.put("/api/listings/:id/discount", auth, (req, res) => {
  const { discount } = req.body;
  const listing = db
    .prepare("SELECT * FROM listings WHERE id = ? AND seller_id = ?")
    .get(req.params.id, req.user.id);
  if (!listing) return res.status(404).json({ error: "Не найдено" });
  db.prepare("UPDATE listings SET discount = ? WHERE id = ?").run(
    Math.min(90, Math.max(0, discount)),
    req.params.id,
  );
  res.json({ success: true });
});

// Orders
app.post("/api/orders/buy/:listingId", auth, (req, res) => {
  const listing = db
    .prepare(
      "SELECT * FROM listings WHERE id = ? AND status = 'approved' AND sold = 0",
    )
    .get(req.params.listingId);
  if (!listing) return res.status(404).json({ error: "Не найдено" });
  if (listing.seller_id === req.user.id)
    return res.status(400).json({ error: "Свой аккаунт" });

  const price = Math.round(listing.price * (1 - listing.discount / 100));
  const buyer = db
    .prepare("SELECT balance FROM users WHERE id = ?")
    .get(req.user.id);
  if (buyer.balance < price)
    return res.status(400).json({ error: "Недостаточно средств" });

  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(
    price,
    req.user.id,
  );
  db.prepare("UPDATE listings SET sold = 1 WHERE id = ?").run(listing.id);

  const commission = Math.round(price * 0.1);
  const sellerAmount = price - commission;
  const order = db
    .prepare(
      `INSERT INTO orders (listing_id, buyer_id, seller_id, amount, commission, seller_amount) 
    VALUES (?, ?, ?, ?, ?, ?)`,
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
  db.prepare(
    "INSERT INTO messages (chat_id, from_id, text, is_system) VALUES (?, 0, ?, 1)",
  ).run(
    chatId,
    `📦 Заказ #${order.lastInsertRowid} оплачен!\\n💰 ${price}₽\\n\\nПродавец, отправьте данные.\\nПокупатель, нажмите "Подтвердить".`,
  );

  res.json({ orderId: order.lastInsertRowid, chatId });
});

app.get("/api/orders/my/purchases", auth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.*, l.title FROM orders o JOIN listings l ON l.id = o.listing_id WHERE o.buyer_id = ? ORDER BY o.created_at DESC`,
    )
    .all(req.user.id);
  res.json(orders);
});

// Chats
app.get("/api/chats", auth, (req, res) => {
  const chats = db
    .prepare(
      `SELECT c.*, cp.muted FROM chats c 
    JOIN chat_participants cp ON cp.chat_id = c.id WHERE cp.user_id = ?`,
    )
    .all(req.user.id);

  const result = chats.map((c) => {
    const lastMsg = db
      .prepare(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT 1",
      )
      .get(c.id);
    const unread = db
      .prepare(
        "SELECT COUNT(*) as cnt FROM messages WHERE chat_id = ? AND from_id != ? AND read = 0",
      )
      .get(c.id, req.user.id).cnt;
    const participants = db
      .prepare(
        "SELECT u.id, u.name, u.avatar FROM chat_participants cp JOIN users u ON u.id = cp.user_id WHERE cp.chat_id = ?",
      )
      .all(c.id);
    const other = participants.find((p) => p.id !== req.user.id);
    return { ...c, last_message: lastMsg, unread, other_user: other };
  });

  res.json(
    result.sort(
      (a, b) => (b.last_message?.id || 0) - (a.last_message?.id || 0),
    ),
  );
});

app.get("/api/chats/:id/messages", auth, (req, res) => {
  const participant = db
    .prepare(
      "SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?",
    )
    .get(req.params.id, req.user.id);
  if (!participant) return res.status(403).json({ error: "Нет доступа" });

  db.prepare(
    "UPDATE messages SET read = 1 WHERE chat_id = ? AND from_id != ?",
  ).run(req.params.id, req.user.id);
  const messages = db
    .prepare(
      `SELECT m.*, u.name as sender_name FROM messages m 
    LEFT JOIN users u ON u.id = m.from_id WHERE m.chat_id = ? ORDER BY m.created_at`,
    )
    .all(req.params.id);
  res.json({ messages });
});

app.post("/api/chats/:id/messages", auth, (req, res) => {
  const { text } = req.body;
  const participant = db
    .prepare(
      "SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?",
    )
    .get(req.params.id, req.user.id);
  if (!participant) return res.status(403).json({ error: "Нет доступа" });

  const msg = db
    .prepare("INSERT INTO messages (chat_id, from_id, text) VALUES (?, ?, ?)")
    .run(req.params.id, req.user.id, text);
  const newMsg = db
    .prepare(
      "SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON u.id = m.from_id WHERE m.id = ?",
    )
    .get(msg.lastInsertRowid);

  io.to(`chat_${req.params.id}`).emit("new_message", newMsg);
  res.json(newMsg);
});

// Transactions
app.get("/api/transactions", auth, (req, res) => {
  const txs = db
    .prepare(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(req.user.id);
  res.json(txs);
});

// Stats
app.get("/api/stats/public", (req, res) => {
  const listings = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM listings WHERE status = 'approved' AND sold = 0",
    )
    .get();
  const users = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
  res.json({ listings: listings.cnt, users: users.cnt });
});

// Запуск
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});

io.on("connection", (socket) => {
  socket.on("join_chat", (chatId) => socket.join(`chat_${chatId}`));
});
