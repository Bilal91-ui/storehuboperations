// VendorOrders.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './vendororders.css';
import './sellerDashboard.css'; // Reuse generic styles

const VendorOrders = () => {
  // 1. Mock Database
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    // Connect to Socket.IO server
    const socketInstance = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    const getSellerSession = () => {
      const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
      if (!saved) return null;
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn('Invalid seller session data', err);
        return null;
      }
    };

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      const sellerData = getSellerSession();
      if (sellerData) {
        const { user_id, seller_id, userId } = sellerData;
        socketInstance.emit('seller_login', {
          user_id: user_id || userId,
          seller_id
        });
      }
    });

    // Listen for new order notifications
    socketInstance.on('new_order_notification', (notificationData) => {
      console.log('🔔 New Order Notification:', notificationData);
      
      // Show alert to seller
      setNewOrderAlert(notificationData);
      
      // Auto hide alert after 8 seconds
      setTimeout(() => setNewOrderAlert(null), 8000);
      
      // Refresh orders list
      fetchOrders();
      
      // Play sound notification if possible
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.log('Sound notification skipped');
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
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

  const getImageUrl = (image) => {
    if (!image) return null;
    return image.startsWith('http') ? image : `http://localhost:5000${image}`;
  };

  // --- HANDLERS ---

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleStatusChange = async (orderId, newStatus) => {
  setLoading(true);
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
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    showNotification(`Order #${orderId} updated to ${newStatus}`);

  } catch (error) {
    console.error(error);
    alert("Failed to update order");
  } finally {
    setLoading(false);
  }
};

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
      if (!saved) {
        alert('Seller session not found. Please login again.');
        return;
      }

      const sellerData = JSON.parse(saved);
      const sellerId = sellerData.seller_id || sellerData.sellerId;
      if (!sellerId) {
        alert('Seller ID not found in session.');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/vendor/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to accept order');
        return;
      }

      fetchOrders();
      showNotification(`Order #${orderId} accepted. Nearest rider notified.`);
    } catch (error) {
      console.error(error);
      alert('Failed to accept order');
    } finally {
      setLoading(false);
    }
  };


  // Helper to render buttons based on status
  const renderActionButtons = (order) => {
    const status = order.status || 'pending';
    switch (status) {
      case 'Pending':
        return (
          <>
            <button className="submit-button btn-accept" onClick={() => handleAcceptOrder(order.id)} disabled={loading}>
              {loading ? 'Processing...' : '✅ Accept Order'}
            </button>
            <button className="submit-button btn-decline" onClick={() => handleStatusChange(order.id, 'Cancelled')} disabled={loading}>
              {loading ? 'Processing...' : '❌ Decline'}
            </button>
          </>
        );
      case 'Processing':
        return (
          <button className="submit-button btn-process" onClick={() => handleStatusChange(order.id, 'Shipped')} disabled={loading}>
            {loading ? 'Processing...' : '📦 Mark as Shipped'}
          </button>
        );
      case 'Shipped':
        return (
          <button className="submit-button btn-complete" onClick={() => handleStatusChange(order.id, 'Completed')} disabled={loading}>
            {loading ? 'Processing...' : '🎉 Mark as Completed'}
          </button>
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

      {/* New Order Notification Alert */}
      {newOrderAlert && (
        <div className="new-order-alert" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>🔔 NEW ORDER RECEIVED!</h3>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Order #:</strong> {newOrderAlert.order_number}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Customer:</strong> {newOrderAlert.customer_name} ({newOrderAlert.customer_phone})
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Total Amount:</strong> PKR {(newOrderAlert.total_amount || 0).toFixed(2)}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Payment Method:</strong> {(newOrderAlert.payment_method || 'cod').toUpperCase()}
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#ddd' }}>
                {new Date(newOrderAlert.created_at).toLocaleString()}
              </p>
            </div>
            <button 
              onClick={() => setNewOrderAlert(null)}
              style={{
                background: 'rgba(255,255,255,0.3)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0 10px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {notification && <div className="alert-success">🔔 {notification}</div>}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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
          {orders.map(order => {
            const totalAmount = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;
            const orderStatus = order.status || 'pending';
            return (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.date}</td>
                <td>{order.customer}</td>
                <td>PKR {totalAmount.toFixed(2)}</td>
                <td><span className={`badge badge-${orderStatus.toLowerCase()}`}>{orderStatus}</span></td>
                <td>
                  <button className="action-btn" onClick={() => setSelectedOrder(order)}>View Details</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '600px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3>Order Details #{selectedOrder.id}</h3>
              <span className={`badge badge-${(selectedOrder.status || 'pending').toLowerCase()}`} style={{ alignSelf: 'center' }}>{selectedOrder.status || 'pending'}</span>
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
                <p style={{ fontSize: '1.2rem', color: '#28a745', fontWeight: 'bold' }}>PKR {(typeof selectedOrder.total === 'number' ? selectedOrder.total : parseFloat(selectedOrder.total) || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="order-items-list">
              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase', color: '#888' }}>Items Ordered</h4>
              {selectedOrder.items?.length ? (
                selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item order-item-detail">
                    <div className="item-image-wrapper">
                      {getImageUrl(item.image) ? (
                        <img src={getImageUrl(item.image)} alt={item.name || 'Product'} className="order-item-image" />
                      ) : (
                        <div className="order-item-image placeholder">No Image</div>
                      )}
                    </div>
                    <div className="item-info">
                      <div className="item-name">{item.name || 'Unknown Item'}</div>
                      {item.description && <div className="item-description">{item.description}</div>}
                      <div className="item-meta">Qty: {item.qty} · PKR {item.price.toFixed(2)} each</div>
                    </div>
                    <div className="item-total">PKR {(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No item details available for this order.</p>
              )}
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