const db = require('./db');

function ensureUserIdColumn() {
  const checkSql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart' AND COLUMN_NAME = 'user_id'`;
  db.query(checkSql, (err, rows) => {
    if (err) {
      console.error('Schema check error:', err);
      process.exit(1);
    }
    const cnt = rows[0] && (rows[0].cnt || rows[0]['COUNT(*)']);
    if (!cnt) {
      db.query("ALTER TABLE cart ADD COLUMN user_id INT NULL", (e) => {
        if (e) {
          console.error('Add column error:', e);
          process.exit(1);
        }
        console.log('Added user_id column to cart (nullable)');
        process.exit(0);
      });
    } else {
      db.query("ALTER TABLE cart MODIFY user_id INT NULL", (e) => {
        if (e) {
          console.error('Modify column error:', e);
          process.exit(1);
        }
        console.log('Ensured user_id column is nullable');
        process.exit(0);
      });
    }
  });
}

ensureUserIdColumn();
