

## Online deployment notes (Render + Vercel + managed databases)

The deployment archive includes Gunicorn for serving the Flask analytics API in production. Push the extracted project to a GitHub repository first.

### Important hosting configuration

- Backend Render service: Root Directory should remain the repository root because the backend reads SQL schemas from the sibling `database/` directory. Build command: `npm install --prefix backend`. Start command: `cd backend && npm start`.
- Analytics Render service: Root Directory should remain the repository root. Build command: `pip install -r python-analytics/requirements.txt`. Start command: `cd python-analytics && gunicorn app:app --bind 0.0.0.0:$PORT`.
- Frontend Vercel project: set Root Directory to `frontend`, Framework Preset to Vite, Build Command `npm run build`, Output Directory `dist`, and environment variable `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`.
- Backend environment variables: `NODE_ENV=production`, `JWT_SECRET` (a strong random value), `FRONTEND_ORIGIN=https://YOUR-FRONTEND.vercel.app`, `SQL_DIALECT=mysql`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MONGO_URI`, and `ANALYTICS_URL=https://YOUR-ANALYTICS.onrender.com`.
- Analytics environment variables: `SQL_DIALECT=mysql`, the same MySQL connection values, and `LOW_STOCK_THRESHOLD=5`.
- Use a hosted MySQL-compatible database and MongoDB Atlas. Do not use local SQLite for a multi-service deployment because the API and analytics containers do not share a local file.
- Create the MySQL database before starting the services if the database provider does not grant permission to create databases. Run the seed script from the backend service shell once the database is reachable: `cd backend && npm run seed`.
- Configure MongoDB Atlas with a database user and network access that permits the hosted backend to connect. Use the provider's connection string; do not commit credentials.

Replace all `YOUR-...` placeholders with actual service URLs. Deploy the backend and analytics first, then set `VITE_API_URL` and `FRONTEND_ORIGIN` to the final frontend/backend URLs and redeploy if necessary. Test `/api/health` on the backend and `/health` on analytics before testing login and checkout. Checkout is simulated and does not take real payments.
