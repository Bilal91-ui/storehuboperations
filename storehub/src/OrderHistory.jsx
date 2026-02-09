"use client"

import { useState } from "react"
import "./OrderHistory.css"

function OrderHistory({ onClose, onViewOrderDetails }) {
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Mock order history data
  const [orders, setOrders] = useState([
    {
      id: 123456,
      orderId: "ORD-123456",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "delivered",
      total: 489.97,
      items: [
        { name: "Wireless Headphones", quantity: 1, price: 89.99 },
        { name: "Smart Watch Pro", quantity: 2, price: 199.99 }
      ],
      canCancel: false
    },
    {
      id: 234567,
      orderId: "ORD-234567",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "shipped",
      total: 159.99,
      items: [
        { name: "Premium Coffee Maker", quantity: 1, price: 149.99 }
      ],
      canCancel: false
    },
    {
      id: 345678,
      orderId: "ORD-345678",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "processing",
      total: 179.98,
      items: [
        { name: "Running Shoes", quantity: 1, price: 79.99 },
        { name: "Wireless Headphones", quantity: 1, price: 89.99 }
      ],
      canCancel: true
    },
    {
      id: 456789,
      orderId: "ORD-456789",
      date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      status: "pending",
      total: 299.99,
      items: [
        { name: "Smart Watch Pro", quantity: 1, price: 199.99 },
        { name: "Running Shoes", quantity: 1, price: 79.99 }
      ],
      canCancel: true
    }
  ])

  const statusFilters = [
    { value: "all", label: "All Orders", count: orders.length },
    { value: "pending", label: "Pending", count: orders.filter(o => o.status === "pending").length },
    { value: "processing", label: "Processing", count: orders.filter(o => o.status === "processing").length },
    { value: "shipped", label: "Shipped", count: orders.filter(o => o.status === "shipped").length },
    { value: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
    { value: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length }
  ]

  const filteredOrders = selectedStatus === "all"
    ? orders
    : orders.filter(order => order.status === selectedStatus)

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const handleViewDetails = (order) => {
    if (onViewOrderDetails) {
      onViewOrderDetails(order)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal history-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="history-header">
          <h2>My Orders</h2>
          <p>View and manage your order history</p>
        </div>

        <div className="status-filters">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              className={`filter-btn ${selectedStatus === filter.value ? 'active' : ''}`}
              onClick={() => setSelectedStatus(filter.value)}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>No orders found</h3>
              <p>You don't have any {selectedStatus === "all" ? "" : selectedStatus} orders yet.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>{order.orderId}</h3>
                    <p className="order-date">
                      {formatDate(order.date)} at {formatTime(order.date)}
                    </p>
                  </div>
                  <div className={`status-badge ${order.status}`}>
                    <span className="status-icon">{getStatusIcon(order.status)}</span>
                    <span className="status-text">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </div>
                </div>

                <div className="order-content">
                  <div className="order-items-preview">
                    {order.items.slice(0, 2).map((item, index) => (
                      <span key={index} className="item-preview">
                        {item.name} {order.items.length > 2 && index === 1 ? ` +${order.items.length - 2} more` : ''}
                      </span>
                    ))}
                  </div>

                  <div className="order-total">
                    <span>Total: Rs {order.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="order-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => handleViewDetails(order)}
                  >
                    View Details
                  </button>
                  {order.canCancel && (
                    <button
                      className="btn-danger"
                      onClick={() => handleViewDetails(order)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="history-footer">
          <p>Need help with an order? <a href="#contact">Contact Support</a></p>
        </div>
      </div>
    </div>
  )
}

export default OrderHistory