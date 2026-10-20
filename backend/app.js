const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'hybrid-ecommerce-backend' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin/analytics', require('./routes/analytics'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});
app.use(errorHandler);

module.exports = app;
