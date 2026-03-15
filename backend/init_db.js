require('dotenv').config();
const mysql = require('mysql2/promise');

async function init() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

  let connection;
  try {
    connection = await mysql.createConnection({ host, user, password, port });

    await connection.query('CREATE DATABASE IF NOT EXISTS storehub');
    await connection.query('USE storehub');

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        price DECIMAL(10,2),
        stock INT,
        category VARCHAR(100),
        description TEXT,
        image VARCHAR(255)
      );
    `;

    await connection.query(createTableSql);
    // Create cart table to store items added to cart
    const createCartTable = `
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `;

    await connection.query(createCartTable);

    // Create orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        shipping_address TEXT,
        payment_method ENUM('cod', 'easypaisa', 'jazzcash', 'card'),
        payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        subtotal DECIMAL(10,2),
        shipping_cost DECIMAL(10,2) DEFAULT 10.00,
        tax_amount DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        otp_code VARCHAR(6),
        otp_verified BOOLEAN DEFAULT FALSE,
        otp_sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    await connection.query(createOrdersTable);

    // Ensure legacy columns exist (for older schemas) - safe to keep
    async function ensureColumn(table, column, definition) {
      const [rows] = await connection.query(
        "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        [table, column]
      );
      if (rows[0].cnt === 0) {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    }

    // Ensure current schema fields exist (for both old & new versions)
    await ensureColumn('orders', 'order_number', 'VARCHAR(20) UNIQUE');
    await ensureColumn('orders', 'customer_email', 'VARCHAR(255)');
    await ensureColumn('orders', 'customer_phone', 'VARCHAR(20)');
    await ensureColumn('orders', 'shipping_address', 'TEXT');
    await ensureColumn('orders', 'payment_method', "ENUM('cod', 'easypaisa', 'jazzcash', 'card')");
    await ensureColumn('orders', 'payment_status', "ENUM('pending', 'paid', 'failed') DEFAULT 'pending'");
    await ensureColumn('orders', 'order_status', "ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");
    await ensureColumn('orders', 'subtotal', 'DECIMAL(10,2)');
    await ensureColumn('orders', 'shipping_cost', 'DECIMAL(10,2) DEFAULT 10.00');
    await ensureColumn('orders', 'tax_amount', 'DECIMAL(10,2)');
    await ensureColumn('orders', 'total_amount', 'DECIMAL(10,2)');
    await ensureColumn('orders', 'otp_code', 'VARCHAR(6)');
    await ensureColumn('orders', 'otp_verified', 'BOOLEAN DEFAULT FALSE');
    await ensureColumn('orders', 'otp_sent_at', 'TIMESTAMP NULL');

    // Keep legacy columns for older versions
    await ensureColumn('orders', 'address', 'TEXT');
    await ensureColumn('orders', 'total', 'DECIMAL(10,2)');
    await ensureColumn('orders', 'status', "ENUM('Pending','Processing','Shipped','Completed','Cancelled') DEFAULT 'Pending'");

    // Ensure legacy columns are nullable to avoid insert failures
    await connection.query("ALTER TABLE orders MODIFY COLUMN address TEXT NULL").catch(()=>{});
    await connection.query("ALTER TABLE orders MODIFY COLUMN total DECIMAL(10,2) NULL").catch(()=>{});
    await connection.query("ALTER TABLE orders MODIFY COLUMN status ENUM('Pending','Processing','Shipped','Completed','Cancelled') NULL").catch(()=>{});
    await connection.query("ALTER TABLE orders MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(()=>{});
    await connection.query("ALTER TABLE orders MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(()=>{});

    // Create order_items table
    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `;

    await connection.query(createOrderItemsTable);

    // Ensure legacy order_items schema contains expected columns (for older schema versions)
    await ensureColumn('order_items', 'product_id', 'INT NOT NULL');
    await ensureColumn('order_items', 'product_name', 'VARCHAR(255) NOT NULL');
    await ensureColumn('order_items', 'product_price', 'DECIMAL(10,2) NOT NULL');
    await ensureColumn('order_items', 'quantity', 'INT NOT NULL');
    await ensureColumn('order_items', 'total_price', 'DECIMAL(10,2) NOT NULL');

    console.log('✅ Database `storehub` and tables `products`, `cart`, `orders`, and `order_items` created or already exist');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message || err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

init();
