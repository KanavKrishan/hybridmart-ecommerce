import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');

  async function load() {
    const { data: payload } = await api.get(`/products/${id}`);
    setData(payload);
  }

  useEffect(() => {
    load().catch(() => setMessage('Product not found.'));
  }, [id]);

  async function addCart() {
    if (!user) return navigate('/login');
    await api.post('/cart/items', { product_id: Number(id), quantity: 1 });
    setMessage('Added to cart.');
  }

  async function addWish() {
    if (!user) return navigate('/login');
    await api.post('/wishlist/items', { product_id: Number(id) });
    setMessage('Added to wishlist.');
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api.post('/reviews', {
        product_id: Number(id),
        rating: Number(review.rating),
        comment: review.comment
      });
      setReview({ rating: 5, comment: '' });
      setMessage('Review saved.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save review.');
    }
  }

  if (!data) return <div className="container py-4">{message || 'Loading...'}</div>;
  const { product } = data;

  return (
    <div className="container py-4">
      {message && <div className="alert alert-info">{message}</div>}
      <div className="row g-4">
        <div className="col-md-5">
          <img className="img-fluid rounded shadow-sm" src={product.image_url} alt={product.name} />
        </div>
        <div className="col-md-7">
          <div className="text-muted">{product.category}</div>
          <h2>{product.name}</h2>
          <p className="price fs-4">₹{Number(product.price).toFixed(2)}</p>
          <p>{product.description}</p>
          <p>
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
          </p>
          <p>
            Average rating: {data.average_rating} / 5 ({data.review_count} reviews)
          </p>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" disabled={product.stock < 1} onClick={addCart}>
              Add to cart
            </button>
            <button className="btn btn-outline-secondary" onClick={addWish}>
              Add to wishlist
            </button>
          </div>
        </div>
      </div>

      <hr className="my-4" />
      <h4>Reviews</h4>
      {data.reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
      {data.reviews.map((item) => (
        <div className="card mb-2" key={item._id}>
          <div className="card-body">
            <strong>{item.rating} / 5</strong>
            <p className="mb-0">{item.comment}</p>
          </div>
        </div>
      ))}

      <form className="card p-3 mt-3" onSubmit={submitReview}>
        <h5>Write a review</h5>
        <p className="small text-muted">Only customers who purchased this product can review it.</p>
        <select
          className="form-select mb-2"
          value={review.rating}
          onChange={(e) => setReview({ ...review, rating: e.target.value })}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
        <textarea
          className="form-control mb-2"
          rows="3"
          value={review.comment}
          onChange={(e) => setReview({ ...review, comment: e.target.value })}
          placeholder="Your comments"
        />
        <button className="btn btn-primary">Submit review</button>
      </form>
    </div>
  );
}
