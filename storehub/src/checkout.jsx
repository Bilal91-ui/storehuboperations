"use client"

import { useState } from "react"
import "./checkout.css"
import Payment from "./payment"

export default function Checkout({ cartItems, onBack, onTrackOrder }) {
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    village: "",
    street: "",
    houseNumber: "",
    city: "Mandi Bahauddin",
    state: "Punjab",
    zipCode: "50400",
    country: "Pakistan",
  })

  const [errors, setErrors] = useState({})
  const [showPayment, setShowPayment] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setShippingInfo((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!shippingInfo.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!shippingInfo.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) newErrors.email = "Email is invalid"
    if (!shippingInfo.phone.trim()) newErrors.phone = "Phone number is required"
    if (!shippingInfo.village.trim()) newErrors.village = "Village/Town is required"
    if (!shippingInfo.street.trim()) newErrors.street = "Street is required"
    if (!shippingInfo.houseNumber.trim()) newErrors.houseNumber = "House number is required"
    if (!shippingInfo.city.trim()) newErrors.city = "City is required"
    if (!shippingInfo.state.trim()) newErrors.state = "State is required"
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = "ZIP code is required"
    if (!shippingInfo.country.trim()) newErrors.country = "Country is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProceedToPayment = () => {
    if (validateForm()) {
      setShowPayment(true)
    }
  }

  const handlePaymentSuccess = (paymentData) => {
    console.log("Payment successful:", { shippingInfo, cartItems, orderTotal: total, paymentData })
    alert("Order placed successfully!")
    onBack() // Close the checkout modal
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = 10.0
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="auth-overlay" onClick={onBack}>
      <div className="auth-modal checkout-modal" onClick={(e) => e.stopPropagation()}>
        <header className="checkout-header">
        <h1>Checkout</h1>
        <button className="back-btn" onClick={onBack}>
          ← Back to Cart
        </button>
      </header>

      <div className="checkout-container">
        {/* Shipping Information Form */}
        <div className="checkout-form-section">
          <h2>Shipping Information</h2>
          <form className="shipping-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={shippingInfo.fullName}
                  onChange={handleInputChange}
                  className={errors.fullName ? "error" : ""}
                  placeholder="John Doe"
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                  placeholder="john@example.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shippingInfo.phone}
                onChange={handleInputChange}
                className={errors.phone ? "error" : ""}
                placeholder="+92 300 1234567"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="village">Village/Town *</label>
                <input
                  type="text"
                  id="village"
                  name="village"
                  value={shippingInfo.village}
                  onChange={handleInputChange}
                  className={errors.village ? "error" : ""}
                  placeholder="Mandi Bahauddin"
                />
                {errors.village && <span className="error-message">{errors.village}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="street">Street *</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={shippingInfo.street}
                  onChange={handleInputChange}
                  className={errors.street ? "error" : ""}
                  placeholder="Main Road"
                />
                {errors.street && <span className="error-message">{errors.street}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="houseNumber">House Number *</label>
                <input
                  type="text"
                  id="houseNumber"
                  name="houseNumber"
                  value={shippingInfo.houseNumber}
                  onChange={handleInputChange}
                  className={errors.houseNumber ? "error" : ""}
                  placeholder="123"
                />
                {errors.houseNumber && <span className="error-message">{errors.houseNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  className={errors.city ? "error" : ""}
                  placeholder="Mandi Bahauddin"
                  readOnly
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">Province *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={shippingInfo.state}
                  onChange={handleInputChange}
                  className={errors.state ? "error" : ""}
                  placeholder="Punjab"
                  readOnly
                />
                {errors.state && <span className="error-message">{errors.state}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="zipCode">Postal Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={shippingInfo.zipCode}
                  onChange={handleInputChange}
                  className={errors.zipCode ? "error" : ""}
                  placeholder="50400"
                  readOnly
                />
                {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <input
                type="text"
                id="country"
                name="country"
                value={shippingInfo.country}
                onChange={handleInputChange}
                className={errors.country ? "error" : ""}
                placeholder="Pakistan"
                readOnly
              />
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>

          <div className="order-items">
            {cartItems.map((item) => (
              <div key={item.id} className="order-item">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="order-item-image" />
                <div className="order-item-details">
                  <h4>{item.name}</h4>
                  <p className="order-item-quantity">Qty: {item.quantity}</p>
                </div>
                <p className="order-item-price">Rs{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>Rs{subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping:</span>
              <span>Rs{shipping.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax (8%):</span>
              <span>Rs{tax.toFixed(2)}</span>
            </div>
            <div className="total-divider"></div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>Rs{total.toFixed(2)}</span>
            </div>
          </div>

          <button className="payment-btn" onClick={handleProceedToPayment}>
            Proceed to Payment
          </button>

          <div className="secure-checkout-badge">
            <span>🔒</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>

      {showPayment && (
        <Payment
          onClose={() => setShowPayment(false)}
          onPaymentSuccess={handlePaymentSuccess}
          orderTotal={total}
          cartItems={cartItems}
          shippingInfo={shippingInfo}
          onTrackOrder={onTrackOrder}
        />
      )}
      </div>
    </div>
  )
}
