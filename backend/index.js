// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db"); // your mysql connection module
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ---------------- PRODUCTS ----------------

// Add Product (multipart: image optional)
app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, price, stock, category, description } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO products (name, price, stock, category, description, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [name, price, stock, category || null, description || null, imagePath], (err, result) => {
    if (err) {
      console.error("Insert product error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Product added", id: result.insertId });
  });
});

// Get all products
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, rows) => {
    if (err) {
      console.error("Fetch products error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
});

// Update product (supports new image)
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category, description, image } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : image || null;

  const sql = `
    UPDATE products 
    SET name = ?, price = ?, stock = ?, category = ?, description = ?, image = ?
    WHERE id = ?
  `;
  db.query(sql, [name, price, stock, category || null, description || null, imagePath, id], (err, result) => {
    if (err) {
      console.error("Update product error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated" });
  });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Delete product error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  });
});

// ---------------- PRICING ----------------
app.put("/api/products/:id/pricing", (req, res) => {
  const { id } = req.params;
  const { basePrice, discountPercent, startDate, endDate } = req.body;

  if (basePrice == null) return res.status(400).json({ message: "Base price required" });

  const discount = discountPercent || 0;
  const salePrice = basePrice - (basePrice * (discount / 100));
  const sql = `
    UPDATE products
    SET basePrice = ?, discountPercent = ?, salePrice = ?, promoStart = ?, promoEnd = ?
    WHERE id = ?
  `;
  db.query(sql, [basePrice, discount, salePrice, discount > 0 ? startDate : null, discount > 0 ? endDate : null, id], (err, result) => {
    if (err) {
      console.error("Pricing update error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Pricing updated", salePrice });
  });
});

// ---------------- CART ----------------
// NOTE: run this SQL once if not present:
// CREATE TABLE cart ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, quantity INT DEFAULT 1, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );


// Get Cart items (returns cart.id, quantity and full product data)
app.get("/api/cart", (req, res) => {
  const sql = `
    SELECT cart.id AS cart_id, cart.quantity, products.*
    FROM cart
    JOIN products ON cart.product_id = products.id
    ORDER BY cart.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Cart fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // transform rows: supply cart.id as id (so frontend can use item.id)
    const out = rows.map(r => ({
      id: r.cart_id,
      quantity: r.quantity,
      product_id: r.id,
      name: r.name,
      price: r.price,
      salePrice: r.salePrice,
      basePrice: r.basePrice,
      image: r.image
    }));

    res.json(out);
  });
});

// Add to cart (increase if exists)
app.post("/api/cart", (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id) return res.status(400).json({ message: "Product ID required" });

  db.query("SELECT id, quantity FROM cart WHERE product_id = ?", [product_id], (err, rows) => {
    if (err) {
      console.error("Cart select error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length > 0) {
      const existing = rows[0];
      const newQty = (existing.quantity || 0) + (quantity || 1);
      db.query("UPDATE cart SET quantity = ? WHERE id = ?", [newQty, existing.id], (err2) => {
        if (err2) {
          console.error("Cart update error:", err2);
          return res.status(500).json({ message: "Database error" });
        }
        return res.json({ message: "Cart updated" });
      });
    } else {
      db.query("INSERT INTO cart (product_id, quantity) VALUES (?, ?)", [product_id, quantity || 1], (err3) => {
        if (err3) {
          console.error("Cart insert error:", err3);
          return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Added to cart" });
      });
    }
  });
});

// Update cart item quantity (cart id)
app.put("/api/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (quantity == null) return res.status(400).json({ message: "Quantity required" });

  if (quantity <= 0) {
    db.query("DELETE FROM cart WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Cart delete error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      return res.json({ message: "Removed from cart" });
    });
    return;
  }

  db.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, id], (err) => {
    if (err) {
      console.error("Cart update error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Cart updated" });
  });
});

// Delete cart item
app.delete("/api/cart/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM cart WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Cart delete error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Removed from cart" });
  });
});

// ---------------- ORDERS (unchanged) ----------------
// (You can keep your existing orders code here — omitted for brevity if unchanged)

app.get("/", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));