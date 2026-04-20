const db = require('./db');

function addLocationAndAssignmentColumns() {
  console.log('Starting database schema updates...');

  // Add current_location to sellers table
  const checkSellerLocation = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sellers' AND COLUMN_NAME = 'current_location'`;
  db.query(checkSellerLocation, (err, rows) => {
    if (err) {
      console.error('Schema check error for sellers.current_location:', err);
      return;
    }
    const cnt = rows[0] && (rows[0].cnt || rows[0]['COUNT(*)']);
    if (!cnt) {
      db.query("ALTER TABLE sellers ADD COLUMN current_location JSON NULL", (e) => {
        if (e) {
          console.error('Add current_location to sellers error:', e);
          return;
        }
        console.log('Added current_location column to sellers');
        checkOrders();
      });
    } else {
      console.log('current_location column already exists in sellers');
      checkOrders();
    }
  });

  function checkOrders() {
    // Add seller_id to orders table
    const checkSellerId = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'seller_id'`;
    db.query(checkSellerId, (err, rows) => {
      if (err) {
        console.error('Schema check error for orders.seller_id:', err);
        return;
      }
      const cnt = rows[0] && (rows[0].cnt || rows[0]['COUNT(*)']);
      if (!cnt) {
        db.query("ALTER TABLE orders ADD COLUMN seller_id INT NULL, ADD FOREIGN KEY (seller_id) REFERENCES sellers(id)", (e) => {
          if (e) {
            console.error('Add seller_id to orders error:', e);
            return;
          }
          console.log('Added seller_id column to orders');
          checkRiderId();
        });
      } else {
        console.log('seller_id column already exists in orders');
        checkRiderId();
      }
    });
  }

  function checkRiderId() {
    // Add rider_id to orders table
    const checkRiderId = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'rider_id'`;
    db.query(checkRiderId, (err, rows) => {
      if (err) {
        console.error('Schema check error for orders.rider_id:', err);
        return;
      }
      const cnt = rows[0] && (rows[0].cnt || rows[0]['COUNT(*)']);
      if (!cnt) {
        db.query("ALTER TABLE orders ADD COLUMN rider_id INT NULL, ADD FOREIGN KEY (rider_id) REFERENCES riders(id)", (e) => {
          if (e) {
            console.error('Add rider_id to orders error:', e);
            return;
          }
          console.log('Added rider_id column to orders');
          checkRiderStatus();
        });
      } else {
        console.log('rider_id column already exists in orders');
        checkRiderStatus();
      }
    });
  }

  function checkRiderStatus() {
    // Add rider assignment status
    const checkRiderStatus = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'rider_assignment_status'`;
    db.query(checkRiderStatus, (err, rows) => {
      if (err) {
        console.error('Schema check error for orders.rider_assignment_status:', err);
        return;
      }
      const cnt = rows[0] && (rows[0].cnt || rows[0]['COUNT(*)']);
      if (!cnt) {
        db.query("ALTER TABLE orders ADD COLUMN rider_assignment_status ENUM('pending', 'assigned', 'accepted', 'picked_up', 'delivered', 'cancelled') DEFAULT 'pending'", (e) => {
          if (e) {
            console.error('Add rider_assignment_status to orders error:', e);
            return;
          }
          console.log('Added rider_assignment_status column to orders');
          console.log('All schema updates completed successfully!');
          process.exit(0);
        });
      } else {
        console.log('rider_assignment_status column already exists in orders');
        console.log('All schema updates completed successfully!');
        process.exit(0);
      }
    });
  }
}

addLocationAndAssignmentColumns();