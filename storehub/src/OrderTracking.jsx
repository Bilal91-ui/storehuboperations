"use client"

import { useState } from "react"
import "./OrderTracking.css"

function OrderTracking({ onClose, initialOrderId = "" }) {
  const [orderId, setOrderId] = useState(initialOrderId)
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Mock order data for demonstration
  const mockOrders = {
    "ORD-123456": {
      orderId: 123456,
      status: "delivered",
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      actualDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        name: "John Doe",
        address: "123 Main Street, Apt 4B",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "United States"
      },
      items: [
        { name: "Wireless Headphones", quantity: 1, price: 89.99 },
        { name: "Smart Watch Pro", quantity: 2, price: 199.99 }
      ],
      total: 489.97,
      trackingNumber: "TRK-789012345",
      carrier: "FastDelivery Express",
      trackingHistory: [
        {
          status: "Order Placed",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          location: "Online Store",
          description: "Your order has been placed successfully"
        },
        {
          status: "Processing",
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          location: "Warehouse NYC",
          description: "Your order is being prepared for shipment"
        },
        {
          status: "Shipped",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          location: "Distribution Center",
          description: "Your order has been shipped and is on its way"
        },
        {
          status: "Out for Delivery",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 2 days ago + 6 hours
          location: "Local Delivery Hub",
          description: "Your order is out for delivery"
        },
        {
          status: "Delivered",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: "123 Main Street, New York, NY",
          description: "Your order has been delivered successfully"
        }
      ]
    },
    "ORD-234567": {
      orderId: 234567,
      status: "shipped",
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        name: "Jane Smith",
        address: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        country: "United States"
      },
      items: [
        { name: "Premium Coffee Maker", quantity: 1, price: 149.99 }
      ],
      total: 159.99,
      trackingNumber: "TRK-890123456",
      carrier: "SpeedShip Logistics",
      trackingHistory: [
        {
          status: "Order Placed",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: "Online Store",
          description: "Your order has been placed successfully"
        },
        {
          status: "Processing",
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          location: "Warehouse LA",
          description: "Your order is being prepared for shipment"
        },
        {
          status: "Shipped",
          date: new Date(Date.now() - 6 * 60 * 60 * 1000),
          location: "Distribution Center",
          description: "Your order has been shipped and is on its way"
        }
      ]
    },
    "ORD-345678": {
      orderId: 345678,
      status: "processing",
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        name: "Mike Johnson",
        address: "789 Pine Road, Suite 200",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "United States"
      },
      items: [
        { name: "Running Shoes", quantity: 1, price: 79.99 },
        { name: "Wireless Headphones", quantity: 1, price: 89.99 }
      ],
      total: 179.98,
      trackingNumber: "TRK-901234567",
      carrier: "QuickShip Delivery",
      trackingHistory: [
        {
          status: "Order Placed",
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          location: "Online Store",
          description: "Your order has been placed successfully"
        },
        {
          status: "Processing",
          date: new Date(Date.now() - 12 * 60 * 60 * 1000),
          location: "Warehouse CHI",
          description: "Your order is being prepared for shipment"
        }
      ]
    }
  }

  const handleTrackOrder = () => {
    if (!orderId.trim()) {
      setError("Please enter an order ID")
      return
    }

    setLoading(true)
    setError("")

    // Simulate API call
    setTimeout(() => {
      const formattedOrderId = orderId.toUpperCase().trim()
      const orderData = mockOrders[formattedOrderId]

      if (orderData) {
        setTrackingData(orderData)
        setError("")
      } else {
        setError("Order not found. Please check your order ID and try again.")
        setTrackingData(null)
      }

      setLoading(false)
    }, 1500)
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#4a7c59'
      case 'shipped': return '#d4a574'
      case 'out for delivery': return '#2e7d32'
      case 'processing': return '#ff9800'
      case 'order placed': return '#2196f3'
      default: return '#666666'
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '✅'
      case 'shipped': return '🚚'
      case 'out for delivery': return '🚴'
      case 'processing': return '⚙️'
      case 'order placed': return '📦'
      default: return '📋'
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal tracking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="tracking-header">
          <h2>Track Your Order</h2>
          <p>Enter your order ID to see the latest updates</p>
        </div>

        {!trackingData ? (
          <div className="tracking-form">
            <div className="form-group">
              <label htmlFor="orderId">Order ID</label>
              <input
                type="text"
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-123456"
                className={error ? "error" : ""}
              />
              {error && <span className="error-message">{error}</span>}
            </div>

            <button
              className="btn-primary track-btn"
              onClick={handleTrackOrder}
              disabled={loading}
            >
              {loading ? "Searching..." : "Track Order"}
            </button>

            <div className="tracking-examples">
              <p><strong>Example Order IDs:</strong></p>
              <ul>
                <li>ORD-123456 (Delivered)</li>
                <li>ORD-234567 (Shipped)</li>
                <li>ORD-345678 (Processing)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="tracking-results">
            <div className="order-summary-card">
              <div className="order-header">
                <h3>Order #{orderId.toUpperCase()}</h3>
                <div className={`status-badge ${trackingData.status}`}>
                  <span className="status-icon">{getStatusIcon(trackingData.status)}</span>
                  <span className="status-text">{trackingData.status.charAt(0).toUpperCase() + trackingData.status.slice(1)}</span>
                </div>
              </div>

              <div className="order-details-grid">
                <div className="detail-section">
                  <h4>📅 Order Date</h4>
                  <p>{formatDate(trackingData.orderDate)}</p>
                </div>

                <div className="detail-section">
                  <h4>🚚 Estimated Delivery</h4>
                  <p>{formatDate(trackingData.estimatedDelivery)}</p>
                  {trackingData.actualDelivery && (
                    <p className="actual-delivery">
                      <strong>Delivered:</strong> {formatDate(trackingData.actualDelivery)}
                    </p>
                  )}
                </div>

                <div className="detail-section">
                  <h4>📦 Tracking Number</h4>
                  <p>{trackingData.trackingNumber}</p>
                  <p className="carrier">{trackingData.carrier}</p>
                </div>

                <div className="detail-section">
                  <h4>💰 Total Amount</h4>
                  <p className="total-amount">Rs {trackingData.total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="tracking-timeline">
              <h4>📋 Order Timeline</h4>
              <div className="timeline">
                {trackingData.trackingHistory.map((update, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <div
                        className="timeline-dot"
                        style={{ backgroundColor: getStatusColor(update.status) }}
                      ></div>
                      {index < trackingData.trackingHistory.length - 1 && (
                        <div className="timeline-line"></div>
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h5 style={{ color: getStatusColor(update.status) }}>
                          {getStatusIcon(update.status)} {update.status}
                        </h5>
                        <span className="timeline-date">
                          {formatDate(update.date)} at {formatTime(update.date)}
                        </span>
                      </div>
                      <p className="timeline-location">📍 {update.location}</p>
                      <p className="timeline-description">{update.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-items-summary">
              <h4>📦 Order Items</h4>
              <div className="items-list">
                {trackingData.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-details">
                      Qty: {item.quantity} × Rs {item.price.toLocaleString()}
                    </span>
                    <span className="item-total">Rs {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tracking-actions">
              <button className="btn-secondary" onClick={() => setTrackingData(null)}>
                Track Another Order
              </button>
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTracking