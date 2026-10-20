import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

export default function AdminAnalytics() {
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);
  const [categories, setCategories] = useState([]);
  const [low, setLow] = useState([]);
  const [error, setError] = useState('');
  const [chartUrl, setChartUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const chartUrlRef = useRef('');

  async function load() {
    setError('');
    setLoading(true);
    try {
      const [s, t, c, l] = await Promise.all([
        api.get('/admin/analytics/summary'),
        api.get('/admin/analytics/top-products'),
        api.get('/admin/analytics/revenue-by-category'),
        api.get('/admin/analytics/low-stock')
      ]);
      setSummary(s.data);
      setTop(t.data.products || []);
      setCategories(c.data.categories || []);
      setLow(l.data.products || []);

      const chart = await api.get('/admin/analytics/chart/revenue-by-category', {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(chart.data);
      if (chartUrlRef.current) URL.revokeObjectURL(chartUrlRef.current);
      chartUrlRef.current = url;
      setChartUrl(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Start the Python analytics service on port 5001.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return () => {
      if (chartUrlRef.current) URL.revokeObjectURL(chartUrlRef.current);
    };
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Admin · Analytics</h2>
        <button className="btn btn-outline-primary" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-muted">Numbers come from Pandas reading live SQL data. Cancelled orders are excluded.</p>
      {error && <div className="alert alert-warning">{error}</div>}

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card stat-card p-3">
              <div className="text-muted">Orders (valid)</div>
              <div className="fs-3 fw-bold">{summary.total_orders}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card stat-card p-3">
              <div className="text-muted">Revenue (₹)</div>
              <div className="fs-3 fw-bold">{Number(summary.total_revenue).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card stat-card p-3">
              <div className="text-muted">Items sold</div>
              <div className="fs-3 fw-bold">{summary.total_items_sold}</div>
            </div>
          </div>
        </div>
      )}

      {chartUrl && (
        <div className="card p-3 mb-4">
          <h5>Revenue by category</h5>
          <img src={chartUrl} alt="Revenue by category chart" className="img-fluid" />
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-3 h-100">
            <h5>Top products</h5>
            {top.length === 0 && <p className="text-muted">No sales yet.</p>}
            <ul className="list-group">
              {top.map((p) => (
                <li className="list-group-item d-flex justify-content-between" key={p.id}>
                  <span>{p.name}</span>
                  <span>
                    {p.units_sold} sold · ₹{p.revenue}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3 h-100">
            <h5>Low stock (≤ 5)</h5>
            {low.length === 0 && <p className="text-muted">No low-stock products.</p>}
            <ul className="list-group">
              {low.map((p) => (
                <li className="list-group-item d-flex justify-content-between" key={p.id}>
                  <span>{p.name}</span>
                  <span>{p.stock} left</span>
                </li>
              ))}
            </ul>
            {categories.length > 0 && (
              <div className="mt-3 small text-muted">
                Category revenue:{' '}
                {categories.map((c) => `${c.category} ₹${c.revenue}`).join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
