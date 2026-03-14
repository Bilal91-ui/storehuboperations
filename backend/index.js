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

// ---------------- OTP & SMS SERVICE ----------------
// Simple OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMS Service Integration
async function sendSMS(phoneNumber, message) {
  console.log(`📱 Attempting to send SMS to ${phoneNumber}: ${message}`);

  // Development mode: Show OTP in console for testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔥 DEVELOPMENT MODE: OTP would be sent to ${phoneNumber}`);
    console.log(`🔥 OTP CODE: ${message.match(/(\d{6})/)?.[1] || 'N/A'}`);
    console.log(`🔥 Use this OTP for testing: ${message.match(/(\d{6})/)?.[1] || 'N/A'}`);
    return true;
  }

  // Production SMS integration
  try {
    // Option 1: Twilio (works internationally)
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber.startsWith('+') ? phoneNumber : `+92${phoneNumber.slice(1)}`
      });
      console.log(`✅ SMS sent via Twilio to ${phoneNumber}`);
      return true;
    }

    // Option 2: Jazz SMS API (Pakistan)
    if (process.env.JAZZ_API_KEY && process.env.JAZZ_API_SECRET) {
      const axios = require('axios');
      const response = await axios.post('https://api.jazz.com/sms/send', {
        to: phoneNumber.startsWith('+') ? phoneNumber : `+92${phoneNumber.slice(1)}`,
        message: message
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.JAZZ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ SMS sent via Jazz API to ${phoneNumber}`);
      return true;
    }

    // Option 3: MSG91 (works in Pakistan)
    if (process.env.MSG91_AUTH_KEY) {
      const axios = require('axios');
      const response = await axios.post(`https://api.msg91.com/api/v2/sendsms`, {
        sender: process.env.MSG91_SENDER_ID || 'STOREHB',
        route: '4', // Transactional route
        country: '92',
        sms: [{
          message: message,
          to: [phoneNumber.startsWith('+') ? phoneNumber.slice(3) : phoneNumber.slice(1)]
        }]
      }, {
        headers: {
          'authkey': process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ SMS sent via MSG91 to ${phoneNumber}`);
      return true;
    }

    // Fallback: Log the message (for development)
    console.log(`⚠️  No SMS service configured. OTP would be: ${message.match(/(\d{6})/)?.[1] || 'N/A'}`);
    console.log(`⚠️  Add environment variables for real SMS service`);
    return true;

  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    throw new Error('Failed to send SMS');
  }
}

// ---------------- ORDERS ----------------

// Create Order
app.post("/api/orders", (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    payment_method,
    cart_items,
    subtotal,
    shipping_cost = 10.0,
    tax_amount
  } = req.body;

  if (!customer_name || !customer_email || !customer_phone || !shipping_address || !payment_method || !cart_items || cart_items.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const total_amount = subtotal + shipping_cost + tax_amount;
  const order_number = `ORD${Date.now()}`;

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction start error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Insert order
    const orderSql = `
      INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address,
                         payment_method, subtotal, shipping_cost, tax_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(orderSql, [order_number, customer_name, customer_email, customer_phone, shipping_address,
                        payment_method, subtotal, shipping_cost, tax_amount, total_amount], (err, result) => {
      if (err) {
        console.error("Order insert error:", err);
        return db.rollback(() => res.status(500).json({ message: "Database error" }));
      }

      const orderId = result.insertId;

      // Insert order items
      const itemPromises = cart_items.map(item => {
        return new Promise((resolve, reject) => {
          const itemSql = `
            INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          db.query(itemSql, [orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      Promise.all(itemPromises)
        .then(() => {
          // Clear cart after successful order
          db.query("DELETE FROM cart", (err) => {
            if (err) console.error("Cart clear error:", err);

            db.commit((err) => {
              if (err) {
                console.error("Transaction commit error:", err);
                return db.rollback(() => res.status(500).json({ message: "Database error" }));
              }

              res.json({
                message: "Order created successfully",
                order_id: orderId,
                order_number: order_number,
                total_amount: total_amount
              });
            });
          });
        })
        .catch((err) => {
          console.error("Order items insert error:", err);
          db.rollback(() => res.status(500).json({ message: "Database error" }));
        });
    });
  });
});

// Send OTP for payment verification
app.post("/api/orders/:orderId/send-otp", async (req, res) => {
  const { orderId } = req.params;
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number required" });
  }

  // Generate OTP
  const otp = generateOTP();

  // Store OTP with expiration (5 minutes)
  otpStore.set(`order_${orderId}`, {
    otp: otp,
    phone: phone_number,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  // Update order with OTP
  db.query("UPDATE orders SET otp_code = ?, otp_sent_at = NOW() WHERE id = ?", [otp, orderId], async (err) => {
    if (err) {
      console.error("OTP update error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Send SMS
    try {
      const message = `Your StoreHub order OTP is: ${otp}. Valid for 5 minutes.`;
      await sendSMS(phone_number, message);

      res.json({ message: "OTP sent successfully" });
    } catch (smsError) {
      console.error("SMS send error:", smsError);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
});

// Verify OTP and complete payment
app.post("/api/orders/:orderId/verify-otp", (req, res) => {
  const { orderId } = req.params;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP required" });
  }

  const otpData = otpStore.get(`order_${orderId}`);
  if (!otpData) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }

  if (Date.now() > otpData.expires) {
    otpStore.delete(`order_${orderId}`);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (otp !== otpData.otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Update order as paid and verified
  db.query(
    "UPDATE orders SET payment_status = 'paid', otp_verified = TRUE, order_status = 'confirmed' WHERE id = ?",
    [orderId],
    (err) => {
      if (err) {
        console.error("Order update error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      // Clear OTP
      otpStore.delete(`order_${orderId}`);

      res.json({ message: "Payment verified successfully" });
    }
  );
});

// Get order details
app.get("/api/orders/:orderId", (req, res) => {
  const { orderId } = req.params;

  const orderSql = "SELECT * FROM orders WHERE id = ? OR order_number = ?";
  db.query(orderSql, [orderId, orderId], (err, orderRows) => {
    if (err) {
      console.error("Order fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    // Get order items
    const itemsSql = "SELECT * FROM order_items WHERE order_id = ?";
    db.query(itemsSql, [order.id], (err, itemRows) => {
      if (err) {
        console.error("Order items fetch error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        order: order,
        items: itemRows
      });
    });
  });
});

// Get orders by phone number (for tracking)
app.get("/api/orders/track/:phone", (req, res) => {
  const { phone } = req.params;

  const sql = "SELECT id, order_number, order_status, total_amount, created_at FROM orders WHERE customer_phone = ? ORDER BY created_at DESC";
  db.query(sql, [phone], (err, rows) => {
    if (err) {
      console.error("Orders fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(rows);
  });
});

app.get("/", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));