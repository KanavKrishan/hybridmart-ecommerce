import { useEffect, useState } from 'react';
import api from '../services/api';

const STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  async function load() {
    const { data } = await api.get('/orders/admin');
    setOrders(data.orders);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id, status) {
    await api.patch(`/orders/admin/${id}/status`, { status });
    load();
  }

  return (
    <div className="container py-4">
      <h2>Admin · Orders</h2>
      <p className="text-muted">Cancelled orders are excluded from analytics revenue.</p>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>
                {order.customer_name}
                <div className="small text-muted">{order.customer_email}</div>
              </td>
              <td>₹{Number(order.total_amount).toFixed(2)}</td>
              <td>
                <select
                  className="form-select"
                  value={order.status}
                  onChange={(e) => changeStatus(order.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
