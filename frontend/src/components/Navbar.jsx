import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-hybrid">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          HybridMart
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Catalogue
              </NavLink>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/cart">
                    Cart
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/wishlist">
                    Wishlist
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/orders">
                    My orders
                  </NavLink>
                </li>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/products">
                    Products
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/orders">
                    Orders
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/analytics">
                    Analytics
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex gap-2 align-items-center">
            {user ? (
              <>
                <span className="text-white-50 small">{user.name}</span>
                <button className="btn btn-sm btn-light" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-sm btn-outline-light" to="/login">
                  Login
                </Link>
                <Link className="btn btn-sm btn-light" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
