import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_CLASS = {
  Placed: 'bg-primary',
  Processing: 'bg-info text-dark',
  Shipped: 'bg-warning text-dark',
  Delivered: 'bg-success',
  Cancelled: 'bg-secondary'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/mine').then((res) => setOrders(res.data.orders));
  }, []);

  return (
    <div className="container py-4">
      <h2>My orders</h2>
      {orders.length === 0 && <p>You have not placed an order yet.</p>}
      {orders.map((order) => (
        <div className="card mb-3" key={order.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <div>
                <Link to={`/orders/${order.id}`}>Order #{order.id}</Link>
                <div className="small text-muted">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div>
                <span className={`badge badge-status ${STATUS_CLASS[order.status] || 'bg-dark'}`}>
                  {order.status}
                </span>
                <div className="fw-bold">₹{Number(order.total_amount).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
