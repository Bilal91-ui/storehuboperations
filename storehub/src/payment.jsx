"use client"

import { useState } from "react"
import "./payment.css"
import OrderConfirmation from "./OrderConfirmation"

function Payment({ onClose, onPaymentSuccess, orderTotal, cartItems, shippingInfo, onTrackOrder }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [easypaisaNumber, setEasypaisaNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [orderData, setOrderData] = useState(null)

  const paymentMethods = [
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when you receive your order",
      icon: "💰"
    },
    {
      id: "easypaisa",
      name: "Easypaisa",
      description: "Pay using your Easypaisa account",
      icon: "📱"
    }
  ]

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId)
    setErrors({})
    setOtpSent(false)
    setOtpVerified(false)
    setOtp("")
  }

  const handleSendOTP = () => {
    if (!easypaisaNumber.trim()) {
      setErrors({ easypaisaNumber: "Please enter your Easypaisa phone number" })
      return
    }

    if (!/^03\d{9}$/.test(easypaisaNumber.replace(/\s+/g, ''))) {
      setErrors({ easypaisaNumber: "Please enter a valid Easypaisa number (03xxxxxxxxx)" })
      return
    }

    setLoading(true)
    setErrors({})

    // Simulate OTP sending
    setTimeout(() => {
      setOtpSent(true)
      setLoading(false)
      alert(`OTP sent to ${easypaisaNumber}`)
    }, 2000)
  }

  const handleVerifyOTP = () => {
    if (!otp.trim()) {
      setErrors({ otp: "Please enter the OTP" })
      return
    }

    if (otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" })
      return
    }

    setLoading(true)
    setErrors({})

    // Simulate OTP verification
    setTimeout(() => {
      // For demo purposes, accept any 6-digit OTP
      setOtpVerified(true)
      setLoading(false)

      // Simulate balance check and payment
      setTimeout(() => {
        if (orderTotal <= 5000) { // Assume sufficient balance for orders under 5000
          const newOrderData = {
            orderId: Math.floor(Math.random() * 1000000),
            shippingInfo: shippingInfo,
            cartItems: cartItems,
            paymentMethod: 'easypaisa',
            paymentDetails: { phoneNumber: easypaisaNumber },
            orderTotal: orderTotal,
            subtotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            shipping: 10.0,
            tax: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.08,
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            orderDate: new Date()
          }
          setOrderData(newOrderData)
          setShowOrderConfirmation(true)
        } else {
          alert("Insufficient balance. Please try a different payment method.")
          setOtpVerified(false)
          setOtpSent(false)
        }
      }, 1000)
    }, 2000)
  }

  const handleCashOnDelivery = () => {
    setLoading(true)
    // Simulate order placement
    setTimeout(() => {
      const newOrderData = {
        orderId: Math.floor(Math.random() * 1000000),
        shippingInfo: shippingInfo,
        cartItems: cartItems,
        paymentMethod: 'cod',
        orderTotal: orderTotal,
        subtotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping: 10.0,
        tax: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.08,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        orderDate: new Date()
      }
      setOrderData(newOrderData)
      setShowOrderConfirmation(true)
      setLoading(false)
    }, 2000)
  }

  const handleOrderConfirmationClose = () => {
    setShowOrderConfirmation(false)
    // Call the original payment success callback
    onPaymentSuccess(orderData)
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="payment-header">
          <h2>Payment Method</h2>
          <p className="payment-subtitle">Choose how you'd like to pay for your order</p>
        </div>

        <div className="payment-content">
          {/* Order Summary */}
          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>Rs {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: Rs {orderTotal.toLocaleString()}</strong>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            {errors.method && <div className="error-message">{errors.method}</div>}

            <div className="methods-grid">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method-card ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-info">
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                  </div>
                  <div className="method-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => handlePaymentMethodSelect(method.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Easypaisa Form */}
          {selectedPaymentMethod === "easypaisa" && (
            <div className="payment-form">
              <h3>Easypaisa Payment</h3>

              {!otpSent ? (
                <div className="form-group">
                  <label htmlFor="easypaisaNumber">Easypaisa Phone Number</label>
                  <input
                    type="tel"
                    id="easypaisaNumber"
                    value={easypaisaNumber}
                    onChange={(e) => setEasypaisaNumber(e.target.value)}
                    placeholder="03xxxxxxxxx"
                    className={errors.easypaisaNumber ? "error" : ""}
                  />
                  {errors.easypaisaNumber && <span className="error-message">{errors.easypaisaNumber}</span>}
                  <button
                    className="btn-primary"
                    onClick={handleSendOTP}
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              ) : !otpVerified ? (
                <div className="form-group">
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    className={errors.otp ? "error" : ""}
                  />
                  {errors.otp && <span className="error-message">{errors.otp}</span>}
                  <button
                    className="btn-primary"
                    onClick={handleVerifyOTP}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              ) : (
                <div className="payment-success">
                  <div className="success-icon">✅</div>
                  <p>OTP Verified! Ready to complete payment.</p>
                </div>
              )}
            </div>
          )}

          {/* Cash on Delivery Info */}
          {selectedPaymentMethod === "cod" && (
            <div className="payment-info">
              <div className="info-icon">🚚</div>
              <h3>Cash on Delivery</h3>
              <p>You will pay Rs {orderTotal.toLocaleString()} when your order is delivered to your doorstep.</p>
              <ul>
                <li>Pay only when you receive your items</li>
                <li>No advance payment required</li>
                <li>Check items before payment</li>
              </ul>
            </div>
          )}
        </div>

        <div className="payment-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={selectedPaymentMethod === "cod" ? handleCashOnDelivery : () => {}}
            disabled={loading || !selectedPaymentMethod || (selectedPaymentMethod === "easypaisa" && !otpVerified)}
          >
            {loading ? "Processing..." : selectedPaymentMethod === "cod" ? "Place Order" : "Pay Now"}
          </button>
        </div>
      </div>

      {showOrderConfirmation && orderData && (
        <OrderConfirmation
          orderData={orderData}
          onClose={handleOrderConfirmationClose}
          onTrackOrder={onTrackOrder}
        />
      )}
    </div>
  )
}

export default Payment