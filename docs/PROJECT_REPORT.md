# Project report

**Title:** E-Commerce Mini Store: Design and Development Using Hybrid SQL and NoSQL Database Integration

**Student context:** Second-year BTech AIML mini project

## 1. Introduction

This project is a small online store for a college demonstration. Customers can browse products priced in Indian rupees, manage a cart and wishlist, place an order, and write a review. An administrator can edit the catalogue, update order status, and view sales charts.

The academic focus is **hybrid data storage**, not a commercial shopping site.

## 2. Problem statement

Structured commerce data (users, products, orders) needs constraints and transactions. Flexible user activity (carts, wishlists, reviews) is easier to store as documents. Sales reporting is convenient in Python. The system therefore uses MySQL, MongoDB, and a small Flask analytics service behind one Express API.

## 3. Objectives

- Implement registration, JWT login, and role-based access.
- Store the catalogue and orders in SQL.
- Store carts, wishlists, and reviews in MongoDB.
- Check out with a SQL transaction that prevents overselling.
- Analyse live order data with Pandas and Matplotlib.
- Keep the implementation simple enough to explain in a viva.

## 4. Technology stack

React, React Router, Axios, Bootstrap, Node.js, Express, JWT, bcrypt, mysql2, SQLite fallback, MongoDB, Mongoose, Flask, Pandas, Matplotlib.

## 5. Architecture

See `docs/ARCHITECTURE.md`. The browser talks only to Express. Express talks to SQL and MongoDB. Express also calls Flask. Flask reads SQL with Pandas.

## 6. Database design

See `database/schema.sql`, `docs/ER_DIAGRAM.md`, and `docs/MONGODB_SCHEMA.md`.

## 7. Modules

A. Auth — bcrypt hashes, JWT, customer vs admin  
B. Catalogue — search, filter, admin CRUD  
C. Cart — MongoDB document, prices from SQL  
D. Wishlist — MongoDB list, move to cart  
E. Checkout — SQL transaction, then clear cart  
F. Orders — customer history, admin status updates  
G. Reviews — MongoDB, purchase required, one review per user per product  
H. Analytics — Flask summaries and one bar chart  

## 8. Checkout consistency

The SQL transaction inserts the order, inserts items, and reduces stock together. If stock is too low, the transaction rolls back and the MongoDB cart is unchanged.

MySQL and MongoDB are **not** one distributed transaction. After a successful SQL commit, the API tries to empty the cart. If that MongoDB write fails, the order still stands and a warning is returned.

## 9. Analytics rule

Orders with status `Cancelled` are excluded from revenue, items sold, top products, and the chart. Other statuses count.

## 10. Limitations

- Payment is simulated.
- Images are URLs, not an upload service.
- Stock is not automatically restored if an admin later marks an order Cancelled.
- Browsing history / ML recommendations are omitted on purpose.
- If MySQL credentials are missing, the app falls back to SQLite with the same tables.

## 11. Conclusion

The project shows a realistic split: SQL for money and stock, MongoDB for user activity documents, and Python for analysis of the same SQL data.
