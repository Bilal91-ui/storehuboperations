const db = require('./db');

function addPricingColumns() {
  const columns = [
    'basePrice DECIMAL(10,2) DEFAULT NULL',
    'discountPercent DECIMAL(5,2) DEFAULT 0',
    'salePrice DECIMAL(10,2) DEFAULT NULL',
    'promoStart DATE DEFAULT NULL',
    'promoEnd DATE DEFAULT NULL'
  ];

  const addColumnPromises = columns.map(col => {
    return new Promise((resolve, reject) => {
      const colName = col.split(' ')[0];
      const checkSql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = '${colName}'`;
      db.query(checkSql, (err, rows) => {
        if (err) return reject(err);
        const cnt = rows[0] && (rows[0].cnt || rows[0]['COUNT(*)']);
        if (!cnt) {
          db.query(`ALTER TABLE products ADD COLUMN ${col}`, (e) => {
            if (e) return reject(e);
            console.log(`Added ${colName} column to products`);
            resolve();
          });
        } else {
          console.log(`${colName} column already exists`);
          resolve();
        }
      });
    });
  });

  Promise.all(addColumnPromises)
    .then(() => {
      // Set basePrice = price for existing products where basePrice is null
      db.query('UPDATE products SET basePrice = price WHERE basePrice IS NULL', (err) => {
        if (err) {
          console.error('Update basePrice error:', err);
          process.exit(1);
        }
        console.log('Updated basePrice for existing products');
        process.exit(0);
      });
    })
    .catch(err => {
      console.error('Error adding columns:', err);
      process.exit(1);
    });
}

addPricingColumns();