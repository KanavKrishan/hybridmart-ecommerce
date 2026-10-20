import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../services/api';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const { data } = await api.get('/wishlist');
    setItems(data.products);
  }

  useEffect(() => {
    load().catch((err) => setMessage(errorMessage(err, 'Could not load wishlist.')));
  }, []);

  async function removeItem(id) {
    try {
      await api.delete(`/wishlist/items/${id}`);
    } catch (err) {
      setMessage(errorMessage(err, 'Could not remove item.'));
    }
    load().catch(() => {});
  }

  async function move(id) {
    try {
      await api.post(`/wishlist/items/${id}/move-to-cart`);
      setMessage('Moved to cart.');
      load().catch(() => {});
    } catch (err) {
      setMessage(errorMessage(err, 'Could not move item.'));
    }
  }

  return (
    <div className="container py-4">
      <h2>Wishlist</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {items.length === 0 && <p>No saved products yet.</p>}
      <div className="row g-3">
        {items.map((product) => (
          <div className="col-md-4" key={product.id}>
            <div className="card h-100">
              <img src={product.image_url} alt={product.name} className="card-img-top" style={{ height: 160, objectFit: 'cover' }} />
              <div className="card-body">
                <h5>{product.name}</h5>
                <p className="price">₹{Number(product.price).toFixed(2)}</p>
                <div className="d-flex gap-2">
                  <Link className="btn btn-sm btn-outline-primary" to={`/products/${product.id}`}>
                    View
                  </Link>
                  <button className="btn btn-sm btn-primary" onClick={() => move(product.id)}>
                    Move to cart
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(product.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
