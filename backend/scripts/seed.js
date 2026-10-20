const bcrypt = require('bcrypt');
const { connectSql, getSql } = require('../config/db');
const { connectMongo } = require('../config/mongo');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

const PRODUCTS = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Over-ear headphones with 20 hours of battery life. Useful for online classes.',
    price: 2499,
    stock: 25,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'USB-C Power Bank 20000mAh',
    description: 'Fast-charging power bank for laptops and phones.',
    price: 1799,
    stock: 18,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Wireless Mouse',
    description: 'Silent click mouse with a USB receiver.',
    price: 699,
    stock: 40,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Cotton Casual T-Shirt',
    description: 'Breathable cotton tee in navy blue.',
    price: 599,
    stock: 50,
    category: 'Clothing',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Slim Fit Denim Jeans',
    description: 'Mid-wash jeans suitable for college wear.',
    price: 1299,
    stock: 30,
    category: 'Clothing',
    image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Introduction to Artificial Intelligence',
    description: 'Beginner textbook covering search, ML basics, and ethics.',
    price: 899,
    stock: 20,
    category: 'Books',
    image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Data Structures Workbook',
    description: 'Practice problems on arrays, stacks, queues, and trees.',
    price: 499,
    stock: 35,
    category: 'Books',
    image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: '750 ml insulated bottle. Keeps water cold for 12 hours.',
    price: 399,
    stock: 60,
    category: 'Home',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Desk Organiser Set',
    description: 'Pen stand, tray, and sticky-note holder for a study table.',
    price: 749,
    stock: 22,
    category: 'Home',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Yoga Mat',
    description: '6 mm non-slip mat for home workouts.',
    price: 899,
    stock: 15,
    category: 'Sports',
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=85'
  },
  {
    name: 'Limited Demo Stylus',
    description: 'Low-stock item used to demonstrate the analytics low-stock report.',
    price: 299,
    stock: 3,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1586210579191-837e7d2d4b5e?auto=format&fit=crop&w=900&q=85'
  }
];

async function seed() {
  await connectSql();
  await connectMongo();
  const sql = getSql();

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const customerHash = await bcrypt.hash('Customer@123', 10);
  const secondHash = await bcrypt.hash('Student@123', 10);

  async function upsertUser(name, email, hash, role) {
    const found = await sql.query('SELECT id FROM users WHERE email = ?', [email]);
    if (found[0]) return Number(found[0].id);
    const result = await sql.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
    return result.insertId;
  }

  const adminId = await upsertUser('Store Admin', 'admin@hybridstore.test', adminHash, 'admin');
  const customerId = await upsertUser(
    'Asha Customer',
    'customer@hybridstore.test',
    customerHash,
    'customer'
  );
  const studentId = await upsertUser(
    'Rohan Student',
    'student@hybridstore.test',
    secondHash,
    'customer'
  );

  const productIds = [];
  for (const product of PRODUCTS) {
    const found = await sql.query('SELECT id FROM products WHERE name = ?', [product.name]);
    if (found[0]) {
      // Keep existing demo products but refresh their images to match the product title.
      await sql.execute('UPDATE products SET image_url = ? WHERE id = ?', [product.image_url, Number(found[0].id)]);
      productIds.push(Number(found[0].id));
      continue;
    }
    const result = await sql.execute(
      `INSERT INTO products (name, description, price, stock, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.image_url
      ]
    );
    productIds.push(result.insertId);
  }

  const existingOrders = await sql.query('SELECT COUNT(*) AS c FROM orders');
  if (Number(existingOrders[0].c) === 0) {
    await sql.withTransaction(async (tx) => {
      const first = await tx.execute(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [customerId, 2499 + 599, 'Delivered']
      );
      await tx.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [first.insertId, productIds[0], 1, 2499]
      );
      await tx.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [first.insertId, productIds[3], 1, 599]
      );
      await tx.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [productIds[0]]);
      await tx.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [productIds[3]]);

      const second = await tx.execute(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [studentId, 899 * 2, 'Shipped']
      );
      await tx.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [second.insertId, productIds[5], 2, 899]
      );
      await tx.execute('UPDATE products SET stock = stock - 2 WHERE id = ?', [productIds[5]]);
    });

    await Review.create({
      product_id: productIds[0],
      user_id: customerId,
      rating: 5,
      comment: 'Clear sound and comfortable for long lectures.'
    });
  }

  await Cart.deleteMany({ user_id: { $in: [adminId, customerId, studentId] } });
  await Wishlist.deleteMany({ user_id: { $in: [adminId, customerId, studentId] } });

  console.log('Seed complete.');
  console.log('Admin     : admin@hybridstore.test / Admin@123');
  console.log('Customer  : customer@hybridstore.test / Customer@123');
  console.log('Student   : student@hybridstore.test / Student@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
