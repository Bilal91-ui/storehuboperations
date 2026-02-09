"use client"

import { useState } from "react"
import "./OrderConfirmation.css"

function OrderConfirmation({ orderData, onClose, onTrackOrder }) {
  const [showDetails, setShowDetails] = useState(false)

  const {
    orderId,
    shippingInfo,
    cartItems,
    paymentMethod,
    orderTotal,
    subtotal,
    shipping: shippingCost,
    tax,
    estimatedDelivery
  } = orderData

  const formatOrderId = (id) => {
    return `ORD-${id.toString().padStart(6, '0')}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="confirmation-header">
          <div className="success-icon">🎉</div>
          <h1>Order Confirmed!</h1>
          <p className="confirmation-subtitle">
            Thank you for your order. We've received your order and will process it shortly.
          </p>
        </div>

        <div className="order-summary-card">
          <div className="order-id-section">
            <h3>Order #{formatOrderId(orderId)}</h3>
            <p className="order-date">
              Placed on {formatDate(new Date())} at {formatTime(new Date())}
            </p>
          </div>

          <div className="order-details-grid">
            <div className="detail-section">
              <h4>📍 Delivery Address</h4>
              <div className="address-info">
                <p className="name">{shippingInfo.fullName}</p>
                <p>House #{shippingInfo.houseNumber}, {shippingInfo.street}</p>
                <p>{shippingInfo.village}, {shippingInfo.city}</p>
                <p>{shippingInfo.state} {shippingInfo.zipCode}, {shippingInfo.country}</p>
                <p>📞 {shippingInfo.phone}</p>
              </div>
            </div>

            <div className="detail-section">
              <h4>💳 Payment Method</h4>
              <div className="payment-info">
                <p className="payment-method">
                  {paymentMethod === 'cod' ? '💰 Cash on Delivery' : '📱 Easypaisa'}
                </p>
                {paymentMethod === 'easypaisa' && (
                  <p className="payment-details">Phone: {orderData.paymentDetails?.phoneNumber}</p>
                )}
                <p className="payment-status">
                  {paymentMethod === 'cod' ? 'To be paid on delivery' : 'Payment completed'}
                </p>
              </div>
            </div>

            <div className="detail-section">
              <h4>🚚 Estimated Delivery</h4>
              <div className="delivery-info">
                <p className="delivery-date">{formatDate(estimatedDelivery)}</p>
                <p className="delivery-note">
                  We'll send you tracking updates via SMS and email
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-items-section">
          <div className="section-header" onClick={() => setShowDetails(!showDetails)}>
            <h4>📦 Order Items ({cartItems.length})</h4>
            <button className="toggle-btn">
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showDetails && (
            <div className="items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h5>{item.name}</h5>
                    <p className="item-quantity">Quantity: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    Rs {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-totals">
          <div className="totals-breakdown">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Shipping:</span>
              <span>Rs {shippingCost.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>Rs {tax.toLocaleString()}</span>
            </div>
            <div className="total-divider"></div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>Rs {orderTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn-secondary" onClick={onClose}>
            Continue Shopping
          </button>
          <button className="btn-primary" onClick={() => {
            if (onTrackOrder) {
              onTrackOrder(`ORD-${orderData.orderId.toString().padStart(6, '0')}`)
            } else {
              alert("Order tracking feature would open here")
            }
          }}>
            Track Order
          </button>
        </div>

        <div className="confirmation-footer">
          <p>
            📧 A confirmation email has been sent to <strong>{shippingInfo.email}</strong>
          </p>
          <p>
            📱 You'll receive SMS updates about your order status
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation