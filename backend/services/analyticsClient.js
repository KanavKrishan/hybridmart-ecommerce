const axios = require('axios');
const env = require('../config/env');

async function fetchAnalytics(pathname) {
  try {
    const response = await axios.get(`${env.analyticsUrl}${pathname}`, {
      timeout: env.analyticsTimeoutMs
    });
    return response.data;
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    const wrapped = new Error(
      'Analytics service is unavailable. Start the Flask app on port 5001. (' + detail + ')'
    );
    wrapped.status = 503;
    throw wrapped;
  }
}

async function fetchAnalyticsImage(pathname) {
  try {
    const response = await axios.get(`${env.analyticsUrl}${pathname}`, {
      timeout: env.analyticsTimeoutMs,
      responseType: 'arraybuffer'
    });
    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'image/png'
    };
  } catch (err) {
    const wrapped = new Error('Analytics chart is unavailable.');
    wrapped.status = 503;
    throw wrapped;
  }
}

module.exports = { fetchAnalytics, fetchAnalyticsImage };
