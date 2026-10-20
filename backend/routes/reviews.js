const express = require('express');
const controller = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.get('/product/:productId', controller.listReviews);
router.post('/', authenticate, controller.addReview);
module.exports = router;
