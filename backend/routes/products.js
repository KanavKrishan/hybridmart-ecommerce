const express = require('express');
const controller = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.get('/', controller.listProducts);
router.get('/categories', controller.listCategories);
router.get('/:id', controller.getProduct);
router.post('/', authenticate, requireAdmin, controller.createProduct);
router.put('/:id', authenticate, requireAdmin, controller.updateProduct);
router.delete('/:id', authenticate, requireAdmin, controller.deleteProduct);
module.exports = router;
