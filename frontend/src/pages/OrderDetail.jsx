import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.order))
      .catch((err) => setError(err.response?.data?.message || 'Cannot load order.'));
  }, [id]);

  if (error) return <div className="container py-4 alert alert-danger">{error}</div>;
  if (!order) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-4">
      <h2>Order #{order.id}</h2>
      <p>Status: {order.status}</p>
      <p>Date: {new Date(order.created_at).toLocaleString()}</p>
      <p>Total: ₹{Number(order.total_amount).toFixed(2)}</p>
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price at purchase</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.product_id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>₹{Number(item.price_at_purchase).toFixed(2)}</td>
              <td>₹{Number(item.line_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
