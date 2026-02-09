CREATE DATABASE IF NOT EXISTS storehub;
USE storehub;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  stock INT,
  category VARCHAR(100),
  description TEXT,
  image VARCHAR(255)
);
-- Insert sample products
INSERT INTO products (name, price, stock, category, description, image) VALUES
('Olpers Milk', 370.00, 50, 'Dairy Products', 'Fresh and delicious milk', '/uploads/olper.jpg'),
('Coca Cola 1.5L', 160.00, 100, 'Beverages', 'Refreshing cola drink', '/uploads/coca.jpg'),
('SURF Excel 500g', 260.00, 75, 'Groceries', 'Powerful laundry detergent', '/uploads/surf.jpg'),
('Rice 1kg', 350.00, 60, 'Groceries', 'Premium quality rice', '/uploads/rice.jpg'),
('Shan Biryani Masala', 150.00, 40, 'Groceries', 'Authentic biryani spice mix', '/uploads/shan.jpg'),
('Nescafe Coffee', 450.00, 30, 'Tea and Coffee', 'Instant coffee powder', '/uploads/nescafe.jpg');

-- Insert sample products
INSERT INTO products (name, price, stock, category, description, image) VALUES
('Olpers Milk', 370.00, 50, 'Dairy Products', 'Fresh and delicious milk', '/uploads/olper.jpg'),
('Coca Cola 1.5L', 160.00, 100, 'Beverages', 'Refreshing cola drink', '/uploads/coca.jpg'),
('SURF Excel 500g', 260.00, 75, 'Groceries', 'Powerful laundry detergent', '/uploads/surf.jpg'),
('Rice 1kg', 350.00, 60, 'Groceries', 'Premium quality rice', '/uploads/rice.jpg'),
('Shan Biryani Masala', 150.00, 40, 'Groceries', 'Authentic biryani spice mix', '/uploads/shan.jpg'),
('Nescafe Coffee', 450.00, 30, 'Tea and Coffee', 'Instant coffee powder', '/uploads/nescafe.jpg');