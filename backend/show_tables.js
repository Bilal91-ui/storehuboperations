const db = require('./db');
db.query('SHOW TABLES', (err, rows) => {
  if (err) return console.error(err);
  console.log(rows);
  process.exit(0);
});
