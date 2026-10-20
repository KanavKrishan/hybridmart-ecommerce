"""
Flask analytics service.

Reads the same SQL database that Express uses (MySQL preferred, SQLite fallback).
Cancelled orders are excluded from revenue and units sold.
The React app never talks to this service directly.
"""

from __future__ import annotations

import io
import os
import sqlite3
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, send_file
from flask_cors import CORS

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / "backend" / ".env")

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])

LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "5"))
VALID_ORDER_SQL = "o.status <> 'Cancelled'"


def connect_sql():
    dialect = os.getenv("SQL_DIALECT", "mysql").lower()
    sqlite_path = os.getenv("SQLITE_PATH", str(ROOT.parent / "backend" / "data" / "store.sqlite"))
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
            )
        except Exception as err:
            print("MySQL unavailable for analytics, using SQLite:", err)

    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"SQLite file not found: {sqlite_path}")
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    return conn


def read_frame(sql: str) -> pd.DataFrame:
    conn = connect_sql()
    try:
        return pd.read_sql(sql, conn)
    finally:
        conn.close()


def empty_summary():
    return {
        "total_orders": 0,
        "total_revenue": 0.0,
        "total_items_sold": 0,
        "cancelled_excluded": True,
        "note": "No qualifying orders yet. Place an order to refresh these numbers.",
    }


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "python-analytics"})


@app.get("/analytics/summary")
def summary():
    orders = read_frame("SELECT id, total_amount, status FROM orders")
    if orders.empty:
        return jsonify(empty_summary())

    valid = orders[orders["status"] != "Cancelled"]
    items = read_frame(
        """
        SELECT oi.quantity
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status <> 'Cancelled'
        """
    )
    total_items = int(items["quantity"].sum()) if not items.empty else 0
    return jsonify(
        {
            "total_orders": int(len(valid)),
            "total_revenue": round(float(valid["total_amount"].sum()) if not valid.empty else 0.0, 2),
            "total_items_sold": total_items,
            "cancelled_excluded": True,
            "all_orders_including_cancelled": int(len(orders)),
        }
    )


@app.get("/analytics/top-products")
def top_products():
    frame = read_frame(
        """
        SELECT p.id, p.name, p.category,
               SUM(oi.quantity) AS units_sold,
               SUM(oi.quantity * oi.price_at_purchase) AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.status <> 'Cancelled'
        GROUP BY p.id, p.name, p.category
        ORDER BY units_sold DESC
        """
    )
    if frame.empty:
        return jsonify({"products": []})
    records = []
    for _, row in frame.head(10).iterrows():
        records.append(
            {
                "id": int(row["id"]),
                "name": row["name"],
                "category": row["category"],
                "units_sold": int(row["units_sold"]),
                "revenue": round(float(row["revenue"]), 2),
            }
        )
    return jsonify({"products": records})


@app.get("/analytics/revenue-by-category")
def revenue_by_category():
    frame = read_frame(
        """
        SELECT p.category,
               SUM(oi.quantity * oi.price_at_purchase) AS revenue,
               SUM(oi.quantity) AS units_sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.status <> 'Cancelled'
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


@app.get("/analytics/low-stock")
def low_stock():
    frame = read_frame("SELECT id, name, category, stock, price FROM products")
    if frame.empty:
        return jsonify({"threshold": LOW_STOCK_THRESHOLD, "products": []})
    low = frame[frame["stock"] <= LOW_STOCK_THRESHOLD].sort_values("stock")
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
    return jsonify({"threshold": LOW_STOCK_THRESHOLD, "products": products})


@app.get("/analytics/chart/revenue-by-category")
def revenue_chart():
    payload = revenue_by_category().get_json()
    categories = payload.get("categories", [])

    fig, ax = plt.subplots(figsize=(8, 4.5))
    if not categories:
        ax.text(0.5, 0.5, "No sales yet", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
    else:
        names = [c["category"] for c in categories]
        values = [c["revenue"] for c in categories]
        ax.bar(names, values, color="#4338ca")
        ax.set_title("Revenue by category (₹), cancelled orders excluded")
        ax.set_ylabel("Revenue (₹)")
        ax.set_xlabel("Category")
        plt.xticks(rotation=20, ha="right")
        fig.tight_layout()

    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", dpi=120)
    plt.close(fig)
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png")


if __name__ == "__main__":
    port = int(os.getenv("ANALYTICS_PORT", "5001"))
    app.run(host="127.0.0.1", port=port, debug=True)
