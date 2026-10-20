import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../services/api';

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function load() {
    const { data } = await api.get('/cart');
    setCart(data);
  }

  useEffect(() => {
    load().catch((err) => setMessage(errorMessage(err, 'Could not load cart.')));
  }, []);

  async function changeQty(productId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    try {
      await api.patch(`/cart/items/${productId}`, { quantity });
    } catch (err) {
      setMessage(errorMessage(err, 'Could not update quantity.'));
    }
    load().catch(() => {});
  }

  async function removeItem(productId) {
    try {
      await api.delete(`/cart/items/${productId}`);
    } catch (err) {
      setMessage(errorMessage(err, 'Could not remove item.'));
    }
    load().catch(() => {});
  }

  async function checkout() {
    setMessage('');
    try {
      const { data } = await api.post('/orders/checkout');
      navigate('/checkout', { state: data });
    } catch (err) {
      setMessage(errorMessage(err, 'Checkout failed.'));
      load().catch(() => {});
    }
  }

  return (
    <div className="container py-4">
      <h2>Shopping cart</h2>
      <p className="text-muted">Prices and stock are always loaded from MySQL, not from the cart document.</p>
      {message && <div className="alert alert-warning">{message}</div>}
      {cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Line total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.product_id}>
                  <td>{item.name}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      style={{ width: 80 }}
                      value={item.quantity}
                      onChange={(e) => changeQty(item.product_id, Number(e.target.value))}
                    />
                  </td>
                  <td>₹{item.line_total.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.product_id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Total: ₹{Number(cart.total).toFixed(2)}</h4>
          <button className="btn btn-primary" onClick={checkout}>
            Checkout (simulated payment)
          </button>
        </>
      )}
    </div>
  );
}
