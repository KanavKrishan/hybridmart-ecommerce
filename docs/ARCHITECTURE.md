# Phase 1 — Architecture and Academic Design

## Problem statement

A small campus store needs a working website where students can browse products, keep a cart and wishlist, place orders, and leave reviews. Staff need to manage products, update order status, and see simple sales analytics.

A single database type is not a perfect fit:

- Orders must not lose items or oversell stock. That needs **relational tables and SQL transactions**.
- Carts, wishlists, and reviews change shape often and belong to one user document. That fits **MongoDB**.
- Sales charts are easier with **Python Pandas**, without turning Python into a second application backend.

## Objectives

1. Let customers register, log in, shop, check out, and review products they bought.
2. Let an administrator manage products and orders and view live analytics.
3. Show why SQL and NoSQL can work together in one application.
4. Keep the code simple enough for a second-year viva.

## System architecture

```
React (Vite)  --Axios/JWT-->  Express REST API
                                   |
                    +--------------+---------------+
                    |                              |
                 MySQL / SQLite                 MongoDB
           users, products,             carts, wishlists, reviews
           orders, order_items
                    |
                    | HTTP (server-side only)
                    v
              Flask + Pandas + Matplotlib
                 analytics service
```

### How the pieces talk

1. The browser never talks to MySQL, MongoDB, or Flask directly.
2. Express stores accounts, catalogue, and orders in SQL.
3. Express stores carts, wishlists, and reviews in MongoDB. `user_id` and `product_id` are copied from SQL. There is **no cross-database foreign key**. The Node app checks that the IDs exist.
4. Express calls Flask (`GET /analytics/...`) using a shared internal URL. Flask reads the **same SQL database** and returns JSON plus one chart image.
5. The admin React page calls Express (`/api/admin/analytics/...`). Only administrators with a JWT can see it.

### Checkout sequence (the hybrid workflow)

1. User clicks Checkout.
2. Express reads the MongoDB cart.
3. If the cart is empty, it returns an error and does not touch SQL.
4. Express starts a **SQL transaction**.
5. For each item it locks/reads the product row, checks stock, inserts `orders` and `order_items`, and reduces stock.
6. If anything fails, SQL rolls back. The MongoDB cart is **left unchanged**.
7. If SQL commits, Express then deletes/clears the MongoDB cart.

**Important viva point:** MySQL and MongoDB do **not** share one atomic transaction. If SQL succeeds and clearing the cart fails, the order still exists and stock is already reduced. The cart may still show items. The student should say: “we commit SQL first so money/stock stay consistent, then we best-effort clear the cart and log a failure if MongoDB is down.”

### Cancelled orders

Revenue and “items sold” **exclude** orders with status `Cancelled`. Placed, Processing, Shipped, and Delivered all count. This rule is used in Flask and in any Node summaries.

## SQL vs MongoDB (simple language)

| Data | Store | Why |
|------|--------|-----|
| Users | SQL | Unique email, roles, password hashes |
| Products | SQL | Price and stock must be exact |
| Orders + items | SQL | Foreign keys + checkout transaction |
| Cart | MongoDB | One document per user, easy to edit item arrays |
| Wishlist | MongoDB | Simple list of product IDs |
| Reviews | MongoDB | Comments vary; rating is nested with the product |

## Development sequence

1. Databases + seed data
2. Auth, products, cart, wishlist
3. Checkout transaction + orders + reviews
4. Flask analytics
5. React pages
6. End-to-end tests and college documents
