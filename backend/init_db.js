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
    console.log('✅ Database `storehub` and table `products` created or already exist');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message || err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

init();
