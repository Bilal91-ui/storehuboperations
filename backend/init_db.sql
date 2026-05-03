CREATE DATABASE IF NOT EXISTS storehub;
USE storehub;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  stock INT,
  category VARCHAR(100),
  description TEXT,
  image VARCHAR(255),
  basePrice DECIMAL(10,2),
  discountPercent INT DEFAULT 0,
  salePrice DECIMAL(10,2) DEFAULT 0,
  promoStart DATETIME NULL,
  promoEnd DATETIME NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method ENUM('cod', 'easypaisa', 'jazzcash', 'card') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 10.00,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  otp_code VARCHAR(6),
  otp_verified BOOLEAN DEFAULT FALSE,
  otp_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- 1. ROLES TABLE (کردار کی قسمیں)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO roles (role_name, description) VALUES
('rider', 'Delivery person'),
('seller', 'Store owner'),
('admin', 'System administrator');

-- ============================================
-- 2. USERS TABLE (تمام صارفین)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    registration_status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
    role_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    approved_by INT,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT,
    rejected_by INT,
    rejected_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (registration_status),
    INDEX idx_role (role_id)
);

-- ============================================
-- 3. RIDERS TABLE (رائیڈرز کی تفصیلات)
-- ============================================
CREATE TABLE IF NOT EXISTS riders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE,
    documents_verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_date TIMESTAMP NULL,
    phone_number VARCHAR(20),
    current_location JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
);

-- ============================================
-- 4. SELLERS TABLE (بیچنے والوں کی تفصیلات)
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(100) NOT NULL,
    store_address VARCHAR(255) NOT NULL,
    store_phone VARCHAR(20),
    documents_verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_date TIMESTAMP NULL,
    store_image_url VARCHAR(255),
    store_status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (store_status)
);

-- ============================================
-- 5. ADMINS TABLE (انتظامیہ)
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    admin_level ENUM('super_admin', 'moderator') DEFAULT 'moderator',
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
);

-- ============================================
-- 6. REGISTRATION_EVENTS TABLE (ریکارڈ رکھیں)
-- ============================================
CREATE TABLE IF NOT EXISTS registration_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    event_type ENUM('applied', 'approved', 'rejected', 'email_verified', 'document_verified') NOT NULL,
    actor_id INT,
    notes TEXT,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (event_timestamp)
);

-- ============================================
-- 7. EMAIL_VERIFICATION TABLE (ای میل کی تصدیق)
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================================
-- 8. TEMP REGISTRATIONS TABLE (OTP signup tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS temp_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    user_data JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);