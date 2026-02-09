// OrderOversight.jsx
import React, { useState } from 'react';
import './orderOversight.css';
import './adminDashboard.css'; // Reusing general admin styles

const OrderOversight = () => {
  // 1. Mock Data: Orders including disputes
  const [orders, setOrders] = useState([
    { 
      id: 'ORD-1001', customer: 'John Doe', vendor: 'Burger King', rider: 'Mike Ross', 
      amount: '$15.50', status: 'Delivered', date: '2025-03-01', issue: null 
    },
    { 
      id: 'ORD-1002', customer: 'Alice Smith', vendor: 'Pizza Hut', rider: 'Sarah Connor', 
      amount: '$45.00', status: 'Dispute', date: '2025-03-02', 
      issue: { type: 'Item Missing', desc: 'Customer reported missing drink.', status: 'Open' } 
    },
    { 
      id: 'ORD-1003', customer: 'Bob Brown', vendor: 'Tech Store', rider: 'Unassigned', 
      amount: '$120.00', status: 'Pending', date: '2025-03-02', issue: null 
    },
    { 
      id: 'ORD-1004', customer: 'Jane Doe', vendor: 'Sushi Place', rider: 'John Wick', 
      amount: '$32.00', status: 'Dispute', date: '2025-03-01', 
      issue: { type: 'Late Delivery', desc: 'Rider delayed by 45 mins. Food cold.', status: 'Open' } 
    },
  ]);

  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLog, setActionLog] = useState([]);

  // --- HANDLERS ---

  // 5. Admin Interventions
  const handleRefund = () => {
    if (window.confirm(`Process full refund of ${selectedOrder.amount} for ${selectedOrder.id}?`)) {
      updateOrderStatus(selectedOrder.id, 'Refunded');
      logAction(selectedOrder.id, 'Admin processed full refund.');
      alert("Refund processed. Notification sent to Customer and Finance.");
    }
  };

  const handleReassign = () => {
    const newRider = prompt("Enter new Rider Name:", "Available Rider");
    if (newRider) {
      const updatedOrders = orders.map(o => o.id === selectedOrder.id ? { ...o, rider: newRider } : o);
      setOrders(updatedOrders);
      setSelectedOrder({ ...selectedOrder, rider: newRider });
      logAction(selectedOrder.id, `Rider reassigned to ${newRider}.`);
      alert("Rider reassigned successfully.");
    }
  };

  const handleResolveDispute = () => {
    updateOrderStatus(selectedOrder.id, 'Resolved');
    logAction(selectedOrder.id, 'Dispute marked as Resolved by Admin.');
    alert("Dispute closed. Parties notified.");
  };

  // Helper to update status
  const updateOrderStatus = (id, newStatus) => {
    const updatedOrders = orders.map(o => 
      o.id === id ? { ...o, status: newStatus, issue: o.issue ? { ...o.issue, status: 'Closed' } : null } : o
    );
    setOrders(updatedOrders);
    setSelectedOrder(null); // Close modal
  };

  // 6. Logging Actions
  const logAction = (orderId, action) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] Order ${orderId}: ${action}`, ...prev]);
  };

  // Filtering Logic
  const filteredOrders = filter === 'All' 
    ? orders 
    : orders.filter(o => {
        if (filter === 'Dispute') return o.status === 'Dispute';
        if (filter === 'Active') return ['Pending', 'Processing'].includes(o.status);
        if (filter === 'Completed') return ['Delivered', 'Resolved', 'Refunded'].includes(o.status);
        return o.status === filter;
      });

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2 className="section-title" style={{margin:0, border:0, padding:0}}>Order Oversight</h2>
        <div style={{color:'#666'}}>Total Orders: {orders.length}</div>
      </div>

      {/* 3. Status Tabs */}
      <div className="order-tabs">
        {['All', 'Active', 'Completed', 'Dispute'].map(f => (
          <button 
            key={f} 
            className={`tab-btn ${filter === f ? 'active' : ''} ${f === 'Dispute' ? 'dispute-tab' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} {f === 'Dispute' && `(${orders.filter(o => o.status === 'Dispute').length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-container" style={{boxShadow:'none', border:'1px solid #e5e7eb'}}>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Vendor / Rider</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{order.date}</td>
                <td>{order.customer}</td>
                <td>
                  <div>{order.vendor}</div>
                  <div style={{fontSize:'0.8rem', color:'#666'}}>🏍️ {order.rider}</div>
                </td>
                <td>{order.amount}</td>
                <td>
                  <span className={`status-pill sp-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button className="btn-sm btn-outline" onClick={() => setSelectedOrder(order)}>Manage</button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#999'}}>No orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* 4. & 5. Detail & Intervention Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3 style={{margin:0}}>Manage Order {selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button>
            </div>

            {/* Dispute Alert */}
            {selectedOrder.status === 'Dispute' && selectedOrder.issue && (
              <div className="issue-box">
                <div className="issue-title">⚠️ Dispute Raised: {selectedOrder.issue.type}</div>
                <div>{selectedOrder.issue.desc}</div>
              </div>
            )}

            <div className="detail-grid">
              <div className="detail-box"><label>Customer</label><div>{selectedOrder.customer}</div></div>
              <div className="detail-box"><label>Amount</label><div>{selectedOrder.amount}</div></div>
              <div className="detail-box"><label>Vendor</label><div>{selectedOrder.vendor}</div></div>
              <div className="detail-box"><label>Assigned Rider</label><div>{selectedOrder.rider}</div></div>
              <div className="detail-box"><label>Current Status</label>
                <span className={`status-pill sp-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
              </div>
            </div>

            {/* 5. Intervention Panel */}
            <div className="admin-actions">
              <h4 style={{margin:'0 0 10px 0', color:'#374151'}}>Admin Actions</h4>
              <div className="action-buttons">
                {selectedOrder.status !== 'Refunded' && (
                  <button className="btn-action btn-refund" onClick={handleRefund}>Process Refund</button>
                )}
                {selectedOrder.status !== 'Delivered' && (
                  <button className="btn-action btn-reassign" onClick={handleReassign}>Reassign Rider</button>
                )}
                {selectedOrder.status === 'Dispute' && (
                  <button className="btn-action btn-resolve" onClick={handleResolveDispute}>Resolve Dispute</button>
                )}
              </div>
            </div>

            {/* 6. Logs */}
            <div className="log-section">
              <strong>Activity Log:</strong>
              {actionLog.filter(l => l.includes(selectedOrder.id)).length === 0 
                ? <div style={{marginTop:'5px', fontStyle:'italic'}}>No recent admin actions.</div>
                : actionLog.filter(l => l.includes(selectedOrder.id)).map((log, i) => <div key={i} className="log-item">{log}</div>)
              }
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default OrderOversight;