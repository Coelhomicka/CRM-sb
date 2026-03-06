import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Payment } from 'mercadopago';

dotenv.config();

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN-PLACEHOLDER' 
});
const payment = new Payment(client);

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const db = new Database('tabacaria.db');

// Database Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    phone TEXT,
    points INTEGER DEFAULT 0,
    role TEXT DEFAULT 'customer'
  );

  -- Ensure columns exist for existing databases
  PRAGMA table_info(users);
`);

// Migration for existing databases
try {
  db.prepare('ALTER TABLE users ADD COLUMN name TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE users ADD COLUMN phone TEXT').run();
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT,
    description TEXT,
    price REAL,
    stock INTEGER,
    image_url TEXT,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    payment_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  );
`);

// Seed initial data if empty
const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('admin@smookingbrother.com', hashedPassword, 'seller');
    
    // Categories
    const categories = ['Charutos', 'Narguilés', 'Acessórios', 'Essências'];
    const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
    categories.forEach(cat => insertCategory.run(cat));

    // Products
    const insertProduct = db.prepare('INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)');
    insertProduct.run(1, 'Charuto Cohiba Behike', 'Charuto premium cubano.', 450.00, 10, 'https://picsum.photos/seed/cohiba/400/300');
    insertProduct.run(2, 'Narguilé Stem Hookah', 'Narguilé de alta performance.', 850.00, 5, 'https://picsum.photos/seed/narguile/400/300');
    insertProduct.run(3, 'Isqueiro Zippo Classic', 'Isqueiro recarregável à prova de vento.', 120.00, 20, 'https://picsum.photos/seed/zippo/400/300');
    insertProduct.run(4, 'Essência Zomo Menta', 'Essência refrescante para narguilé.', 15.00, 50, 'https://picsum.photos/seed/zomo/400/300');
  }
};
seedData();

app.use(cors());
app.use(express.json());

// Middleware for authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

// Auth
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)').run(email, hashedPassword, name, phone);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret');
    console.log(`Login successful for ${email}, role: ${user.role}`);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, points: user.points } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, email, role, points, name, phone FROM users WHERE id = ?').get(req.user.id) as any;
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Products & Categories
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id').all();
  res.json(products);
});

// Orders
app.post('/api/orders', authenticateToken, (req: any, res) => {
  const { items, total_amount } = req.body;
  const user_id = req.user.id;

  const transaction = db.transaction(() => {
    const orderResult = db.prepare('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)').run(user_id, total_amount);
    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of items) {
      insertItem.run(orderId, item.id, item.quantity, item.price);
      updateStock.run(item.quantity, item.id);
    }

    // Update points (1 point per 10 BRL)
    const pointsEarned = Math.floor(total_amount / 10);
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsEarned, user_id);

    return orderId;
  });

  try {
    const orderId = transaction();
    res.json({ orderId, message: 'Order created successfully. Simulate PIX payment next.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders/my', authenticateToken, (req: any, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(orders);
});

// Mercado Pago Payment Processing
app.post('/api/payments/process', authenticateToken, async (req: any, res) => {
  const { payment_method, order_id, card_data } = req.body;
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let paymentResponse;

    if (payment_method === 'pix') {
      // Create PIX payment
      paymentResponse = await payment.create({
        body: {
          transaction_amount: order.total_amount,
          description: `Pedido #${order.id} - Smooking Brother`,
          payment_method_id: 'pix',
          notification_url: `${APP_URL}/api/payments/webhook`,
          payer: {
            email: req.user.email,
          },
        }
      });
    } else if (payment_method === 'card') {
      // Create Card payment
      console.log('Processing Card Payment for Order:', order.id);
      console.log('Card Data Received:', { ...card_data, token: '***' });
      
      paymentResponse = await payment.create({
        body: {
          transaction_amount: order.total_amount,
          token: card_data.token,
          description: `Pedido #${order.id} - Smooking Brother`,
          installments: card_data.installments || 1,
          payment_method_id: card_data.payment_method_id,
          issuer_id: card_data.issuer_id,
          notification_url: `${APP_URL}/api/payments/webhook`,
          payer: {
            email: req.user.email,
          },
        }
      });
      console.log('Mercado Pago Response Status:', paymentResponse.status);
    }

    if (paymentResponse && (paymentResponse.status === 'approved' || paymentResponse.status === 'pending')) {
      // Update order with payment ID and status if approved
      const status = paymentResponse.status === 'approved' ? 'paid' : 'pending';
      db.prepare('UPDATE orders SET payment_id = ?, status = ? WHERE id = ?').run(paymentResponse.id?.toString(), status, order.id);
      
      res.json({
        status: paymentResponse.status,
        payment_id: paymentResponse.id,
        qr_code: paymentResponse.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64,
      });
    } else {
      console.error('Pagamento não aprovado pelo Mercado Pago:', paymentResponse);
      const errorMsg = paymentResponse.status_detail || 'Pagamento recusado ou falhou.';
      res.status(400).json({ 
        error: `Pagamento ${paymentResponse.status}: ${errorMsg}`, 
        details: paymentResponse 
      });
    }
  } catch (error: any) {
    console.error('Erro interno no processamento do Mercado Pago:', error);
    // Log more details if available
    if (error.cause) console.error('Causa do erro:', JSON.stringify(error.cause));
    
    res.status(500).json({ 
      error: 'Erro interno ao processar pagamento', 
      message: error.message,
      cause: error.cause 
    });
  }
});

// Webhook for Mercado Pago notifications
app.post('/api/payments/webhook', async (req: any, res) => {
  const { action, data } = req.body;
  console.log('Mercado Pago Webhook Received:', { action, data });

  if (action === 'payment.created' || action === 'payment.updated') {
    try {
      const paymentId = data.id;
      const mpResponse = await payment.get({ id: paymentId });
      
      if (mpResponse.status === 'approved') {
        const externalReference = mpResponse.description; // We put "Pedido #ID" in description
        const orderIdMatch = externalReference?.match(/#(\d+)/);
        
        if (orderIdMatch) {
          const orderId = orderIdMatch[1];
          console.log(`Updating Order ${orderId} to 'paid' via Webhook`);
          db.prepare('UPDATE orders SET status = ?, payment_id = ? WHERE id = ?').run('paid', paymentId.toString(), orderId);
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  res.sendStatus(200);
});

// Seller Routes - Orders
app.get('/api/seller/orders', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const orders = db.prepare(`
    SELECT o.*, u.email as customer_email 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    ORDER BY created_at DESC
  `).all();
  res.json(orders);
});

app.patch('/api/seller/orders/:id/status', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.post('/api/seller/orders/:id/cancel', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const orderId = req.params.id;
  
  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) throw new Error('Order not found');
    
    // Restore stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];
    const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    // Deduct points
    const pointsToDeduct = Math.floor(order.total_amount / 10);
    db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(pointsToDeduct, order.user_id);

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', orderId);
  });

  try {
    transaction();
    res.json({ success: true, message: 'Order cancelled and stock restored.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Seller Routes - Products & Categories Management
app.post('/api/seller/categories', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const { name } = req.body;
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    res.json({ id: result.lastInsertRowid, name });
  } catch (e) {
    res.status(400).json({ error: 'Category already exists' });
  }
});

app.patch('/api/seller/categories/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const { name } = req.body;
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ success: true });
});

app.delete('/api/seller/categories/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Cannot delete category with products' });
  }
});

app.post('/api/seller/products', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const { category_id, name, description, price, stock, image_url } = req.body;
  const result = db.prepare('INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)').run(category_id, name, description, price, stock, image_url);
  res.json({ id: result.lastInsertRowid });
});

app.patch('/api/seller/products/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  const { category_id, name, description, price, stock, image_url } = req.body;
  db.prepare(`
    UPDATE products 
    SET category_id = ?, name = ?, description = ?, price = ?, stock = ?, image_url = ? 
    WHERE id = ?
  `).run(category_id, name, description, price, stock, image_url, req.params.id);
  res.json({ success: true });
});

app.delete('/api/seller/products/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Dashboard Stats
app.get('/api/seller/stats', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'seller') return res.sendStatus(403);
  
  const totalRevenue = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'").get() as any;
  const monthlyRevenue = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled' AND created_at >= date('now', 'start of month')").get() as any;
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status != 'cancelled'").get() as any;
  const newCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND id IN (SELECT user_id FROM orders)").get() as any;
  
  const topProducts = db.prepare(`
    SELECT p.name, SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  const topCustomers = db.prepare(`
    SELECT u.name, u.phone, SUM(o.total_amount) as total_spent
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status != 'cancelled'
    GROUP BY u.id
    ORDER BY total_spent DESC
    LIMIT 5
  `).all();

  const revenueHistory = db.prepare(`
    SELECT date(created_at) as date, SUM(total_amount) as total
    FROM orders
    WHERE status != 'cancelled' AND created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  res.json({
    revenue: totalRevenue.total || 0,
    monthlyRevenue: monthlyRevenue.total || 0,
    avgTicket: totalOrders.count > 0 ? (totalRevenue.total / totalOrders.count) : 0,
    newCustomers: newCustomers.count,
    topProducts,
    topCustomers,
    revenueHistory
  });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
