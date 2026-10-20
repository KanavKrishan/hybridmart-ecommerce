# Viva questions and short answers

1. **Why use both SQL and MongoDB?**  
   SQL gives constraints and transactions for users, stock, and orders. MongoDB stores carts, wishlists, and reviews as flexible documents.

2. **Why not put the cart in MySQL?**  
   You can, but a cart is one document with a changing array of items. MongoDB updates that document without extra join tables. The project uses it to demonstrate NoSQL.

3. **Where is the password stored?**  
   Only a bcrypt hash in `users.password_hash`. The original password is discarded.

4. **What is JWT?**  
   After login the server signs a token. The client sends it on later requests. The server verifies the signature instead of storing server sessions.

5. **Can a customer become admin by sending `role: admin` while registering?**  
   No. Register always inserts `customer`.

6. **How do you stop overselling?**  
   Checkout runs in a SQL transaction, checks stock, and updates with `stock = stock - qty WHERE stock >= qty`. If that updates 0 rows, it rolls back.

7. **Do MySQL and MongoDB commit together?**  
   No. SQL commits first. Then the cart is cleared. If cart clearing fails, the order still exists.

8. **What if checkout fails?**  
   SQL rolls back. The MongoDB cart is left as it was so the user can retry.

9. **Why store `price_at_purchase`?**  
   Product prices can change later. Historical orders must keep the amount the customer actually paid.

10. **Who can see whose orders?**  
    A customer only sees their `user_id`. Admins see all. The API checks this on `GET /orders/:id`.

11. **Why can I review only after buying?**  
    The API looks for a non-cancelled `order_items` row for that user and product. It reduces fake reviews.

12. **How is duplicate review stopped?**  
    Unique MongoDB index on `(product_id, user_id)` plus an application check.

13. **Does the frontend decide the order total?**  
    No. Express recalculates from current SQL prices.

14. **How does Python get the data?**  
    Flask reads the same SQL database with Pandas. Express proxies those JSON/PNG endpoints to the admin UI after JWT + admin checks.

15. **Are cancelled orders in revenue?**  
    No. Status `Cancelled` is excluded everywhere in analytics.

16. **What if Flask is down?**  
    The store still works. The analytics page shows an error asking to start port 5001.

17. **Why SQLite fallback?**  
    So the project runs on a lab PC where MySQL login is not configured. Schema is the same idea.

18. **What is parameterized SQL?**  
    Values are passed as `?` placeholders so user input cannot change the SQL text (basic SQL injection defence).

19. **Why CORS?**  
    The React app runs on port 5173 and the API on 5000. The browser blocks that unless the API allows the frontend origin.

20. **Why no payment gateway?**  
    The academic goal is hybrid databases and a working checkout transaction, not bank integration.

21. **What happens if an admin deletes a product that was already ordered?**  
    Foreign keys block the delete. Stock/price can still be edited.

22. **How are MongoDB references kept valid?**  
    Application logic: look up the product in SQL before writing cart/wishlist/review.

23. **What indexes did you add?**  
    SQL: product category/name, order user/status. MongoDB: unique `user_id` on carts/wishlists, unique pair on reviews.

24. **How would you restore stock on cancel?**  
    Add a SQL transaction that sets status to Cancelled and adds quantities back, only if it was not already cancelled. Not implemented to keep the demo small.

25. **Is this production ready?**  
    No. Demo secrets, simulated payment, simple validation. It is a teaching project.
