import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [message, setMessage] = useState('');

  async function load() {
    const params = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category;
    const [{ data: prod }, { data: cats }] = await Promise.all([
      api.get('/products', { params }),
      api.get('/products/categories')
    ]);
    setProducts(prod.products);
    setCategories(cats.categories);
  }

  useEffect(() => {
    load().catch(() => setMessage('Could not load products. Is the API running?'));
  }, [category]);

  function requireLogin() {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  }

  async function addCart(id) {
    if (!requireLogin()) return;
    await api.post('/cart/items', { product_id: id, quantity: 1 });
    setMessage('Added to cart.');
  }

  async function addWish(id) {
    if (!requireLogin()) return;
    await api.post('/wishlist/items', { product_id: id });
    setMessage('Added to wishlist.');
  }

  return (
    <div className="container py-4">
      <div className="hero-band p-4 p-md-5 mb-4">
        <h1 className="h2 mb-2">Campus mini store</h1>
        <p className="mb-0">
          SQL keeps orders consistent. MongoDB stores carts, wishlists, and reviews. Python analyses
          real sales for the admin dashboard.
        </p>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Search by product name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={load}>
            Search
          </button>
        </div>
      </div>

      <div className="row g-3">
        {products.map((product) => (
          <div className="col-sm-6 col-lg-3" key={product.id}>
            <ProductCard product={product} onAddCart={addCart} onAddWish={addWish} />
          </div>
        ))}
      </div>
    </div>
  );
}
