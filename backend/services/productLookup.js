const { httpError } = require('../middleware/errorHandler');

async function getProductMap(sqlOrTx, productIds) {
  const uniqueIds = [...new Set(productIds.map(Number))].filter((id) => id > 0);
  if (!uniqueIds.length) return new Map();

  const placeholders = uniqueIds.map(() => '?').join(',');
  const rows = await sqlOrTx.query(
    `SELECT id, name, description, price, stock, category, image_url
     FROM products WHERE id IN (${placeholders})`,
    uniqueIds
  );
  const map = new Map();
  for (const row of rows) {
    map.set(Number(row.id), {
      ...row,
      id: Number(row.id),
      price: Number(row.price),
      stock: Number(row.stock)
    });
  }
  return map;
}

async function requireProduct(sqlOrTx, productId) {
  const map = await getProductMap(sqlOrTx, [productId]);
  const product = map.get(Number(productId));
  if (!product) throw httpError(404, 'Product not found.');
  return product;
}

module.exports = { getProductMap, requireProduct };
