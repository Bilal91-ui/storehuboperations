"use client"

import { useState } from "react"
import "./OrderDetails.css"

function OrderDetails({ order, onClose, onOrderCancelled }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#4a7c59'
      case 'shipped': return '#d4a574'
      case 'processing': return '#ff9800'
      case 'pending': return '#2196f3'
      case 'cancelled': return '#c45343'
      default: return '#666666'
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '✅'
      case 'shipped': return '🚚'
      case 'processing': return '⚙️'
      case 'pending': return '⏳'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const handleCancelOrder = async () => {
    setCancelling(true)

    // Simulate API call to cancel order
    setTimeout(() => {
      // Update order status to cancelled
      const cancelledOrder = {
        ...order,
        status: 'cancelled',
        canCancel: false,
        cancelledDate: new Date()
      }

      // Notify parent component
      if (onOrderCancelled) {
        onOrderCancelled(cancelledOrder)
      }

      setCancelling(false)
      setShowCancelConfirm(false)

      // Show success notification
      alert(`Order ${order.orderId} has been cancelled successfully. A confirmation email has been sent to your registered email address.`)
    }, 2000)
  }

  if (!order) return null

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="details-header">
          <h2>Order Details</h2>
          <p>{order.orderId}</p>
        </div>

        <div className="order-status-section">
          <div className={`status-display ${order.status}`}>
            <div className="status-icon-large">{getStatusIcon(order.status)}</div>
            <div className="status-info">
              <h3>Order Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</h3>
              <p>
                Ordered on {formatDate(order.date)} at {formatTime(order.date)}
              </p>
              {order.status === 'cancelled' && order.cancelledDate && (
                <p className="cancelled-date">
                  Cancelled on {formatDate(order.cancelledDate)} at {formatTime(order.cancelledDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="order-details-grid">
          <div className="detail-section">
            <h4>📦 Order Items</h4>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="order-item-detail">
                  <div className="item-info">
                    <h5>{item.name}</h5>
                    <p className="item-quantity">Quantity: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    Rs {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total-detail">
              <strong>Total: Rs {order.total.toLocaleString()}</strong>
            </div>
          </div>

          <div className="detail-section">
            <h4>🚚 Shipping Information</h4>
            <div className="shipping-info">
              <p><strong>Estimated Delivery:</strong> Within 3-5 business days</p>
              <p><strong>Shipping Method:</strong> Standard Delivery</p>
              <p><strong>Tracking:</strong> Available once shipped</p>
            </div>
          </div>

          <div className="detail-section">
            <h4>💳 Payment Information</h4>
            <div className="payment-info">
              <p><strong>Payment Method:</strong> Cash on Delivery</p>
              <p><strong>Payment Status:</strong> {order.status === 'cancelled' ? 'Refunded' : 'Pending'}</p>
              {order.status === 'cancelled' && (
                <p><strong>Refund Status:</strong> Processing (3-5 business days)</p>
              )}
            </div>
          </div>
        </div>

        {order.canCancel && (
          <div className="cancel-section">
            <div className="cancel-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <h4>Cancel Order</h4>
                <p>
                  You can cancel this order as it hasn't been shipped yet.
                  Once cancelled, the order cannot be restored.
                </p>
              </div>
            </div>

            {!showCancelConfirm ? (
              <button
                className="btn-danger cancel-btn"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel Order
              </button>
            ) : (
              <div className="cancel-confirmation">
                <h4>Confirm Cancellation</h4>
                <p>Are you sure you want to cancel order {order.orderId}?</p>
                <p className="cancel-note">
                  • Your payment will be refunded within 3-5 business days<br/>
                  • You will receive a confirmation email<br/>
                  • This action cannot be undone
                </p>
                <div className="confirmation-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                  >
                    Keep Order
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="cancelled-notice">
            <div className="cancelled-icon">❌</div>
            <h4>Order Cancelled</h4>
            <p>This order has been cancelled. If you have any questions, please contact our support team.</p>
            <div className="refund-info">
              <p><strong>Refund Information:</strong></p>
              <ul>
                <li>Refund will be processed within 3-5 business days</li>
                <li>Amount: Rs {order.total.toLocaleString()}</li>
                <li>Method: Original payment method</li>
              </ul>
            </div>
          </div>
        )}

        <div className="details-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {order.status !== 'cancelled' && (
            <button className="btn-primary" onClick={() => {
              // In a real app, this would navigate to tracking
              alert("Tracking feature would open here")
            }}>
              Track Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetails