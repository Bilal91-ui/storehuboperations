// VendorOrders.jsx
import React, { useState, useEffect } from 'react';
import './vendororders.css';
import './sellerDashboard.css'; // Reuse generic styles

const VendorOrders = () => {
  // 1. Mock Database
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/vendor/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };


  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState('');

  // --- HANDLERS ---

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleStatusChange = async (orderId, newStatus) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/vendor/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    fetchOrders();
    setSelectedOrder(null);

    showNotification(`Order #${orderId} updated to ${newStatus}`);

  } catch (error) {
    console.error(error);
    alert("Failed to update order");
  }
};


  // Helper to render buttons based on status
  const renderActionButtons = (order) => {
    switch (order.status) {
      case 'Pending':
        return (
          <>
            <button className="submit-button btn-accept" onClick={() => handleStatusChange(order.id, 'Processing')}>✅ Accept Order</button>
            <button className="submit-button btn-decline" onClick={() => handleStatusChange(order.id, 'Cancelled')}>❌ Decline</button>
          </>
        );
      case 'Processing':
        return (
          <button className="submit-button btn-process" onClick={() => handleStatusChange(order.id, 'Shipped')}>📦 Mark as Shipped</button>
        );
      case 'Shipped':
        return (
          <button className="submit-button btn-complete" onClick={() => handleStatusChange(order.id, 'Completed')}>🎉 Mark as Completed</button>
        );
      default:
        return <p style={{ color: '#666', fontStyle: 'italic' }}>No further actions available.</p>;
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>Order Management</h2>
      </div>

      {notification && <div className="alert-success">🔔 {notification}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{order.date}</td>
              <td>{order.customer}</td>
              <td>${order.total.toFixed(2)}</td>
              <td><span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
              <td>
                <button className="action-btn" onClick={() => setSelectedOrder(order)}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '600px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3>Order Details #{selectedOrder.id}</h3>
              <span className={`badge badge-${selectedOrder.status.toLowerCase()}`} style={{ alignSelf: 'center' }}>{selectedOrder.status}</span>
            </div>

            <div className="order-details-grid">
              <div className="detail-group">
                <label>Customer Name</label>
                <p>{selectedOrder.customer}</p>
              </div>
              <div className="detail-group">
                <label>Delivery Address</label>
                <p>{selectedOrder.address}</p>
              </div>
              <div className="detail-group">
                <label>Order Date</label>
                <p>{selectedOrder.date}</p>
              </div>
              <div className="detail-group">
                <label>Total Amount</label>
                <p style={{ fontSize: '1.2rem', color: '#28a745', fontWeight: 'bold' }}>${selectedOrder.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="order-items-list">
              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase', color: '#888' }}>Items Ordered</h4>
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span>{item.qty}x {item.name}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              {renderActionButtons(selectedOrder)}
              <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;