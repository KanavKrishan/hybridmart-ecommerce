import { Link, useLocation } from 'react-router-dom';

export default function Checkout() {
  const { state } = useLocation();
  if (!state?.orderId) {
    return (
      <div className="container py-4">
        <p>No checkout result to show.</p>
        <Link to="/cart">Back to cart</Link>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <div className="card p-4 shadow-sm">
        <h2>Order confirmed</h2>
        <p>This is a simulated checkout. No real payment gateway is used.</p>
        <p>
          Order ID: <strong>#{state.orderId}</strong>
        </p>
        <p>
          Total paid (simulated): <strong>₹{Number(state.totalAmount).toFixed(2)}</strong>
        </p>
        {state.warning && <div className="alert alert-warning">{state.warning}</div>}
        <ul>
          {state.items?.map((item) => (
            <li key={item.product_id}>
              {item.name} × {item.quantity} @ ₹{item.price_at_purchase}
            </li>
          ))}
        </ul>
        <Link className="btn btn-primary" to="/orders">
          View my orders
        </Link>
      </div>
    </div>
  );
}
