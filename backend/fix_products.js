const db = require('./db');

// Update existing products to seller_id = 1 (Safdar Iqbal)
db.query(
  'UPDATE products SET seller_id = 1 WHERE seller_id IS NULL LIMIT 10',
  (err, result) => {
    if (err) {
      console.error('❌ Error updating products:', err.message);
    } else {
      console.log(`✅ Updated ${result.affectedRows} products with seller_id = 1`);
    }
    
    // Verify the update
    db.query(
      'SELECT id, name, seller_id FROM products WHERE seller_id = 1 LIMIT 5',
      (e2, r2) => {
        console.log('\n📦 Products now with seller_id = 1:');
        console.log(JSON.stringify(r2, null, 2));
        process.exit(0);
      }
    );
  }
);
