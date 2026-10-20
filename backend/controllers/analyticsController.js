const { fetchAnalytics, fetchAnalyticsImage } = require('../services/analyticsClient');

async function summary(req, res, next) {
  try {
    res.json(await fetchAnalytics('/analytics/summary'));
  } catch (err) {
    next(err);
  }
}

async function topProducts(req, res, next) {
  try {
    res.json(await fetchAnalytics('/analytics/top-products'));
  } catch (err) {
    next(err);
  }
}

async function revenueByCategory(req, res, next) {
  try {
    res.json(await fetchAnalytics('/analytics/revenue-by-category'));
  } catch (err) {
    next(err);
  }
}

async function lowStock(req, res, next) {
  try {
    res.json(await fetchAnalytics('/analytics/low-stock'));
  } catch (err) {
    next(err);
  }
}

async function chart(req, res, next) {
  try {
    const image = await fetchAnalyticsImage('/analytics/chart/revenue-by-category');
    res.setHeader('Content-Type', image.contentType);
    res.send(Buffer.from(image.data));
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, topProducts, revenueByCategory, lowStock, chart };
