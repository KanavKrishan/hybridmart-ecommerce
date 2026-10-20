const axios = require('axios');
const env = require('../config/env');

function requestOptions(extra = {}) {
  const headers = {};
  if (env.analyticsApiKey) headers['x-api-key'] = env.analyticsApiKey;
  return { timeout: env.analyticsTimeoutMs, headers, ...extra };
}

function unavailable(detail) {
  const err = new Error(`Analytics service is unavailable (${detail}). Check ANALYTICS_URL and that the analytics service is running.`);
  err.status = 503;
  return err;
}

async function fetchAnalytics(pathname) {
  try {
    const response = await axios.get(`${env.analyticsUrl}${pathname}`, requestOptions());
    return response.data;
  } catch (err) {
    throw unavailable(err.response?.data?.message || err.message);
  }
}

async function fetchAnalyticsImage(pathname) {
  try {
    const response = await axios.get(
      `${env.analyticsUrl}${pathname}`,
      requestOptions({ responseType: 'arraybuffer' })
    );
    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'image/png'
    };
  } catch (err) {
    throw unavailable(err.message);
  }
}

module.exports = { fetchAnalytics, fetchAnalyticsImage };
