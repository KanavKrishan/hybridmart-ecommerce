const express = require('express');
const controller = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);
router.get('/summary', controller.summary);
router.get('/top-products', controller.topProducts);
router.get('/revenue-by-category', controller.revenueByCategory);
router.get('/low-stock', controller.lowStock);
router.get('/chart/revenue-by-category', controller.chart);
module.exports = router;
