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

  const getEffectivePrice = (item) => {
    // Use salePrice if it's set and less than the original price
    if (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) {
      return item.salePrice
    }
    return item.price
  }

  const subtotal = cartItems.reduce((sum, item) => sum + getEffectivePrice(item) * item.quantity, 0)
  const shipping = 10.0
  const tax = subtotal * 0.08
  const calculatedOrderTotal = subtotal + shipping + tax

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

  const handleSendOTP = async () => {
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

    try {
      // First create the order
      const orderResponse = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: shippingInfo.fullName,
          customer_email: shippingInfo.email,
          customer_phone: shippingInfo.phone,
          shipping_address: `${shippingInfo.houseNumber} ${shippingInfo.street}, ${shippingInfo.village}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}, ${shippingInfo.country}`,
          payment_method: "easypaisa",
          cart_items: cartItems.map(item => ({
            product_id: item.product_id || item.id,
            name: item.name,
            price: getEffectivePrice(item),
            quantity: item.quantity
          })),
          subtotal: subtotal,
          tax_amount: tax
        })
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      const orderData = await orderResponse.json()
      const orderId = orderData.order_id

      // Now send OTP
      const otpResponse = await fetch(`http://localhost:5000/api/orders/${orderId}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: easypaisaNumber
        })
      })

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send OTP")
      }

      setOtpSent(true)
      setLoading(false)
      alert(`OTP sent to ${easypaisaNumber}\n\n⚠️ DEVELOPMENT MODE: Check console/server logs for OTP code`)

      // Store order ID for later use
      setOrderData(prev => ({ ...prev, orderId }))

    } catch (error) {
      console.error("Send OTP error:", error)
      setLoading(false)
      setErrors({ easypaisaNumber: error.message || "Failed to send OTP. Please try again." })
    }
  }

  const handleVerifyOTP = async () => {
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

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderData.orderId}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: otp
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "OTP verification failed")
      }

      setOtpVerified(true)
      setLoading(false)

      // Get updated order data
      const orderResponse = await fetch(`http://localhost:5000/api/orders/${orderData.orderId}`)
      if (orderResponse.ok) {
        const orderDetails = await orderResponse.json()
        const completeOrderData = {
          orderId: orderDetails.order.id,
          orderNumber: orderDetails.order.order_number,
          shippingInfo: shippingInfo,
          cartItems: cartItems,
          paymentMethod: 'easypaisa',
          paymentDetails: { phoneNumber: easypaisaNumber },
          orderTotal: calculatedOrderTotal,
          subtotal: subtotal,
          shipping: shipping,
          tax: tax,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          orderDate: new Date(),
          orderStatus: orderDetails.order.order_status
        }
        setOrderData(completeOrderData)
        setShowOrderConfirmation(true)
      }

    } catch (error) {
      console.error("Verify OTP error:", error)
      setLoading(false)
      setErrors({ otp: error.message || "OTP verification failed" })
    }
  }

  const handleCashOnDelivery = async () => {
    setLoading(true)

    try {
      const orderResponse = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: shippingInfo.fullName,
          customer_email: shippingInfo.email,
          customer_phone: shippingInfo.phone,
          shipping_address: `${shippingInfo.houseNumber} ${shippingInfo.street}, ${shippingInfo.village}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}, ${shippingInfo.country}`,
          payment_method: "cod",
          cart_items: cartItems.map(item => ({
            product_id: item.product_id || item.id,
            name: item.name,
            price: getEffectivePrice(item),
            quantity: item.quantity
          })),
          subtotal: subtotal,
          tax_amount: tax
        })
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      const orderDataResponse = await orderResponse.json()

      // Get complete order details
      const orderDetailsResponse = await fetch(`http://localhost:5000/api/orders/${orderDataResponse.order_id}`)
      if (!orderDetailsResponse.ok) {
        throw new Error("Failed to get order details")
      }

      const orderDetails = await orderDetailsResponse.json()

      const completeOrderData = {
        orderId: orderDetails.order.id,
        orderNumber: orderDetails.order.order_number,
        shippingInfo: shippingInfo,
        cartItems: cartItems,
        paymentMethod: 'cod',
        orderTotal: calculatedOrderTotal,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        orderDate: new Date(),
        orderStatus: orderDetails.order.order_status
      }

      setOrderData(completeOrderData)
      setShowOrderConfirmation(true)
      setLoading(false)

    } catch (error) {
      console.error("COD order error:", error)
      setLoading(false)
      alert("Failed to place order. Please try again.")
    }
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
                  <span>Rs {(getEffectivePrice(item) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: Rs {calculatedOrderTotal.toLocaleString()}</strong>
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
              <p>You will pay Rs {calculatedOrderTotal.toLocaleString()} when your order is delivered to your doorstep.</p>
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