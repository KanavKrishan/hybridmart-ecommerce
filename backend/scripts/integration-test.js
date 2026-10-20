/**
 * Runs the required API scenarios against a live Express + MongoDB + SQLite stack.
 * Optionally checks Flask analytics if it is already running on port 5001.
 */
process.env.SQL_DIALECT = 'sqlite';
process.env.SQLITE_PATH = './data/test.sqlite';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/hybrid_ecommerce_test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.ANALYTICS_URL = 'http://127.0.0.1:5001';

const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { connectSql, getSql } = require('../config/db');
const { connectMongo } = require('../config/mongo');
const app = require('../app');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');

const sqliteFile = path.join(__dirname, '..', 'data', 'test.sqlite');

function assert(condition, label) {
  if (!condition) throw new Error('FAILED: ' + label);
  console.log('PASSED:', label);
}

async function resetData() {
  if (fs.existsSync(sqliteFile)) fs.unlinkSync(sqliteFile);
  await connectSql();
  await connectMongo();
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Review.deleteMany({});
  const sql = getSql();
  await sql.execute('DELETE FROM order_items');
  await sql.execute('DELETE FROM orders');
  await sql.execute('DELETE FROM products');
  await sql.execute('DELETE FROM users');

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const userHash = await bcrypt.hash('Customer@123', 10);
  const otherHash = await bcrypt.hash('Other@123', 10);
  await sql.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Admin', 'admin@hybridstore.test', adminHash, 'admin']
  );
  await sql.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Customer', 'customer@hybridstore.test', userHash, 'customer']
  );
  await sql.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Other', 'other@hybridstore.test', otherHash, 'customer']
  );
  await sql.execute(
    `INSERT INTO products (name, description, price, stock, category, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Notebook', 'A ruled notebook', 100, 5, 'Books', 'https://picsum.photos/seed/nb/200']
  );
  await sql.execute(
    `INSERT INTO products (name, description, price, stock, category, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Pen', 'Blue ball pen', 20, 0, 'Books', 'https://picsum.photos/seed/pen/200']
  );
}

async function main() {
  const results = [];
  await resetData();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const api = axios.create({
    baseURL: `http://127.0.0.1:${port}/api`,
    validateStatus: () => true
  });

  try {
    const register = await api.post('/auth/register', {
      name: 'New User',
      email: 'newuser@hybridstore.test',
      password: 'Secret123',
      role: 'admin'
    });
    assert(register.status === 201, 'Register a new user');
    assert(register.data.user.role === 'customer', 'Registration ignores requested admin role');

    const badLogin = await api.post('/auth/login', {
      email: 'newuser@hybridstore.test',
      password: 'wrong'
    });
    assert(badLogin.status === 401, 'Log in with invalid credentials');

    const goodLogin = await api.post('/auth/login', {
      email: 'customer@hybridstore.test',
      password: 'Customer@123'
    });
    assert(goodLogin.status === 200, 'Log in with valid credentials');
    const token = goodLogin.data.token;
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const catalog = await api.get('/products?search=Note');
    assert(catalog.status === 200 && catalog.data.products.length === 1, 'Browse and search products');

    const addCart = await api.post('/cart/items', { product_id: 1, quantity: 2 }, auth);
    assert(addCart.status === 201 && addCart.data.items[0].quantity === 2, 'Add cart items');

    const updateCart = await api.patch('/cart/items/1', { quantity: 1 }, auth);
    assert(updateCart.status === 200 && updateCart.data.items[0].quantity === 1, 'Update cart quantity');

    const wish = await api.post('/wishlist/items', { product_id: 1 }, auth);
    assert(wish.status === 201 && wish.data.products.length === 1, 'Add wishlist item');

    const removeWish = await api.delete('/wishlist/items/1', auth);
    assert(removeWish.status === 200 && removeWish.data.products.length === 0, 'Remove wishlist item');

    const emptyCheckoutUser = await api.post(
      '/auth/login',
      { email: 'other@hybridstore.test', password: 'Other@123' }
    );
    const otherToken = emptyCheckoutUser.data.token;
    const otherAuth = { headers: { Authorization: `Bearer ${otherToken}` } };
    const emptyCheckout = await api.post('/orders/checkout', {}, otherAuth);
    assert(emptyCheckout.status === 400, 'Reject checkout for an empty cart');

    const oversellCart = await api.post('/cart/items', { product_id: 2, quantity: 1 }, otherAuth);
    assert(oversellCart.status === 409, 'Reject add-to-cart when stock is zero');

    const sql = getSql();
    await sql.execute('UPDATE products SET stock = 0 WHERE id = 1');
    const failCheckout = await api.post('/orders/checkout', {}, auth);
    assert(failCheckout.status === 409, 'Reject checkout when stock is insufficient');
    const cartAfterFail = await api.get('/cart', auth);
    assert(cartAfterFail.data.items.length === 1, 'Cart is not cleared when SQL checkout fails');

    await sql.execute('UPDATE products SET stock = 5 WHERE id = 1');
    const okCheckout = await api.post('/orders/checkout', {}, auth);
    assert(okCheckout.status === 201, 'Complete a valid checkout');
    const stockRows = await sql.query('SELECT stock FROM products WHERE id = 1');
    assert(Number(stockRows[0].stock) === 4, 'Stock decreases after checkout');
    const cartAfterOk = await api.get('/cart', auth);
    assert(cartAfterOk.data.items.length === 0, 'Cart is cleared after successful checkout');

    const history = await api.get('/orders/mine', auth);
    assert(history.status === 200 && history.data.orders.length === 1, 'Order history is correct');

    const review = await api.post(
      '/reviews',
      { product_id: 1, rating: 5, comment: 'Useful notebook' },
      auth
    );
    assert(review.status === 201, 'Submit a product review after purchase');
    const reviews = await api.get('/reviews/product/1');
    assert(reviews.data.review_count === 1, 'View product reviews');

    const stolen = await api.get('/orders/1', otherAuth);
    assert(stolen.status === 403, 'Customer cannot access another customer order');

    const adminDenied = await api.get('/orders/admin', auth);
    assert(adminDenied.status === 403, 'Customer cannot access admin APIs');

    const adminLogin = await api.post('/auth/login', {
      email: 'admin@hybridstore.test',
      password: 'Admin@123'
    });
    const adminAuth = { headers: { Authorization: `Bearer ${adminLogin.data.token}` } };
    const adminOrders = await api.get('/orders/admin', adminAuth);
    assert(adminOrders.status === 200, 'Admin can list all orders');

    const analyticsHealth = await axios.get('http://127.0.0.1:5001/health', {
      validateStatus: () => true,
      timeout: 2000
    }).catch(() => ({ status: 0, data: null }));

    if (analyticsHealth.status === 200) {
      const before = await api.get('/admin/analytics/summary', adminAuth);
      await api.post('/cart/items', { product_id: 1, quantity: 1 }, otherAuth);
      await api.post('/orders/checkout', {}, otherAuth);
      const after = await api.get('/admin/analytics/summary', adminAuth);
      assert(
        after.data.total_orders > before.data.total_orders,
        'Analytics change when a new order is placed'
      );
    } else {
      console.log('SKIPPED: Analytics live check (start python-analytics/app.py to run this case)');
      results.push('skipped-analytics');
    }

    console.log('\nAll executed API tests passed.');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
