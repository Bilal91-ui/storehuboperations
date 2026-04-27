// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const cors = require("cors");
require("dotenv").config();
const db = require("./db"); // your mysql connection module
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

console.log("Loaded NODE_ENV:", process.env.NODE_ENV);
console.log("All env vars starting with NODE:", Object.keys(process.env).filter(key => key.startsWith('NODE')));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// ================= EMAIL SERVICE =================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOrderStatusEmail(order, status) {
  if (!order || !order.customer_email) return;

  const statusMap = {
    pending: 'Pending',
    processing: 'Accepted and Processing',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  const friendlyStatus = statusMap[status] || status;
  const subject = `StoreHub Order ${order.order_number} ${friendlyStatus}`;
  const text = `Dear ${order.customer_name},\n\nYour order ${order.order_number} has been updated to "${friendlyStatus}".\n\nOrder Summary:\n- Total: Rs ${order.total_amount}\n- Status: ${friendlyStatus}\n\nIf you have any questions, please reply to this email or contact support.\n\nBest regards,\nStoreHub Team`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV] Email not configured. Would send to ${order.customer_email}: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: order.customer_email,
      subject,
      text
    });
    console.log(`[SUCCESS] Order status email sent to ${order.customer_email}`);
  } catch (mailErr) {
    console.error("[ERROR] Failed to send order status email:", mailErr.message);
  }
}

// ================= HELPER FUNCTIONS =================

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find riders within specified radius of a location
function findNearbyRiders(centerLocation, radiusKm, callback) {
  const { lat, lng } = centerLocation;

  // Get all active riders with locations
  const sql = `
    SELECT r.id, r.user_id, r.current_location, r.vehicle_type, u.full_name
    FROM riders r
    JOIN users u ON r.user_id = u.id
    WHERE r.is_active = TRUE AND r.current_location IS NOT NULL
  `;

  db.query(sql, (err, riders) => {
    if (err) {
      console.error('Error fetching riders:', err);
      return callback([]);
    }

    const nearbyRiders = [];

    riders.forEach(rider => {
      try {
        let riderLocation = rider.current_location;
        // Handle both JSON string and parsed object
        if (typeof riderLocation === 'string') {
          riderLocation = JSON.parse(riderLocation);
        }
        const distance = calculateDistance(lat, lng, riderLocation.lat, riderLocation.lng);

        if (distance <= radiusKm) {
          nearbyRiders.push({
            id: rider.id,
            user_id: rider.user_id,
            name: rider.full_name,
            vehicle_type: rider.vehicle_type,
            location: riderLocation,
            distance: distance
          });
        }
      } catch (parseErr) {
        console.error('Error parsing rider location for rider', rider.id, ':', parseErr);
      }
    });

    // Sort by distance (closest first)
    nearbyRiders.sort((a, b) => a.distance - b.distance);

    console.log(`Found ${nearbyRiders.length} riders within ${radiusKm}km`);
    callback(nearbyRiders);
  });
}

// Assign order to riders sequentially
function assignOrderToRiders(orderId, riders, callback) {
  if (riders.length === 0) {
    console.log('No riders available nearby');
    return callback(false);
  }

  console.log(`Found ${riders.length} riders within range. Notifying closest rider: ${riders[0].name} (${riders[0].distance.toFixed(1)}km)`);

  // For testing: just assign to the first rider immediately
  assignOrderToRider(orderId, riders[0], (success) => {
    if (success) {
      console.log(`Order ${orderId} assigned to rider ${riders[0].name}`);
      callback(true);
    } else {
      console.log('Failed to assign order to rider');
      callback(false);
    }
  });
}

// Actually assign order to a specific rider
function assignOrderToRider(orderId, rider, callback) {
  db.query(
    "UPDATE orders SET rider_id = ?, rider_assignment_status = 'assigned' WHERE id = ? AND rider_id IS NULL",
    [rider.id, orderId],
    (err, result) => {
      if (err) {
        console.error('Error assigning rider:', err);
        return callback(false);
      }

      if (result.affectedRows > 0) {
        console.log(`Order ${orderId} assigned to rider ${rider.id}`);
        
        // Fetch order details
        db.query(`
          SELECT o.id, o.order_number, o.customer_name, o.shipping_address, o.total_amount, 
                 GROUP_CONCAT(oi.product_name SEPARATOR ', ') as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.id = ?
          GROUP BY o.id
        `, [orderId], (orderErr, orderRows) => {
          if (orderErr) {
            console.error('Error fetching order details:', orderErr);
            return callback(false);
          }
          
          const order = orderRows[0];
          const payload = {
            orderId: order.id,
            order_number: order.order_number,
            riderId: rider.id,
            riderUserId: rider.user_id,
            location: rider.location,
            distance: rider.distance,
            message: `You have a new delivery assignment (${rider.distance.toFixed(1)} km away).`,
            order: {
              id: order.id,
              order_number: order.order_number,
              customer: order.customer_name,
              dropoffAddr: order.shipping_address,
              earnings: `$${(order.total_amount * 0.1).toFixed(2)}`,
              restaurant: "StoreHub Store",
              pickupAddr: "Central Store",
              distance: `${rider.distance.toFixed(1)} km`,
              items: order.items ? order.items.split(', ').map(name => ({ name, qty: 1 })) : []
            }
          };

          const riderSocket = riderConnections.get(rider.user_id);
          if (riderSocket) {
            console.log(`Emitting rider_order_assigned to rider user_id ${rider.user_id} via socket ${riderSocket.id}`);
            riderSocket.emit('rider_order_assigned', payload);
          } else {
            console.log(`No active socket found for rider user_id ${rider.user_id}. Broadcasting instead.`);
            io.emit('rider_order_assigned', payload);
          }

          callback(true);
        });
      } else {
        console.log(`Order ${orderId} already assigned or not found`);
        callback(false);
      }
    }
  );
}

// ================= SOCKET.IO HANDLERS =================
// Map to track seller user_id to socket connections
const sellerConnections = new Map(); // seller_user_id -> socket object
const riderConnections = new Map();  // rider_user_id -> socket object

io.on('connection', (socket) => {
  console.log('🔌 [Socket] User connected:', socket.id);

  // Seller login - register their socket connection
  socket.on('seller_login', (data) => {
    const { user_id, seller_id } = data;
    console.log(`📍 [Seller Login] Seller ${seller_id} (user_id: ${user_id}) logged in with socket: ${socket.id}`);
    if (user_id) {
      sellerConnections.set(user_id, socket);
      console.log(`📊 [Seller Connections] Total sellers online: ${sellerConnections.size}`);
    } else {
      console.warn('Seller login received without user_id:', data);
    }
  });

  // Rider login - register their socket connection
  socket.on('rider_login', (data) => {
    const { user_id, rider_id } = data;
    console.log(`📍 [Rider Login] Rider ${rider_id} (user_id: ${user_id}) logged in with socket: ${socket.id}`);
    if (user_id) {
      riderConnections.set(user_id, socket);
      console.log(`📊 [Rider Connections] Total riders online: ${riderConnections.size}`);
    } else {
      console.warn('Rider login received without user_id:', data);
    }
  });

  // Rider location update
  socket.on('rider_location', (data) => {
    console.log('Rider location received:', data);
    const userId = data.user_id || data.riderId;
    if (!userId) {
      console.warn('Rider location update missing user_id or riderId:', data);
      return;
    }

    if (data.location) {
      const updateSql = `UPDATE riders SET current_location = ?, updated_at = NOW() WHERE user_id = ?`;
      db.query(updateSql, [JSON.stringify(data.location), userId], (err) => {
        if (err) console.error('Error updating rider location:', err);
        else console.log('Rider location updated for user_id:', userId);
      });
    }
  });

  // Seller location update
  socket.on('seller_location', (data) => {
    console.log('Seller location received:', data);
    // Store in database
    if (data.user_id && data.location) {
      const updateSql = `UPDATE sellers SET current_location = ?, updated_at = NOW() WHERE user_id = ?`;
      db.query(updateSql, [JSON.stringify(data.location), data.user_id], (err) => {
        if (err) console.error('Error updating seller location:', err);
        else console.log('Seller location updated for user_id:', data.user_id);
      });
    }
  });

  // Rider order response
  socket.on('rider_order_response', (data) => {
    console.log('Rider order response:', data);
    const { orderId, riderId, accepted } = data;

    if (accepted) {
      assignOrderToRider(orderId, riderId, (success) => {
        if (success) {
          // Notify other riders that order is taken
          io.emit('order_taken', { orderId });
        }
      });
    } else {
      // Rider rejected, this will be handled in assignOrderToRiders
      console.log(`Rider ${riderId} rejected order ${orderId}`);
    }
  });

  // Broadcast order accepted for delivery to all riders
  socket.on('order_accepted_for_delivery', (data) => {
    console.log('Broadcasting order accepted for delivery:', data);
    io.emit('order_accepted_for_delivery', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ [Socket Disconnect] User disconnected:', socket.id);
    // Remove from seller and rider connections
    for (let [userId, userSocket] of sellerConnections.entries()) {
      if (userSocket.id === socket.id) {
        sellerConnections.delete(userId);
        console.log(`📍 [Seller Disconnected] Seller user_id ${userId} disconnected, remaining: ${sellerConnections.size}`);
      }
    }
    for (let [userId, userSocket] of riderConnections.entries()) {
      if (userSocket.id === socket.id) {
        riderConnections.delete(userId);
        console.log(`📍 [Rider Disconnected] Rider user_id ${userId} disconnected`);
      }
    }
  });
});

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


// ================= USER REGISTER (Partner Registration) =================
app.post("/api/auth/register", async (req, res) => {
  const {
    email, password, full_name, role, phone_number, city, cnic_number,
    // Rider specific
    vehicle_type, license_number,
    // Seller specific
    business_name, store_address, business_type, bank_name, account_title, iban
  } = req.body;

  if (!email || !password || !full_name || !role || !phone_number || !city || !cnic_number) {
    return res.status(400).json({ message: "All basic fields are required." });
  }

  try {
    // Check if email already exists in main users table
    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, rows) => {
      if (err) return res.status(500).json({ message: "DB Error", error: err.message });
      if (rows.length > 0) {
        return res.status(400).json({ message: "This email is already registered. Please log in." });
      }

      try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = await bcrypt.hash(password, 10);

        // Store all data in JSON format
        const userData = JSON.stringify({
          email, password_hash: hash, full_name, role, phone_number, city, cnic_number,
          vehicle_type, license_number,
          business_name, store_address, business_type, bank_name, account_title, iban
        });

        const tempQuery = `
          INSERT INTO temp_registrations (email, otp_code, user_data, expires_at) 
          VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
          ON DUPLICATE KEY UPDATE 
            otp_code = VALUES(otp_code), 
            user_data = VALUES(user_data), 
            expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        `;

        db.query(tempQuery,[email, otp, userData], (err) => {
          if (err) {
            console.error("Temp Insert Error:", err);
            return res.status(500).json({ message: "Registration failed.", error: err.message });
          }

          db.query("SELECT id FROM temp_registrations WHERE email = ?", [email], async (err, tempRows) => {
            if (err) return res.status(500).json({ message: "ID Fetch Error", error: err.message });
            
            const tempId = tempRows[0].id;

            // Send Email OTP 
            try {
              if (typeof transporter !== "undefined") {
                 await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: email,
                  subject: "StoreHub - Email Verification OTP",
                  text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
                });
              }
            } catch (mailErr) {
              console.error("Email send error:", mailErr.message);
            }

            console.log(`[DEV] OTP for ${email}: ${otp}`);

            res.json({
              message: "An OTP has been sent to your email address.",
              user_id: tempId,
              otp: process.env.NODE_ENV !== 'production' ? otp : undefined 
            });
          });
        });
      } catch (hashErr) {
         return res.status(500).json({ message: "An error occurred while securing the password." });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});


// ================= VERIFY EMAIL (Move to Main DB) =================
app.post("/api/auth/verify-email", async (req, res) => {
  const { user_id, otp } = req.body;

  if (!user_id || !otp) return res.status(400).json({ message: "OTP is required." });

  try {
    db.query("SELECT * FROM temp_registrations WHERE id = ?",[user_id], (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (rows.length === 0) return res.status(400).json({ message: "Session expired. Please sign up again." });

      const tempRecord = rows[0];

      if (new Date() > new Date(tempRecord.expires_at)) {
        db.query("DELETE FROM temp_registrations WHERE id = ?", [user_id]);
        return res.status(400).json({ message: "The OTP has expired." });
      }

      if (tempRecord.otp_code !== otp) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      const userData = typeof tempRecord.user_data === 'string' ? JSON.parse(tempRecord.user_data) : tempRecord.user_data;

      db.query("SELECT id FROM roles WHERE role_name = ?",[userData.role], (err, roleRows) => {
        if (err || roleRows.length === 0) return res.status(400).json({ message: "Invalid role" });
        const role_id = roleRows[0].id;

        // => 1. USERS TABLE
        const userQuery = "INSERT INTO users (email, password_hash, full_name, cnic_number, city, role_id) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(userQuery,[userData.email, userData.password_hash, userData.full_name, userData.cnic_number, userData.city, role_id], (err, userResult) => {
          if (err) return res.status(500).json({ message: "Error creating user account", error: err.message });

          const realUserId = userResult.insertId;

          db.query("INSERT INTO registration_events (user_id, event_type) VALUES (?, 'applied')", [realUserId]);
          db.query("INSERT INTO registration_events (user_id, event_type) VALUES (?, 'email_verified')",[realUserId]);

          // => 2. RIDERS TABLE
          if (userData.role === "rider") {
            const riderQuery = "INSERT INTO riders (user_id, vehicle_type, license_number, phone_number) VALUES (?, ?, ?, ?)";
            db.query(riderQuery,[realUserId, userData.vehicle_type, userData.license_number || null, userData.phone_number]);
          } 
          // => 3. SELLERS TABLE
          else if (userData.role === "seller") {
            const sellerQuery = "INSERT INTO sellers (user_id, business_name, store_address, store_phone, business_type, bank_name, account_title, iban) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            db.query(sellerQuery,[realUserId, userData.business_name, userData.store_address, userData.phone_number, userData.business_type, userData.bank_name, userData.account_title, userData.iban]);
          }

          db.query("INSERT INTO email_verification (user_id, otp_code, is_verified, verified_at) VALUES (?, ?, TRUE, NOW())",[realUserId, tempRecord.otp_code]);
          db.query("DELETE FROM temp_registrations WHERE id = ?",[user_id]);

          res.json({ message: "Verification successful! Please wait for admin approval." });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= LOGIN =================
// ================= LOGIN =================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // 1. HARDCODED ADMIN LOGIN
  if (email === "admin@storehub.com" && password === "admin123") {
    return res.json({
      message: "Admin login successful",
      user_id: 0, 
      role_id: 3, 
      role: "admin" // <-- Yahan role bhejna zaroori hai
    });
  }

  // 2. NORMAL USER/PARTNER LOGIN
  db.query(
    `SELECT u.*, r.role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE u.email = ?`,
    [email],
    async (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (rows.length === 0) return res.status(400).json({ message: "User not found" });

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) return res.status(400).json({ message: "Invalid password" });

      if (user.registration_status !== "approved")
        return res.status(403).json({ message: "Account is pending admin approval." });

      // If user is a seller, fetch their seller_id
      if (user.role_name === "seller") {
        db.query(
          "SELECT id as seller_id FROM sellers WHERE user_id = ?",
          [user.id],
          (sellerErr, sellerRows) => {
            const seller_id = sellerRows && sellerRows.length > 0 ? sellerRows[0].seller_id : null;
            res.json({
              message: "Login success",
              user_id: user.id,
              seller_id: seller_id,
              role_id: user.role_id,
              role: user.role_name,
              email: user.email,
              full_name: user.full_name
            });
          }
        );
      } else if (user.role_name === "rider") {
        // If user is a rider, fetch their rider_id
        db.query(
          "SELECT id as rider_id FROM riders WHERE user_id = ?",
          [user.id],
          (riderErr, riderRows) => {
            const rider_id = riderRows && riderRows.length > 0 ? riderRows[0].rider_id : null;
            res.json({
              message: "Login success",
              user_id: user.id,
              rider_id: rider_id,
              role_id: user.role_id,
              role: user.role_name,
              email: user.email,
              full_name: user.full_name
            });
          }
        );
      } else {
        res.json({
          message: "Login success",
          user_id: user.id,
          role_id: user.role_id,
          role: user.role_name,
          email: user.email,
          full_name: user.full_name
        });
      }
    }
  );
});

// ---------------- PRODUCTS ----------------
app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, price, stock, category, description } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !price || price <= 0 || !stock || stock < 0) {
    return res.status(400).json({ message: "Invalid product data: name, positive price, and non-negative stock required" });
  }

  const sql = `
    INSERT INTO products (name, price, stock, category, description, image, basePrice)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql,[name, price, stock, category || null, description || null, imagePath, price], (err, result) => {
    if (err) {
      console.error("Insert product error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Product added", id: result.insertId });
  });
});

app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, rows) => {
    if (err) {
      console.error("Fetch products error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
});

app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category, description, image } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : image || null;

  const sql = `
    UPDATE products 
    SET name = ?, price = ?, stock = ?, category = ?, description = ?, image = ?
    WHERE id = ?
  `;
  db.query(sql,[name, price, stock, category || null, description || null, imagePath, id], (err, result) => {
    if (err) {
      console.error("Update product error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated" });
  });
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id = ?",[id], (err, result) => {
    if (err) {
      console.error("Delete product error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  });
});

// ---------------- CATEGORIES ----------------
app.get("/api/categories", (req, res) => {
  db.query("SELECT id, name FROM categories ORDER BY name ASC", (err, rows) => {
    if (err) {
      console.error("Fetch categories error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Category name is required." });
  }

  db.query("INSERT INTO categories (name) VALUES (?)", [name.trim()], (err, result) => {
    if (err) {
      console.error("Create category error:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Category already exists." });
      }
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Category created", id: result.insertId });
  });
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM categories WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Delete category error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  });
});

// ---------------- VENDOR ORDERS ----------------
app.get("/api/vendor/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, orders) => {
    if (err) {
      console.error("Fetch vendor orders error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!orders.length) {
      return res.json([]);
    }

    const orderIds = orders.map(order => order.id);
    db.query("SELECT * FROM order_items WHERE order_id IN (?)", [orderIds], (itemErr, items) => {
      if (itemErr) {
        console.error("Fetch order items error:", itemErr);
        return res.status(500).json({ message: "Database error" });
      }

      const itemsByOrder = items.reduce((acc, item) => {
        acc[item.order_id] = acc[item.order_id] || [];
        acc[item.order_id].push({
          qty: item.quantity,
          name: item.product_name,
          price: item.product_price
        });
        return acc;
      }, {});

      const formattedOrders = orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer: order.customer_name,
        customer_email: order.customer_email,
        address: order.shipping_address,
        total: parseFloat(order.total_amount) || 0,
        status: String(order.order_status || 'pending').charAt(0).toUpperCase() + String(order.order_status || 'pending').slice(1),
        date: new Date(order.created_at).toLocaleDateString('en-US'),
        time: new Date(order.created_at).toLocaleTimeString('en-US'),
        items: (itemsByOrder[order.id] || []).map(item => ({
          qty: item.quantity,
          name: item.product_name,
          price: parseFloat(item.product_price) || 0
        }))
      }));

      res.json(formattedOrders);
    });
  });
});

app.post("/api/vendor/orders/:orderId/accept", (req, res) => {
  const { orderId } = req.params;
  const { sellerId } = req.body;

  if (!sellerId) {
    return res.status(400).json({ message: "sellerId is required" });
  }

  db.query("SELECT * FROM orders WHERE id = ?", [orderId], (selectErr, rows) => {
    if (selectErr) {
      console.error("Fetch order error:", selectErr);
      return res.status(500).json({ message: "Database error" });
    }
    if (!rows.length) {
      return res.status(404).json({ message: "Order not found." });
    }

    db.query(
      "UPDATE orders SET order_status = 'processing', seller_id = ? WHERE id = ?",
      [sellerId, orderId],
      (updateErr, result) => {
        if (updateErr) {
          console.error("Accept order update error:", updateErr);
          return res.status(500).json({ message: "Database error" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Order not found or already processed." });
        }

        // Order accepted successfully, riders will be notified via socket broadcast
        res.json({ message: "Order accepted successfully. Riders notified." });
      }
    );
  });
});

app.get("/api/admin/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, orders) => {
    if (err) {
      console.error("Fetch admin orders error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!orders.length) {
      return res.json([]);
    }

    const orderIds = orders.map(order => order.id);
    db.query("SELECT * FROM order_items WHERE order_id IN (?)", [orderIds], (itemErr, items) => {
      if (itemErr) {
        console.error("Fetch order items error:", itemErr);
        return res.status(500).json({ message: "Database error" });
      }

      const itemsByOrder = items.reduce((acc, item) => {
        acc[item.order_id] = acc[item.order_id] || [];
        acc[item.order_id].push({
          qty: item.quantity,
          name: item.product_name,
          price: item.product_price
        });
        return acc;
      }, {});

      const formattedOrders = orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer: order.customer_name,
        customer_email: order.customer_email,
        address: order.shipping_address,
        total: parseFloat(order.total_amount) || 0,
        status: String(order.order_status || 'pending').charAt(0).toUpperCase() + String(order.order_status || 'pending').slice(1),
        date: new Date(order.created_at).toLocaleDateString('en-US'),
        time: new Date(order.created_at).toLocaleTimeString('en-US'),
        items: (itemsByOrder[order.id] || []).map(item => ({
          qty: item.quantity,
          name: item.product_name,
          price: parseFloat(item.product_price) || 0
        }))
      }));

      res.json(formattedOrders);
    });
  });
});

app.put("/api/vendor/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "Status is required." });

  const normalizedStatus = String(status).trim().toLowerCase();
  const allowed = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!allowed.includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid order status." });
  }

  db.query("SELECT * FROM orders WHERE id = ?", [orderId], (selectErr, rows) => {
    if (selectErr) {
      console.error("Fetch order error:", selectErr);
      return res.status(500).json({ message: "Database error" });
    }
    if (!rows.length) return res.status(404).json({ message: "Order not found." });

    const order = rows[0];
    db.query("UPDATE orders SET order_status = ? WHERE id = ?", [normalizedStatus, orderId], async (updateErr, result) => {
      if (updateErr) {
        console.error("Update order status error:", updateErr);
        return res.status(500).json({ message: "Database error" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });

      await sendOrderStatusEmail(order, normalizedStatus);
      res.json({ message: `Order status updated to ${normalizedStatus}.` });
    });
  });
});


// Get nearby riders for seller
app.get("/api/seller/nearby-riders", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });

  // Get seller location
  db.query("SELECT current_location FROM sellers WHERE user_id = ?", [userId], (err, rows) => {
    if (err) {
      console.error("Fetch seller location error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (!rows.length || !rows[0].current_location) {
      return res.status(400).json({ message: "Seller location not available" });
    }

    let sellerLocation = rows[0].current_location;
    if (typeof sellerLocation === 'string') {
      sellerLocation = JSON.parse(sellerLocation);
    }

    findNearbyRiders(sellerLocation, 5, (riders) => {
      res.json(riders);
    });
  });
});

// ---------------- PRICING ----------------
app.put("/api/products/:id/pricing", (req, res) => {
  const { id } = req.params;
  const { basePrice, discountPercent, startDate, endDate } = req.body;

  if (basePrice == null || basePrice < 0) return res.status(400).json({ message: "Base price must be a positive number" });

  const discount = Math.max(0, Math.min(100, discountPercent || 0)); 
  const salePrice = Math.max(0, basePrice - (basePrice * (discount / 100))); 

  const sql = `
    UPDATE products
    SET basePrice = ?, discountPercent = ?, salePrice = ?, promoStart = ?, promoEnd = ?
    WHERE id = ?
  `;
  db.query(sql,[basePrice, discount, salePrice, discount > 0 ? startDate : null, discount > 0 ? endDate : null, id], (err, result) => {
    if (err) {
      console.error("Pricing update error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Pricing updated", salePrice });
  });
});


// ---------------- CART ----------------
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
      db.query("UPDATE cart SET quantity = ? WHERE id = ?",[newQty, existing.id], (err2) => {
        if (err2) {
          console.error("Cart update error:", err2);
          return res.status(500).json({ message: "Database error" });
        }
        return res.json({ message: "Cart updated" });
      });
    } else {
      db.query("INSERT INTO cart (product_id, quantity) VALUES (?, ?)",[product_id, quantity || 1], (err3) => {
        if (err3) {
          console.error("Cart insert error:", err3);
          return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Added to cart" });
      });
    }
  });
});

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

  db.query("UPDATE cart SET quantity = ? WHERE id = ?",[quantity, id], (err) => {
    if (err) {
      console.error("Cart update error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Cart updated" });
  });
});

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


// ---------------- OTP & SMS SERVICE (For Orders) ----------------
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(phoneNumber, message) {
  console.log(`📱 Attempting to send SMS to ${phoneNumber}: ${message}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔥 DEVELOPMENT MODE: OTP would be sent to ${phoneNumber}`);
    return true;
  }

  try {
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber.startsWith('+') ? phoneNumber : `+92${phoneNumber.slice(1)}`
      });
      return true;
    }
    console.log(`⚠️  No SMS service configured. OTP would be: ${message.match(/(\d{6})/)?.[1] || 'N/A'}`);
    return true;
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    throw new Error('Failed to send SMS');
  }
}


// ---------------- ORDERS ----------------
app.post("/api/orders", (req, res) => {
  const {
    customer_name, customer_email, customer_phone, shipping_address,
    payment_method, cart_items, subtotal, shipping_cost = 10.0, tax_amount
  } = req.body;

  if (!customer_name || !customer_email || !customer_phone || !shipping_address || !payment_method || !cart_items || cart_items.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const total_amount = subtotal + shipping_cost + tax_amount;
  const order_number = `ORD${Date.now()}`;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Database error" });

    const orderSql = `
      INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address,
                         payment_method, subtotal, shipping_cost, tax_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(orderSql,[order_number, customer_name, customer_email, customer_phone, shipping_address,
                        payment_method, subtotal, shipping_cost, tax_amount, total_amount], (err, result) => {
      if (err) return db.rollback(() => res.status(500).json({ message: "Database error", details: err.message }));
      
      const orderId = result.insertId;

      const itemPromises = cart_items.map(item => {
        return new Promise((resolve, reject) => {
          const itemSql = `
            INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          db.query(itemSql,[orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      Promise.all(itemPromises)
        .then(() => {
          const finalizeOrder = () => {
            db.commit((err) => {
              if (err) return db.rollback(() => res.status(500).json({ message: "Database error" }));
              //new code
              const newOrderTask = {
                id: orderId,
                order_number: order_number,
                earnings: `$${(total_amount * 0.1).toFixed(2)}`, // Example: Rider gets 10%
                customer: customer_name,
                dropoffAddr: shipping_address,
                restaurant: "StoreHub Shop", // You can customize this
                pickupAddr: "Main Warehouse",
                items: cart_items,
                status: 'confirmed'
              };
              io.emit("new_order_available", newOrderTask); 
              // ------------------------------------
              
              const productIds = cart_items.map(item => item.product_id || item.id);
              console.log(`\n🛒 [Order Created] Order #${order_number} (ID: ${orderId})`);
              console.log(`   Product IDs: [${productIds.join(', ')}]`);
              console.log(`   Customer: ${customer_name}`);
              
              const sellerQuery = `
                SELECT DISTINCT p.seller_id, s.user_id, s.business_name, u.email, u.full_name
                FROM products p
                LEFT JOIN sellers s ON p.seller_id = s.id
                LEFT JOIN users u ON s.user_id = u.id
                WHERE p.id IN (?)
              `;
              
              db.query(sellerQuery, [productIds], (err, sellerRows) => {
                if (err) {
                  console.error("❌ Error fetching sellers:", err);
                } else {
                  console.log(`   Found sellers: ${sellerRows.length}`);
                  
                  // Send notifications to all sellers whose products are in this order
                  const notificationData = {
                    order_id: orderId,
                    order_number: order_number,
                    customer_name: customer_name,
                    customer_phone: customer_phone,
                    customer_email: customer_email,
                    total_amount: total_amount,
                    created_at: new Date().toISOString(),
                    items: cart_items
                  };

                  sellerRows.forEach(seller => {
                    if (!seller.seller_id) {
                      console.log(`   ⚠️  Product has no seller_id, skipping`);
                      return;
                    }

                    if (!seller.user_id) {
                      console.log(`   ⚠️  Seller record missing user_id for seller ${seller.business_name}`);
                    }

                    // Also send email notification to seller if configured
                    if (seller.email && transporter) {
                      const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: seller.email,
                        subject: `New Order #${order_number} - ${customer_name}`,
                        text: `
Dear ${seller.full_name},

You have received a new order!

Order Details:
- Order Number: ${order_number}
- Order ID: ${orderId}
- Customer: ${customer_name}
- Phone: ${customer_phone}
- Total Amount: Rs ${total_amount}
- Payment Method: ${payment_method}
- Delivery Address: ${shipping_address}

Please log in to your StoreHub dashboard to view and accept this order.

Best regards,
StoreHub Team
                        `
                      };
                      
                      transporter.sendMail(mailOptions, (mailErr) => {
                        if (mailErr) {
                          console.error(`[ERROR] Failed to send email to seller ${seller.email}:`, mailErr.message);
                        } else {
                          console.log(`[SUCCESS] Email notification sent to ${seller.email}`);
                        }
                      });
                    }
                  });

                  // Broadcast notification to all online sellers as a fallback so any connected seller sees the order alert
                  if (sellerConnections.size > 0) {
                    sellerConnections.forEach((sellerSocket, userId) => {
                      sellerSocket.emit('new_order_notification', notificationData);
                    });
                    console.log(`   🔔 Broadcasted new_order_notification to ${sellerConnections.size} connected sellers`);
                  } else {
                    console.log('   ℹ️  No seller sockets currently connected for broadcast');
                  }
                }
              });
              res.json({
                message: "Order created successfully",
                order_id: orderId,
                order_number: order_number,
                total_amount: total_amount
              });
            });
          };

          if (payment_method === "cod") {
            db.query("DELETE FROM cart", (err) => {
              if (err) console.error("Cart clear error:", err);
              finalizeOrder();
            });
          } else {
            finalizeOrder();
          }
        })
        .catch((err) => {
          console.error("Order items insert error:", err);
          db.rollback(() => res.status(500).json({ message: "Database error", details: err.message }));
        });
    });
  });
});

app.post("/api/orders/:orderId/send-otp", async (req, res) => {
  const { orderId } = req.params;
  const { phone_number } = req.body;

  if (!phone_number) return res.status(400).json({ message: "Phone number required" });

  const otp = generateOTP();
  otpStore.set(`order_${orderId}`, {
    otp: otp,
    phone: phone_number,
    expires: Date.now() + 5 * 60 * 1000 
  });

  db.query("UPDATE orders SET otp_code = ?, otp_sent_at = NOW() WHERE id = ?", [otp, orderId], async (err) => {
    if (err) return res.status(500).json({ message: "Database error" });

    try {
      const message = `Your StoreHub order OTP is: ${otp}. Valid for 5 minutes.`;
      await sendSMS(phone_number, message);

      const payload = { message: "OTP sent successfully" };
      if (process.env.NODE_ENV !== 'production') payload.otp = otp;
      res.json(payload);
    } catch (smsError) {
      console.error("SMS send error:", smsError);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
});

app.post("/api/orders/:orderId/verify-otp", (req, res) => {
  const { orderId } = req.params;
  const { otp } = req.body;

  if (!otp) return res.status(400).json({ message: "OTP required" });

  const otpData = otpStore.get(`order_${orderId}`);
  if (!otpData) return res.status(400).json({ message: "OTP not found or expired" });

  if (Date.now() > otpData.expires) {
    otpStore.delete(`order_${orderId}`);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (otp.toString().trim() !== otpData.otp.toString().trim()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  db.query(
    "UPDATE orders SET payment_status = 'paid', otp_verified = TRUE, order_status = 'confirmed' WHERE id = ?",
    [orderId],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });

      db.query("DELETE FROM cart", (cartErr) => {
        if (cartErr) console.error("Cart clear error:", cartErr);
        otpStore.delete(`order_${orderId}`);
        res.json({ message: "Payment verified successfully" });
      });
    }
  );
});

app.get("/api/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const orderSql = "SELECT * FROM orders WHERE id = ? OR order_number = ?";
  
  db.query(orderSql, [orderId, orderId], (err, orderRows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (orderRows.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = orderRows[0];
    const itemsSql = "SELECT * FROM order_items WHERE order_id = ?";
    db.query(itemsSql, [order.id], (err, itemRows) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ order: order, items: itemRows });
    });
  });
});

app.get("/api/orders/track/:phone", (req, res) => {
  const { phone } = req.params;
  const sql = "SELECT id, order_number, order_status, total_amount, created_at FROM orders WHERE customer_phone = ? ORDER BY created_at DESC";
  db.query(sql, [phone], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(rows);
  });
});

// ================= RIDER MODULE APIS =================

// 1. Get all available tasks (Confirmed orders with no rider)
app.get("/api/rider/available-tasks", (req, res) => {
  const query = `
    SELECT id, order_number, total_amount, customer_name, shipping_address, created_at 
    FROM orders 
    WHERE order_status IN ('processing', 'accepted') AND rider_id IS NULL
    ORDER BY created_at DESC
  `;
  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err.message });
    
    // Format data to match your RiderDashboard.jsx needs
    const tasks = rows.map(order => ({
      id: order.id,
      order_number: order.order_number,
      earnings: `$${(order.total_amount * 0.1).toFixed(2)}`, 
      customer: order.customer_name,
      dropoffAddr: order.shipping_address,
      restaurant: "StoreHub Store",
      pickupAddr: "Central Store",
      distance: "2.5 km", // Static for now
      items: [] 
    }));
    res.json(tasks);
  });
});

app.get("/api/rider/current-task/:riderId", (req, res) => {
  const { riderId } = req.params;
  const query = `
    SELECT id, order_number, total_amount, customer_name, shipping_address, created_at, order_status
    FROM orders
    WHERE rider_id = ? AND order_status IN ('accepted','processing','shipped')
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(query, [riderId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err.message });
    if (rows.length === 0) return res.json({});
    const order = rows[0];
    res.json({
      id: order.id,
      order_number: order.order_number,
      earnings: `$${(order.total_amount * 0.1).toFixed(2)}`,
      customer: order.customer_name,
      dropoffAddr: order.shipping_address,
      restaurant: "StoreHub Store",
      pickupAddr: "Central Store",
      distance: "2.5 km",
      items: [],
      order_status: order.order_status,
      created_at: order.created_at
    });
  });
});

// 2. Accept a task
app.post("/api/rider/accept-task", (req, res) => {
  const { order_id, rider_id } = req.body;

  // First check if already taken
  db.query("SELECT rider_id FROM orders WHERE id = ?", [order_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (rows.length > 0 && rows[0].rider_id !== null) {
      return res.status(400).json({ message: "Order already taken by another rider." });
    }

    const query = "UPDATE orders SET rider_id = ?, order_status = 'accepted' WHERE id = ?";
    db.query(query, [rider_id, order_id], (err) => {
      if (err) return res.status(500).json({ message: "Failed to accept task" });

      // Notify other riders to remove this task from their list
      io.emit("task_taken", order_id);
      
      res.json({ message: "Task accepted successfully!" });
    });
  });
});

app.get("/", (req, res) => res.json({ status: "ok" }));
// ================= ADMIN APIS (Approve/Reject Partners) =================

// Get all pending applications
app.get("/api/admin/applications", (req, res) => {
  const query = `
    SELECT u.id, u.email, u.full_name, u.cnic_number, u.city, u.registration_status, u.created_at, r.role_name,
           rd.vehicle_type, rd.license_number, rd.phone_number as rider_phone,
           s.business_name, s.business_type, s.store_address, s.store_phone as seller_phone
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN riders rd ON u.id = rd.user_id
    LEFT JOIN sellers s ON u.id = s.user_id
    WHERE u.registration_status = 'pending'
    ORDER BY u.created_at DESC
  `;
  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err.message });
    res.json(rows);
  });
});

// 2. Update user status (Approve, Reject, Ban, Reactivate)
app.put("/api/admin/users/:id/status", (req, res) => {
  const userId = req.params.id;
  const { status, notify } = req.body; // 'notify' check frontend se aayega

  // Pehle user ki email aur naam database se nikalenge
  db.query("SELECT email, full_name FROM users WHERE id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err.message });
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    // Status ko update karein
    db.query(
      "UPDATE users SET registration_status = ? WHERE id = ?",
      [status, userId],
      async (err) => {
        if (err) return res.status(500).json({ message: "DB Error", error: err.message });
        
        // Event log karein
        db.query("INSERT INTO registration_events (user_id, event_type) VALUES (?, ?)", [userId, status]);
        
        // AGAR NOTIFY CHECKBOX TICK HAI, TOU EMAIL SEND KAREIN
        if (notify && typeof transporter !== "undefined") {
          let subject = "";
          let text = "";

          if (status === 'approved') {
            subject = "StoreHub - Account Approved! 🎉";
            text = `Dear ${user.full_name},\n\nCongratulations! Your StoreHub partner account has been approved. You can now log in to your dashboard and start working.\n\nBest Regards,\nStoreHub Team`;
          } else if (status === 'rejected') {
            subject = "StoreHub - Application Update";
            text = `Dear ${user.full_name},\n\nWe regret to inform you that your StoreHub partner application has been rejected after review. If you have any questions, please contact our support team.\n\nBest Regards,\nStoreHub Team`;
          } else if (status === 'blocked') {
            subject = "StoreHub - Account Suspended 🚨";
            text = `Dear ${user.full_name},\n\nYour StoreHub account has been suspended due to policy violations. Please contact support for more information.\n\nBest Regards,\nStoreHub Team`;
          }

          if (subject && text) {
            try {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: subject,
                text: text
              });
              console.log(`[SUCCESS] Email sent to ${user.email} for status: ${status}`);
            } catch (mailErr) {
              console.error("[ERROR] Failed to send status email:", mailErr.message);
            }
          }
        }

        res.json({ message: `Account has been ${status}.` });
      }
    );
  });
});

// ================= ADMIN: USER MANAGEMENT =================

// 1. Get all users (Riders, Sellers, Admins) with their details
app.get("/api/admin/users", (req, res) => {
  const query = `
    SELECT u.id, u.email, u.full_name as name, u.registration_status as status, 
           DATE_FORMAT(u.created_at, '%Y-%m-%d') as joined, 
           u.cnic_number, u.city, r.role_name as role,
           rd.vehicle_type, rd.license_number, rd.phone_number as rider_phone,
           s.business_name, s.business_type, s.store_address, s.store_phone as seller_phone
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN riders rd ON u.id = rd.user_id
    LEFT JOIN sellers s ON u.id = s.user_id
    ORDER BY u.created_at DESC
  `;
  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err.message });
    res.json(rows);
  });
});

// 2. Update user status (Approve, Reject, Ban, Reactivate)
app.put("/api/admin/users/:id/status", (req, res) => {
  const userId = req.params.id;
  const { status } = req.body; // 'approved', 'rejected', 'blocked', 'pending'

  db.query(
    "UPDATE users SET registration_status = ? WHERE id = ?",
    [status, userId],
    (err) => {
      if (err) return res.status(500).json({ message: "DB Error", error: err.message });
      
      // Log the event in registration_events table
      db.query("INSERT INTO registration_events (user_id, event_type) VALUES (?, ?)",[userId, status]);
      
      res.json({ message: `Account has been ${status}.` });
    }
  );
});
const si = require('systeminformation');

app.get("/api/system-stats", async (req, res) => {
  try {
    const [cpu, mem, disk, networkStats] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats()
    ]);

    // Disk — pehli drive ka data
    const mainDisk = disk[0];
    const diskUsed = mainDisk ? Math.round((mainDisk.used / mainDisk.size) * 100) : 0;

    // Network latency approximate (rx_sec se)
    const net = networkStats[0];
    const latency = net ? Math.round(net.ms_recv || Math.random() * 30 + 5) : 10;

    // MySQL check
    db.query("SELECT 1", (err) => {
      res.json({
        server: 'Online',
        uptime: (require('os').uptime() / 3600).toFixed(2) + ' hrs',
        cpu: Math.round(cpu.currentLoad),
        memory: Math.round((mem.used / mem.total) * 100),
        disk: diskUsed,
        latency: latency,
        db: err ? 'Disconnected' : 'Connected'
      });
    });

  } catch (err) {
    console.error("System stats error:", err);
    res.status(500).json({ message: "Could not fetch system stats" });
  }
});

// 2. Accept a task
app.post("/api/rider/accept-task", (req, res) => {
  const { order_id, rider_id } = req.body;

  if (!order_id || !rider_id) {
    return res.status(400).json({ message: "order_id and rider_id are required" });
  }

  // Check if order is still available
  db.query("SELECT * FROM orders WHERE id = ? AND rider_id IS NULL AND order_status = 'processing'", [order_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not available or already taken" });
    }

    // Assign to rider
    db.query("UPDATE orders SET rider_id = ?, order_status = 'accepted' WHERE id = ?", [rider_id, order_id], (updateErr, result) => {
      if (updateErr) return res.status(500).json({ message: "Failed to accept task" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Notify the rider that the order is assigned
      const riderSocket = riderConnections.get(rider_id);
      if (riderSocket) {
        riderSocket.emit('rider_order_assigned', { order: rows[0] });
      }

      // Notify other riders that the order is taken
      io.emit('order_taken', { orderId: order_id });

      res.json({ message: "Task accepted successfully!" });
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));