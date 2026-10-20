# API documentation

Base URL: `http://localhost:5000/api`

Protected routes need header: `Authorization: Bearer <jwt>`

## Auth

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/auth/register` | no | `{ name, email, password }` (role is always customer) |
| POST | `/auth/login` | no | `{ email, password }` |
| GET | `/auth/me` | yes | |

## Products

| Method | Path | Auth |
|--------|------|------|
| GET | `/products?search=&category=` | no |
| GET | `/products/categories` | no |
| GET | `/products/:id` | no |
| POST | `/products` | admin |
| PUT | `/products/:id` | admin |
| DELETE | `/products/:id` | admin |

## Cart and wishlist

| Method | Path | Auth |
|--------|------|------|
| GET | `/cart` | customer/admin |
| POST | `/cart/items` | `{ product_id, quantity }` |
| PATCH | `/cart/items/:productId` | `{ quantity }` |
| DELETE | `/cart/items/:productId` | |
| GET | `/wishlist` | |
| POST | `/wishlist/items` | `{ product_id }` |
| DELETE | `/wishlist/items/:productId` | |
| POST | `/wishlist/items/:productId/move-to-cart` | |

## Orders

| Method | Path | Auth |
|--------|------|------|
| POST | `/orders/checkout` | yes |
| GET | `/orders/mine` | yes |
| GET | `/orders/:id` | owner or admin |
| GET | `/orders/admin` | admin |
| PATCH | `/orders/admin/:id/status` | admin `{ status }` |

Statuses: Placed, Processing, Shipped, Delivered, Cancelled.

## Reviews

| Method | Path | Auth |
|--------|------|------|
| GET | `/reviews/product/:productId` | no |
| POST | `/reviews` | yes `{ product_id, rating, comment }` |

## Admin analytics (proxied from Flask)

| Method | Path |
|--------|------|
| GET | `/admin/analytics/summary` |
| GET | `/admin/analytics/top-products` |
| GET | `/admin/analytics/revenue-by-category` |
| GET | `/admin/analytics/low-stock` |
| GET | `/admin/analytics/chart/revenue-by-category` (PNG) |

Flask itself listens on `http://127.0.0.1:5001` and is not called from the browser.

## curl examples (Windows PowerShell)

```powershell
# Login
$body = @{ email = "customer@hybridstore.test"; password = "Customer@123" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -Body $body -ContentType "application/json"
$token = $login.token

# Add to cart
$headers = @{ Authorization = "Bearer $token" }
$item = @{ product_id = 1; quantity = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/cart/items -Headers $headers -Body $item -ContentType "application/json"

# Checkout
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/orders/checkout -Headers $headers
```
