# 5–7 minute demonstration script

1. **(20 s)** Open the home page. Say: this is a college mini store. React is the UI, Express is the only backend the browser uses, MySQL (or SQLite fallback) stores orders, MongoDB stores the cart, Flask analyses sales.

2. **(40 s)** Register a new student account. Show that the password is not stored in plain text (open `users` table or mention bcrypt). Log out and show a wrong-password error, then log in correctly.

3. **(50 s)** Search “Yoga”, filter category Electronics, open a product. Add to wishlist, then cart. Change quantity. Point out the Network tab: cart POST goes to Express, not MongoDB Compass.

4. **(70 s)** Checkout. Show the confirmation page. Open MySQL/SQLite `orders` and `order_items`. Show `products.stock` decreased. Open MongoDB `carts` and show items array is empty.

5. **(40 s)** Try checkout again with an empty cart — error. Optionally reduce stock to 0 in the admin product screen and show the insufficient-stock message while the cart remains.

6. **(40 s)** Place a review on the purchased product. Try the same review twice — duplicate blocked. Mention purchase-only policy.

7. **(50 s)** Log in as `admin@hybridstore.test` / `Admin@123`. Change an order status. Open Analytics. Show totals and the Matplotlib chart. Place another order in a second browser/window and click Refresh — numbers increase.

8. **(20 s)** Close: cancelled orders are excluded from revenue; SQL and MongoDB are not one atomic transaction.
