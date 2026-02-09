const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const multer = require("multer");
const path = require("path");

const app = express(); // ✅ FIRST create app

app.use(cors());
app.use(express.json());

// ✅ Static folder for images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ================= IMAGE UPLOAD CONFIG =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


// ================= PRODUCT ROUTES =================

// --- Add Product ---
app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, price, stock, category, description } = req.body;

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO products (name, price, stock, category, description, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, price, stock, category || null, description || null, imagePath],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ message: "Product added", id: result.insertId });
    }
  );
});


// --- Get All Products ---
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, result) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(result);
  });
});


// --- Update Product (NOW SUPPORTS IMAGE UPDATE) ---
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category, description } = req.body;

  const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;

  const sql = `
    UPDATE products 
    SET name = ?, price = ?, stock = ?, category = ?, description = ?, image = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, price, stock, category || null, description || null, imagePath || null, id],
    (err, result) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Product not found" });

      res.json({ message: "Product updated" });
    }
  );
});


// --- Delete Product ---
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Delete error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted" });
  });
});


// ================= PRICING =================

app.put("/api/products/:id/pricing", (req, res) => {
  const { id } = req.params;
  const { basePrice, discountPercent, startDate, endDate } = req.body;

  if (basePrice == null)
    return res.status(400).json({ message: "Base price required" });

  const discount = discountPercent || 0;
  const salePrice = basePrice - (basePrice * (discount / 100));

  const sql = `
    UPDATE products
    SET basePrice = ?, discountPercent = ?, salePrice = ?, 
        promoStart = ?, promoEnd = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      basePrice,
      discount,
      salePrice,
      discount > 0 ? startDate : null,
      discount > 0 ? endDate : null,
      id
    ],
    (err, result) => {
      if (err) {
        console.error("Pricing error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Product not found" });

      res.json({
        message: "Pricing updated successfully",
        salePrice
      });
    }
  );
});


// ================= ORDERS =================

// --- Get All Orders ---
app.get("/api/vendor/orders", (req, res) => {
  const sql = `SELECT * FROM orders ORDER BY id DESC`;

  db.query(sql, (err, orders) => {
    if (err) {
      console.error("Fetch orders error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.id);

    db.query(
      `SELECT * FROM order_items WHERE order_id IN (?)`,
      [orderIds],
      (err, items) => {
        if (err) {
          console.error("Fetch items error:", err);
          return res.status(500).json({ message: "Database error" });
        }

        const ordersWithItems = orders.map(order => ({
          ...order,
          items: items.filter(i => i.order_id === order.id)
        }));

        res.json(ordersWithItems);
      }
    );
  });
});


// --- Update Order Status ---
app.put("/api/vendor/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.error("Status update error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Order not found" });

      res.json({ message: "Order status updated" });
    }
  );
});


// ================= SERVER =================

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
