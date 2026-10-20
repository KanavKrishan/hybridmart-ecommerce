# HybridMart — E-Commerce Mini Store

College mini project: **E-Commerce Mini Store using hybrid SQL and NoSQL integration**.

React (UI) → Express (only application backend) → **MySQL** for users/products/orders and **MongoDB** for carts/wishlists/reviews. A small **Flask + Pandas + Matplotlib** service reads the same SQL data for the admin dashboard.

This is a second-year AIML demo, not a commercial shop. Payment is simulated.

## Demo accounts (after seed)

| Role | Email | Password |
|------|--------|----------|
| Administrator | `admin@hybridstore.test` | `Admin@123` |
| Customer | `customer@hybridstore.test` | `Customer@123` |
| Customer | `student@hybridstore.test` | `Student@123` |

These exist only for lab demonstration. Do not reuse them as real credentials.

## What lives where

- **MySQL (preferred) / SQLite fallback:** `users`, `products`, `orders`, `order_items`
- **MongoDB:** `carts`, `wishlists`, `reviews`
- **Python:** totals, top products, revenue by category, low stock, one bar chart
- **Cancelled orders** are excluded from revenue and units sold

If MySQL login fails, Express and Flask automatically use `backend/data/store.sqlite` so you can still run the project.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Short version:

```
Browser (React :5173)
    |
    | JWT + JSON
    v
Express (:5000) ---- MySQL/SQLite
    |   \
    |    ---- MongoDB
    |
    | server-side HTTP
    v
Flask analytics (:5001) -- Pandas reads SQL
```

## Windows setup

You need: Node.js 18+, Python 3.10+, MongoDB running, and (optional) MySQL 8.

### 1. Clone / open this folder

```powershell
cd C:\Users\Kanav\hybrid-ecommerce-store
```

### 2. Backend

```powershell
cd backend
copy .env.example .env
```

Edit `.env`:

- Set `JWT_SECRET` to any long random lab string.
- If you have MySQL, set `MYSQL_PASSWORD` and keep `SQL_DIALECT=mysql`.
- If MySQL is not configured, set `SQL_DIALECT=sqlite`.

```powershell
npm install
npm run seed
npm start
```

API: http://localhost:5000/api/health

### 3. Python analytics (new terminal)

```powershell
cd C:\Users\Kanav\hybrid-ecommerce-store\python-analytics
copy .env.example .env
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Use the same `SQL_DIALECT` / MySQL / SQLite settings as the backend. Flask: http://127.0.0.1:5001/health

### 4. Frontend (new terminal)

```powershell
cd C:\Users\Kanav\hybrid-ecommerce-store\frontend
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

MongoDB should already be running (`MongoDB` Windows service). Compass connection string:

`mongodb://127.0.0.1:27017/hybrid_ecommerce_store`

## API tests

With MongoDB running:

```powershell
cd backend
npm run test:api
```

This script creates a temporary SQLite file and a `hybrid_ecommerce_test` MongoDB database. If Flask is running, it also checks that analytics totals increase after a new order.

## Project documents (viva / submission)

| File | Purpose |
|------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagram and hybrid explanation |
| [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md) | SQL ER diagram |
| [docs/MONGODB_SCHEMA.md](docs/MONGODB_SCHEMA.md) | Document examples |
| [docs/API.md](docs/API.md) | REST routes and curl |
| [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md) | Report body |
| [docs/PRESENTATION_OUTLINE.md](docs/PRESENTATION_OUTLINE.md) | 8–10 slides |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 5–7 minute talk |
| [docs/VIVA_QUESTIONS.md](docs/VIVA_QUESTIONS.md) | 25 Q&A |
| [docs/SCREENSHOTS_CHECKLIST.md](docs/SCREENSHOTS_CHECKLIST.md) | Images to capture |

## Checkout (explain this in viva)

1. Read cart from MongoDB.  
2. If empty, stop.  
3. Begin SQL transaction.  
4. Read current price and stock from SQL (with row lock on MySQL).  
5. Insert `orders` + `order_items`, reduce stock.  
6. Commit or rollback.  
7. Clear MongoDB cart only after commit.

SQL and MongoDB are **not** one atomic transaction. See the architecture notes.

## Folder structure

```
hybrid-ecommerce-store/
  frontend/          React + Vite
  backend/           Express API
  python-analytics/  Flask + Pandas
  database/          schema.sql, schema.sqlite.sql, seed.sql
  docs/              report and viva material
```


## Online deployment

See [docs/ONLINE_DEPLOYMENT.md](docs/ONLINE_DEPLOYMENT.md) for Render, Vercel, hosted MySQL, and MongoDB Atlas deployment configuration.
