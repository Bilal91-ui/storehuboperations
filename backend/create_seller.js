const db = require('./db');

// Create seller for user 4
db.query(
  'INSERT INTO sellers (user_id, business_name, store_address, store_phone) VALUES (?, ?, ?, ?)',
  [4, 'Ali Store', 'Test Address', '03001234567'],
  (err) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('✅ Seller created for user 4');
    }
    
    // Check the seller record
    db.query('SELECT id, user_id FROM sellers WHERE user_id = 4', (e2, r) => {
      console.log('Seller record:', JSON.stringify(r, null, 2));
      process.exit(0);
    });
  }
);
