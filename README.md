# HybridMart — E-Commerce Mini Store

College mini project: **E-Commerce Mini Store using Hybrid SQL and NoSQL Integration**.

React (UI) → Express (application backend) → **MySQL** for users, products, and orders; **MongoDB** for carts, wishlists, and reviews. A small **Flask + Pandas + Matplotlib** service reads SQL data for the admin dashboard.

This is a second-year AIML academic demonstration, not a commercial store. Payment is simulated.

## Demo Accounts

Available after running the database seed script:

| Role          | Email                       | Password       |
| ------------- | --------------------------- | -------------- |
| Administrator | `admin@hybridstore.test`    | `Admin@123`    |
| Customer      | `customer@hybridstore.test` | `Customer@123` |
| Customer      | `student@hybridstore.test`  | `Student@123`  |

These accounts are for local demonstration only. Do not reuse these credentials for real services or production deployment.

## Technology Stack

- **Frontend:** React, Vite, React Router, Axios
- **Backend:** Node.js and Express
- **Relational database:** MySQL preferred, with SQLite fallback
- **Document database:** MongoDB and Mongoose
- **Analytics:** Python, Flask, Pandas, Matplotlib
- **Authentication:** JWT and bcrypt

## What Lives Where?

- **MySQL / SQLite:** `users`, `products`, `orders`, `order_items`
- **MongoDB:** carts, wishlists, reviews
- **Python analytics:** sales totals, top products, revenue by category, low-stock information, and charts
- **Analytics rule:** cancelled orders are excluded from revenue and units-sold calculations

Use the same SQL database configuration for Express and Flask so both services read consistent data.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
Browser (React :5173)
        |
        | HTTP / JSON / JWT
        v
Express API (:5000)
   |           |
   v           v
SQL database  MongoDB
   ^
   |
Flask Analytics (:5001)
Python + Pandas
```

## Windows Setup

### Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- MongoDB running
- MySQL 8 if using MySQL; otherwise configure the supported SQLite fallback

### 1. Backend

Open a terminal at the project root:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Edit `backend/.env`:

- Set `JWT_SECRET` to a long, random secret.
- Configure the MySQL credentials if using MySQL.
- Otherwise set `SQL_DIALECT=sqlite`.
- Configure the MongoDB connection string.

Then run:

```powershell
npm run seed
npm start
```

Backend health endpoint: `http://localhost:5000/api/health`

### 2. Python Analytics

Open a second terminal at the project root:

```powershell
cd python-analytics
Copy-Item .env.example .env
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Configure the analytics service to use the same SQL dialect and database as the backend.

Analytics health endpoint: `http://127.0.0.1:5001/health`

### 3. Frontend

Open a third terminal at the project root:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

### 4. MongoDB

Ensure the MongoDB Windows service is running.

Local connection example:

```text
mongodb://127.0.0.1:27017/hybrid_ecommerce_store
```

### 5. API Tests

With the required services configured:

```powershell
cd backend
npm run test:api
```

Run tests only after checking the package scripts and database configuration.

## Project Documentation

| File                                                           | Purpose                               |
| -------------------------------------------------------------- | ------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                   | System architecture and hybrid design |
| [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md)                       | SQL entity relationships              |
| [docs/MONGODB_SCHEMA.md](docs/MONGODB_SCHEMA.md)               | MongoDB document examples             |
| [docs/API.md](docs/API.md)                                     | API routes and examples               |
| [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md)               | Project report                        |
| [docs/PRESENTATION_OUTLINE.md](docs/PRESENTATION_OUTLINE.md)   | Presentation outline                  |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)                     | Demonstration script                  |
| [docs/VIVA_QUESTIONS.md](docs/VIVA_QUESTIONS.md)               | Viva questions and answers            |
| [docs/SCREENSHOTS_CHECKLIST.md](docs/SCREENSHOTS_CHECKLIST.md) | Screenshots to capture                |
| [docs/ONLINE_DEPLOYMENT.md](docs/ONLINE_DEPLOYMENT.md)         | Online deployment instructions        |

## Checkout Workflow

1. Read the cart from MongoDB.
2. Stop if the cart is empty.
3. Begin a SQL transaction.
4. Read current prices and stock from SQL.
5. Insert the order and order items, and reduce stock.
6. Commit if all operations succeed; otherwise roll back.
7. Clear the MongoDB cart after the SQL transaction commits.

**Important:** SQL and MongoDB do not share a single atomic transaction. Cart cleanup can fail independently after an order has been committed.

## Folder Structure

```text
hybrid-ecommerce-store/
├── frontend/
├── backend/            Express API (+ database/ schemas)   -> Render
├── python-analytics/   Flask + Pandas analytics           -> Render
├── frontend/           React + Vite                       -> Vercel
├── render.yaml         Render Blueprint (backend + analytics)
└── docs/
```

## Online Deployment

Three services: **frontend on Vercel**, **backend and analytics on Render** (`render.yaml`), with hosted **MySQL** and **MongoDB Atlas**. See [docs/ONLINE_DEPLOYMENT.md](docs/ONLINE_DEPLOYMENT.md) for step-by-step instructions.

**Security note:** Never commit real `.env` files, database passwords, API keys, or production secrets to GitHub.
