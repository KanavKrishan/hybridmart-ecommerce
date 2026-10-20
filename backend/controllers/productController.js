const { getSql } = require('../config/db');
const { httpError } = require('../middleware/errorHandler');
const Review = require('../models/Review');

function toProduct(row) {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: Number(row.stock),
    category: row.category,
    image_url: row.image_url,
    created_at: row.created_at
  };
}

async function listProducts(req, res, next) {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const sql = getSql();
    let text = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (search) {
      text += ' AND LOWER(name) LIKE ?';
      params.push('%' + search.toLowerCase() + '%');
    }
    if (category && category !== 'All') {
      text += ' AND category = ?';
      params.push(category);
    }
    text += ' ORDER BY name';
    const rows = await sql.query(text, params);
    res.json({ products: rows.map(toProduct) });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const rows = await getSql().query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    res.json({ categories: rows.map((r) => r.category) });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const rows = await getSql().query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows[0]) throw httpError(404, 'Product not found.');
    const product = toProduct(rows[0]);
    const reviews = await Review.find({ product_id: id }).sort({ created_at: -1 }).lean();
    const avg =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    res.json({
      product,
      average_rating: Number(avg.toFixed(2)),
      review_count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
}

function parseProductBody(body, partial) {
  const data = {};
  if (!partial || body.name !== undefined) {
    data.name = String(body.name || '').trim();
    if (data.name.length < 2) throw httpError(400, 'Product name is required.');
  }
  if (!partial || body.description !== undefined) {
    data.description = String(body.description || '').trim();
  }
  if (!partial || body.price !== undefined) {
    data.price = Number(body.price);
    if (!Number.isFinite(data.price) || data.price < 0) {
      throw httpError(400, 'Price must be a number that is 0 or more.');
    }
  }
  if (!partial || body.stock !== undefined) {
    data.stock = Number(body.stock);
    if (!Number.isInteger(data.stock) || data.stock < 0) {
      throw httpError(400, 'Stock must be a whole number that is 0 or more.');
    }
  }
  if (!partial || body.category !== undefined) {
    data.category = String(body.category || '').trim();
    if (!data.category) throw httpError(400, 'Category is required.');
  }
  if (!partial || body.image_url !== undefined) {
    data.image_url = String(body.image_url || '').trim();
    if (!data.image_url) throw httpError(400, 'Image URL is required.');
  }
  return data;
}

async function createProduct(req, res, next) {
  try {
    const data = parseProductBody(req.body, false);
    const result = await getSql().execute(
      `INSERT INTO products (name, description, price, stock, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.description, data.price, data.stock, data.category, data.image_url]
    );
    const rows = await getSql().query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ product: toProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await getSql().query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing[0]) throw httpError(404, 'Product not found.');
    const data = parseProductBody({ ...existing[0], ...req.body }, false);
    await getSql().execute(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?
       WHERE id = ?`,
      [data.name, data.description, data.price, data.stock, data.category, data.image_url, id]
    );
    const rows = await getSql().query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ product: toProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await getSql().execute('DELETE FROM products WHERE id = ?', [id]);
    if (!result.affectedRows) throw httpError(404, 'Product not found.');
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || /FOREIGN KEY/i.test(err.message)) {
      return next(
        httpError(409, 'This product is part of an existing order, so it cannot be deleted.')
      );
    }
    next(err);
  }
}

module.exports = {
  listProducts,
  listCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
