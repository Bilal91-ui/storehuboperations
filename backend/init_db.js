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

    await ensureColumn('products', 'basePrice', 'DECIMAL(10,2)');
    await ensureColumn('products', 'discountPercent', 'INT DEFAULT 0');
    await ensureColumn('products', 'salePrice', 'DECIMAL(10,2) DEFAULT 0');
    await ensureColumn('products', 'promoStart', 'DATETIME NULL');
    await ensureColumn('products', 'promoEnd', 'DATETIME NULL');

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

    // Create auth-related tables
    const createRolesTable = `
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createRolesTable);

    await connection.query(`
      INSERT IGNORE INTO roles (role_name, description) VALUES
      ('rider', 'Delivery person'),
      ('seller', 'Store owner'),
      ('admin', 'System administrator')
    `);

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        registration_status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
        role_id INT NOT NULL,
        approved_by INT,
        approved_date TIMESTAMP NULL,
        rejection_reason TEXT,
        rejected_by INT,
        rejected_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (registration_status),
        INDEX idx_role (role_id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      );
    `;
    await connection.query(createUsersTable);

    const createRidersTable = `
      CREATE TABLE IF NOT EXISTS riders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        license_expiry DATE,
        documents_verified BOOLEAN DEFAULT FALSE,
        verified_by INT,
        verified_date TIMESTAMP NULL,
        phone_number VARCHAR(20),
        current_location JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createRidersTable);

    const createSellersTable = `
      CREATE TABLE IF NOT EXISTS sellers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        business_name VARCHAR(100) NOT NULL,
        store_address VARCHAR(255) NOT NULL,
        store_phone VARCHAR(20),
        documents_verified BOOLEAN DEFAULT FALSE,
        verified_by INT,
        verified_date TIMESTAMP NULL,
        store_image_url VARCHAR(255),
        store_status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive',
        rating DECIMAL(3, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (store_status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createSellersTable);

    const createAdminsTable = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        admin_level ENUM('super_admin', 'moderator') DEFAULT 'moderator',
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createAdminsTable);

    const createRegistrationEventsTable = `
      CREATE TABLE IF NOT EXISTS registration_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_type ENUM('applied', 'approved', 'rejected', 'email_verified', 'document_verified') NOT NULL,
        actor_id INT,
        notes TEXT,
        event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_event_type (event_type),
        INDEX idx_timestamp (event_timestamp),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createRegistrationEventsTable);

    const createEmailVerificationTable = `
      CREATE TABLE IF NOT EXISTS email_verification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        otp_code VARCHAR(6),
        otp_expires_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP NULL,
        attempts INT DEFAULT 0,
        last_attempt_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createEmailVerificationTable);

    // Insert sample products if table is empty
    const [productRows] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (productRows[0].count === 0) {
      const sampleProducts = [
        ['Apple', 50.00, 100, 'Fruits', 'Fresh red apple', '/uploads/apple.jpg'],
        ['Banana', 30.00, 150, 'Fruits', 'Yellow banana', '/uploads/banana.jpg'],
        ['Milk', 120.00, 50, 'Dairy Products', 'Fresh cow milk', '/uploads/milk.jpg'],
        ['Bread', 40.00, 80, 'Bakery and Breakfast', 'White bread loaf', '/uploads/bread.jpg'],
        ['Chicken Breast', 250.00, 30, 'Meat', 'Fresh chicken breast', '/uploads/chicken.jpg'],
        ['Orange Juice', 80.00, 60, 'Beverages', 'Fresh orange juice', '/uploads/juice.jpg'],
        ['Tomato', 25.00, 200, 'Vegetables', 'Red tomato', '/uploads/tomato.jpg'],
        ['Cheese', 150.00, 40, 'Dairy Products', 'Cheddar cheese', '/uploads/cheese.jpg']
      ];
      for (const product of sampleProducts) {
        await connection.query('INSERT INTO products (name, price, stock, category, description, image, basePrice) VALUES (?, ?, ?, ?, ?, ?, ?)', [...product, product[1]]);
      }
      console.log('✅ Sample products inserted');
    }

    console.log('✅ Database `storehub` and all required tables are created or already exist');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message || err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

init();
