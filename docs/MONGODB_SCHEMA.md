# MongoDB collections

IDs such as `user_id` and `product_id` are integers copied from MySQL. MongoDB cannot enforce a foreign key to MySQL. Express checks that the product exists before writing a cart, wishlist, or review.

## carts

```json
{
  "user_id": 2,
  "items": [
    { "product_id": 1, "quantity": 2 }
  ],
  "updated_at": "2026-04-20T10:15:00.000Z"
}
```

Unique index on `user_id`. Quantities must be ≥ 1. Display prices always come from SQL.

## wishlists

```json
{
  "user_id": 2,
  "product_ids": [1, 4, 8],
  "updated_at": "2026-04-20T10:16:00.000Z"
}
```

## reviews

```json
{
  "product_id": 1,
  "user_id": 2,
  "rating": 5,
  "comment": "Clear sound and comfortable for long lectures.",
  "created_at": "2026-04-20T12:00:00.000Z"
}
```

Unique compound index on `(product_id, user_id)`. Rating is 1–5. A review is allowed only if that user has a non-cancelled order containing the product.

## browsing_history

Not implemented. Catalogue, checkout, and analytics were completed first. It can be added later as `{ user_id, product_id, timestamp }`.
