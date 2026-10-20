# 8–10 slide presentation outline

1. **Title**  
   E-Commerce Mini Store using hybrid SQL + NoSQL. Name, roll number, AIML, year.

2. **Problem**  
   A campus store needs shopping, orders, and reports. One database type is not ideal for every feature.

3. **Objectives**  
   Working mini store, role-based login, hybrid databases, Python analytics, viva-friendly code.

4. **Architecture**  
   React → Express → MySQL + MongoDB; Express → Flask/Pandas. Browser never holds DB passwords.

5. **SQL design**  
   users, products, orders, order_items. Foreign keys. `price_at_purchase`. ER diagram.

6. **MongoDB design**  
   carts, wishlists, reviews. Application-level IDs. Why documents fit arrays of items.

7. **Checkout demo**  
   Read cart → SQL transaction → stock check → commit → clear cart. What happens on failure.

8. **Analytics**  
   Pandas aggregations, Matplotlib category chart, cancelled orders excluded, admin JWT proxy.

9. **Screenshots**  
   Catalogue, cart, order success, admin dashboard.

10. **Conclusion and viva hook**  
    Hybrid integration, limitations (simulated payment), future work (restore stock on cancel).
