
"""
HybridMart Analytics Service
Flask API for sales analytics, product performance,
revenue by category, low-stock products, and charts.

Uses MySQL when configured, with SQLite as a fallback.
Cancelled orders are excluded from revenue and units sold.
"""

from __future__ import annotations

import io
import os
import sqlite3
from decimal import Decimal
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS


# --------------------------------------------------
# Configuration
# --------------------------------------------------

ROOT = Path(__file__).resolve().parent

load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / "backend" / ".env")

app = Flask(__name__)

IS_PRODUCTION = os.getenv("NODE_ENV", "").lower() == "production" or bool(os.getenv("RENDER"))
API_KEY = os.getenv("ANALYTICS_API_KEY", "")

# The Express backend calls this service server-to-server, so browsers normally
# never hit it. CORS is only needed if you open the endpoints from a frontend.
CORS(
    app,
    origins=[
        origin.strip().rstrip("/")
        for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
        if origin.strip()
    ],
)


@app.before_request
def require_api_key():
    """Protect sales data when ANALYTICS_API_KEY is set (always set it in production)."""
    if not API_KEY or request.path in ("/", "/health"):
        return None
    if request.headers.get("x-api-key") != API_KEY:
        return jsonify({"message": "Invalid or missing API key."}), 401
    return None


@app.errorhandler(Exception)
def handle_error(err):
    from werkzeug.exceptions import HTTPException

    if isinstance(err, HTTPException):
        return jsonify({"message": err.description}), err.code
    app.logger.exception("Unhandled analytics error")
    return jsonify({"message": "Analytics query failed."}), 500


LOW_STOCK_THRESHOLD = int(
    os.getenv("LOW_STOCK_THRESHOLD", "5")
)


# --------------------------------------------------
# Homepage and health check
# --------------------------------------------------

@app.get("/")
def home():
    return jsonify({
        "service": "HybridMart Analytics",
        "status": "running",
        "health": "/health",
        "endpoints": [
            "/analytics/summary",
            "/analytics/top-products",
            "/analytics/revenue-by-category",
            "/analytics/low-stock",
            "/analytics/chart/revenue-by-category",
        ],
    })


@app.get("/health")
def health():
    return jsonify({
        "ok": True,
        "service": "python-analytics",
    })


# --------------------------------------------------
# Database connection
# --------------------------------------------------

def mysql_ssl_options():
    """TLS for remote MySQL (Aiven etc.). MYSQL_SSL=auto|true|false."""
    host = os.getenv("MYSQL_HOST", "localhost")
    mode = os.getenv("MYSQL_SSL", "auto").lower()
    is_local = host in ("localhost", "127.0.0.1", "::1")
    enabled = (not is_local) if mode == "auto" else mode in ("1", "true", "yes", "on", "required")

    if not enabled:
        return None

    ca_path = os.getenv("MYSQL_CA_PATH") or str(ROOT / "certs" / "ca.pem")
    if os.path.exists(ca_path):
        return {"ca": ca_path}
    # No CA file shipped: verify against the system trust store instead.
    return {"check_hostname": True}


def connect_sql():
    dialect = os.getenv("SQL_DIALECT", "mysql").lower()

    sqlite_path = os.getenv(
        "SQLITE_PATH",
        str(ROOT.parent / "backend" / "data" / "store.sqlite"),
    )

    if not os.path.isabs(sqlite_path):
        sqlite_path = str((ROOT / sqlite_path).resolve())

    if dialect != "sqlite":
        try:
            return pymysql.connect(
                host=os.getenv("MYSQL_HOST", "localhost"),
                port=int(os.getenv("MYSQL_PORT", "3306")),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_PASSWORD", ""),
                database=os.getenv("MYSQL_DATABASE", "hybrid_ecommerce_store"),
                cursorclass=pymysql.cursors.Cursor,
                connect_timeout=15,
                ssl=mysql_ssl_options(),
            )
        except Exception as err:
            print("MySQL unavailable for analytics:", str(err))

            # In production, never silently switch to an empty local database.
            if IS_PRODUCTION:
                raise

    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"SQLite file not found: {sqlite_path}")

    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    return conn


def read_frame(sql: str) -> pd.DataFrame:
    """Run a query and return a DataFrame with numeric columns coerced.

    A plain cursor is used (instead of pd.read_sql on a PyMySQL connection)
    to avoid pandas' DBAPI2 warning and to normalise DECIMAL values.
    """
    conn = connect_sql()

    try:
        cur = conn.cursor()
        cur.execute(sql)
        columns = [col[0] for col in cur.description]
        rows = [tuple(row) for row in cur.fetchall()]
        frame = pd.DataFrame(rows, columns=columns)
    finally:
        conn.close()

    for col in frame.columns:
        if frame[col].dtype == object and not frame[col].empty:
            sample = frame[col].dropna()
            if not sample.empty and all(isinstance(v, (int, float, Decimal)) for v in sample):
                frame[col] = pd.to_numeric(frame[col])
    return frame


# --------------------------------------------------
# Summary helpers
# --------------------------------------------------

def empty_summary():
    return {
        "total_orders": 0,
        "total_revenue": 0.0,
        "total_items_sold": 0,
        "cancelled_excluded": True,
        "note": (
            "No qualifying orders yet. "
            "Place an order to refresh these numbers."
        ),
    }


# --------------------------------------------------
# Sales summary
# GET /analytics/summary
# --------------------------------------------------

@app.get("/analytics/summary")
def summary():
    orders = read_frame(
        "SELECT id, total_amount, status FROM orders"
    )

    if orders.empty:
        return jsonify(empty_summary())

    valid = orders[
        orders["status"].str.lower() != "cancelled"
    ]

    items = read_frame(
        """
        SELECT oi.quantity
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE LOWER(o.status) <> 'cancelled'
        """
    )

    total_items = (
        int(items["quantity"].sum())
        if not items.empty
        else 0
    )

    total_revenue = (
        float(valid["total_amount"].sum())
        if not valid.empty
        else 0.0
    )

    return jsonify({
        "total_orders": int(len(valid)),
        "total_revenue": round(total_revenue, 2),
        "total_items_sold": total_items,
        "cancelled_excluded": True,
        "all_orders_including_cancelled": int(len(orders)),
    })


# --------------------------------------------------
# Top-selling products
# GET /analytics/top-products
# --------------------------------------------------

@app.get("/analytics/top-products")
def top_products():
    frame = read_frame(
        """
        SELECT
            p.id,
            p.name,
            p.category,
            SUM(oi.quantity) AS units_sold,
            SUM(oi.quantity * oi.price_at_purchase) AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE LOWER(o.status) <> 'cancelled'
        GROUP BY p.id, p.name, p.category
        ORDER BY units_sold DESC
        """
    )

    if frame.empty:
        return jsonify({"products": []})

    records = []

    for _, row in frame.head(10).iterrows():
        records.append({
            "id": int(row["id"]),
            "name": row["name"],
            "category": row["category"],
            "units_sold": int(row["units_sold"]),
            "revenue": round(float(row["revenue"]), 2),
        })

    return jsonify({"products": records})


# --------------------------------------------------
# Revenue by category
# GET /analytics/revenue-by-category
# --------------------------------------------------

@app.get("/analytics/revenue-by-category")
def revenue_by_category():
    frame = read_frame(
        """
        SELECT
            p.category,
            SUM(oi.quantity * oi.price_at_purchase) AS revenue,
            SUM(oi.quantity) AS units_sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE LOWER(o.status) <> 'cancelled'
        GROUP BY p.category
        ORDER BY revenue DESC
        """
    )

    if frame.empty:
        return jsonify({"categories": []})

    categories = [
        {
            "category": row["category"],
            "revenue": round(float(row["revenue"]), 2),
            "units_sold": int(row["units_sold"]),
        }
        for _, row in frame.iterrows()
    ]

    return jsonify({"categories": categories})


# --------------------------------------------------
# Low-stock products
# GET /analytics/low-stock
# --------------------------------------------------

@app.get("/analytics/low-stock")
def low_stock():
    frame = read_frame(
        "SELECT id, name, category, stock, price FROM products"
    )

    if frame.empty:
        return jsonify({
            "threshold": LOW_STOCK_THRESHOLD,
            "products": [],
        })

    low = frame[
        frame["stock"] <= LOW_STOCK_THRESHOLD
    ].sort_values("stock")

    products = [
        {
            "id": int(row["id"]),
            "name": row["name"],
            "category": row["category"],
            "stock": int(row["stock"]),
            "price": round(float(row["price"]), 2),
        }
        for _, row in low.iterrows()
    ]

    return jsonify({
        "threshold": LOW_STOCK_THRESHOLD,
        "products": products,
    })


# --------------------------------------------------
# Revenue chart
# GET /analytics/chart/revenue-by-category
# --------------------------------------------------

@app.get("/analytics/chart/revenue-by-category")
def revenue_chart():
    payload = revenue_by_category().get_json()
    categories = payload.get("categories", [])

    fig, ax = plt.subplots(figsize=(8, 4.5))

    try:
        if not categories:
            ax.text(
                0.5,
                0.5,
                "No sales yet",
                ha="center",
                va="center",
                fontsize=14,
            )
            ax.set_axis_off()
        else:
            names = [
                item["category"]
                for item in categories
            ]

            values = [
                item["revenue"]
                for item in categories
            ]

            ax.bar(names, values, color="#4338ca")

            ax.set_title(
                "Revenue by category (₹), "
                "cancelled orders excluded"
            )
            ax.set_ylabel("Revenue (₹)")
            ax.set_xlabel("Category")

            plt.xticks(rotation=20, ha="right")
            fig.tight_layout()

        buffer = io.BytesIO()
        fig.savefig(buffer, format="png", dpi=120)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="image/png",
        )
    finally:
        plt.close(fig)


# --------------------------------------------------
# Start server
# --------------------------------------------------

if __name__ == "__main__":
    # Render provides PORT automatically.
    # ANALYTICS_PORT remains a local-development fallback.
    port = int(
        os.getenv(
            "PORT",
            os.getenv("ANALYTICS_PORT", "5001"),
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )
