const express = require('express');
const controller = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.getWishlist);
router.post('/items', controller.addToWishlist);
router.delete('/items/:productId', controller.removeFromWishlist);
router.post('/items/:productId/move-to-cart', controller.moveToCart);
module.exports = router;
