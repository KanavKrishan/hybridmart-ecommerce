const express = require('express');
const controller = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.post('/checkout', authenticate, controller.placeOrder);
router.get('/mine', authenticate, controller.myOrders);
router.get('/admin', authenticate, requireAdmin, controller.adminListOrders);
router.patch('/admin/:id/status', authenticate, requireAdmin, controller.adminUpdateStatus);
router.get('/:id', authenticate, controller.getOrder);
module.exports = router;
