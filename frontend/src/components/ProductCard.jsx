import { Link } from 'react-router-dom';

export default function ProductCard({ product, onAddCart, onAddWish }) {
  return (
    <div className="card product-card h-100 shadow-sm">
      <img src={product.image_url} alt={product.name} />
      <div className="card-body d-flex flex-column">
        <div className="text-muted small">{product.category}</div>
        <h5 className="card-title mt-1">{product.name}</h5>
        <p className="price mb-1">₹{Number(product.price).toFixed(2)}</p>
        <p className="small mb-3">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
        <div className="mt-auto d-flex gap-2">
          <Link className="btn btn-sm btn-outline-primary" to={`/products/${product.id}`}>
            Details
          </Link>
          <button
            className="btn btn-sm btn-primary"
            disabled={product.stock < 1}
            onClick={() => onAddCart(product.id)}
          >
            Add to cart
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => onAddWish(product.id)}>
            Wish
          </button>
        </div>
      </div>
    </div>
  );
}
