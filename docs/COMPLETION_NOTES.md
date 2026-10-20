# Project completion notes

## Included application scope

- React + Vite storefront with product search, categories, product detail, reviews, cart, wishlist, checkout, and order history.
- Express API with JWT authentication, customer/admin roles, product management, order management, and authorization checks.
- MySQL-first SQL storage with SQLite fallback for users, products, orders, and order items.
- MongoDB storage for carts, wishlists, and reviews.
- Flask + Pandas analytics for order totals, product sales, revenue by category, low stock, and a chart.
- Setup, architecture, API, ER diagram, demo script, project report, presentation outline, and viva notes under `docs/`.

## Finishing the local setup

1. Copy each `.env.example` to `.env` in `backend/`, `frontend/`, and `python-analytics/`.
2. Set `SQL_DIALECT=sqlite` in both backend and analytics env files for the simplest local setup, or configure MySQL identically in both.
3. Start MongoDB locally; carts, wishlists, and reviews use MongoDB.
4. In `backend/`, run `npm install`, `npm run seed`, then `npm start`.
5. In `python-analytics/`, create and activate a Python virtual environment, install `requirements.txt`, and run `python app.py`.
6. In `frontend/`, run `npm install` and `npm run dev`.
7. Sign in with one of the demo accounts listed in the root README.
8. Run `npm run test:api` from `backend/` while MongoDB is running to exercise the API integration scenarios.

## Validation performed while preparing this archive

- Node.js syntax checks passed for backend JavaScript files.
- Python bytecode compilation passed for `python-analytics/app.py`.
- Babel parsed all 19 frontend JavaScript/JSX source files successfully.
- A production Vite build and live end-to-end API test were not confirmed in this environment; complete those after installing platform-specific dependencies and starting MongoDB locally.

## Important demo limitation

Checkout is simulated. It records an order and reserves stock; it does not charge a card or process real UPI payments. Use only the included demo credentials for a classroom demonstration.
