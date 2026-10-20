import { useEffect, useState } from 'react';
import api from '../services/api';

const empty = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: 'Electronics',
  image_url: 'https://images.unsplash.com/photo-1586210579191-837e7d2d4b5e?auto=format&fit=crop&w=900&q=85'
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    const { data } = await api.get('/products');
    setProducts(data.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    };
    if (editingId) await api.put(`/products/${editingId}`, payload);
    else await api.post('/products', payload);
    setForm(empty);
    setEditingId(null);
    setMessage('Saved.');
    load();
  }

  async function remove(id) {
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Delete failed.');
    }
  }

  return (
    <div className="container py-4">
      <h2>Admin · Products</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form className="card p-3 mb-4" onSubmit={save}>
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Price ₹"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </div>
          <div className="col-md-12">
            <textarea
              className="form-control"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder="Image URL"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              required
            />
          </div>
          <div className="col-md-4">
            <button className="btn btn-primary w-100">{editingId ? 'Update' : 'Add product'}</button>
          </div>
        </div>
      </form>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>₹</th>
            <th>Stock</th>
            <th>Category</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{Number(p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>{p.category}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => {
                    setEditingId(p.id);
                    setForm({
                      name: p.name,
                      description: p.description || '',
                      price: p.price,
                      stock: p.stock,
                      category: p.category,
                      image_url: p.image_url
                    });
                  }}
                >
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
