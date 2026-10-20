# Online deployment: Vercel + Render + hosted databases

HybridMart deploys as **three independent services**, each in its own folder with its own build:

| # | Service | Folder | Host | Health check |
|---|---------|--------|------|--------------|
| 1 | React frontend (Vite) | `frontend/` | **Vercel** | `/` |
| 2 | Express API | `backend/` | **Render** (Node) | `/api/health`, `/api/health/db` |
| 3 | Flask + Pandas analytics | `python-analytics/` | **Render** (Python) | `/health` |

and two hosted databases, both used by the API:

| Database | Used for | Provider examples |
|----------|----------|-------------------|
| **SQL (MySQL)** | users, products, orders, order items | Aiven, PlanetScale, Railway |
| **MongoDB** | carts, wishlists, reviews | MongoDB Atlas |

The analytics service reads the **same MySQL** database. Do not use SQLite in production: the services do not share a disk.

## Order of deployment

### 1. Databases
- **MySQL**: create a database and note host, port, user, password, database name. Tables are created automatically on first boot.
- **MongoDB Atlas**: create a cluster and a database user, and allow network access from `0.0.0.0/0` (Render free instances have no fixed IP). Copy the `mongodb+srv://...` URI.

### 2. Render: backend and analytics (Blueprint)
1. Push the repo to GitHub.
2. Render → **New → Blueprint** → select the repo. `render.yaml` creates `hybridmart-backend` and `hybridmart-analytics`.
3. Fill the prompted variables:

| Variable | Backend | Analytics | Value |
|----------|:------:|:---------:|-------|
| `MYSQL_HOST` `MYSQL_PORT` `MYSQL_USER` `MYSQL_PASSWORD` `MYSQL_DATABASE` | ✔ | ✔ | identical on both |
| `MONGO_URI` | ✔ | | Atlas URI |
| `ANALYTICS_API_KEY` | ✔ | ✔ | same random string on both (`openssl rand -hex 32`) |
| `ANALYTICS_URL` | ✔ | | `https://hybridmart-analytics.onrender.com` |
| `FRONTEND_ORIGIN` | ✔ | | your Vercel URL, e.g. `https://hybridmart.vercel.app` (comma-separate several) |
| `JWT_SECRET` | auto-generated | | |

4. Check `https://<backend>.onrender.com/api/health/db`. It should return `{"ok":true,"sql":{"status":"connected","kind":"mysql"},"mongo":{"status":"connected"}}`.
5. `SEED_ON_START=true` loads demo users and products **once**, when the users table is empty. After the first successful boot, set it to `false`. Set `SEED_ADMIN_PASSWORD` before the first boot to avoid the public demo admin password.

### 3. Vercel: frontend
1. Vercel → **Add New → Project** → import the repo → **Root Directory: `frontend`** (Vite is detected; `vercel.json` adds the SPA rewrite so deep links like `/orders/3` work).
2. Environment variable: `VITE_API_URL = https://<backend>.onrender.com/api` (must end in `/api`).
3. Deploy, then put the final Vercel URL into the backend's `FRONTEND_ORIGIN` and redeploy the backend if needed.
   Set `ALLOW_VERCEL_PREVIEWS=true` on the backend if you also want preview deployments to work.

## Local development
```bash
# backend (SQLite fallback needs no MySQL; MongoDB must be running)
cd backend && cp .env.example .env && npm install && npm run seed && npm start
# analytics
cd python-analytics && cp .env.example .env && pip install -r requirements.txt && python app.py
# frontend (proxies /api to localhost:5000)
cd frontend && npm install && npm run dev
```
For local SQLite set `SQL_DIALECT=sqlite` in **both** `backend/.env` and `python-analytics/.env`.

## Notes
- Free Render instances sleep after inactivity; the first request can take ~50 s. The frontend allows 60 s and the backend waits up to 60 s for analytics.
- In production (`NODE_ENV=production`) the API and analytics refuse to fall back to SQLite if MySQL is unreachable, so they can never quietly diverge onto different data.
- Never commit `.env` files or credentials. Checkout is simulated; no real payments are taken.
