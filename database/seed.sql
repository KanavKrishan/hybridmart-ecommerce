-- Sample catalogue data. Passwords are NOT stored here.
-- Create users with: npm run seed  (hashes Admin@123 and Customer@123)

USE hybrid_ecommerce_store;

INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Wireless Bluetooth Headphones', 'Over-ear headphones with 20 hours of battery life.', 2499.00, 25, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85'),
('USB-C Power Bank 20000mAh', 'Fast-charging power bank for laptops and phones.', 1799.00, 18, 'Electronics', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=85'),
('Wireless Mouse', 'Silent click mouse with a USB receiver.', 699.00, 40, 'Electronics', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85'),
('Cotton Casual T-Shirt', 'Breathable cotton tee in navy blue.', 599.00, 50, 'Clothing', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85'),
('Slim Fit Denim Jeans', 'Mid-wash jeans suitable for college wear.', 1299.00, 30, 'Clothing', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85'),
('Introduction to Artificial Intelligence', 'Beginner textbook covering search, ML basics, and ethics.', 899.00, 20, 'Books', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=85'),
('Data Structures Workbook', 'Practice problems on arrays, stacks, queues, and trees.', 499.00, 35, 'Books', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85'),
('Stainless Steel Water Bottle', '750 ml insulated bottle.', 399.00, 60, 'Home', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85'),
('Desk Organiser Set', 'Pen stand, tray, and sticky-note holder.', 749.00, 22, 'Home', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85'),
('Yoga Mat', '6 mm non-slip mat for home workouts.', 899.00, 15, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=85'),
('Limited Demo Stylus', 'Low-stock item used to demonstrate the analytics low-stock report.', 299.00, 3, 'Electronics', 'https://images.unsplash.com/photo-1586210579191-837e7d2d4b5e?auto=format&fit=crop&w=900&q=85');
