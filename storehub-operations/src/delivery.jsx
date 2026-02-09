// Delivery.jsx
import React, { useState, useEffect } from 'react';
import './delivery.css';
import './sellerDashboard.css';

const Delivery = () => {
  // 1. Mock Data: Active Deliveries
  const [deliveries, setDeliveries] = useState([
    { id: 101, customer: 'John Doe', address: '123 Market St', status: 'Pending', rider: null },
    { id: 102, customer: 'Jane Smith', address: '456 Oak Ave', status: 'In Transit', rider: { name: 'Mike Ross', vehicle: 'Yamaha Bike', contact: '555-0199' }, progress: 60 },
    { id: 103, customer: 'Alice Brown', address: '789 Pine Rd', status: 'Pending', rider: null }
  ]);

  // 2. Mock Data: Available Riders for Manual Assign
  const availableRiders = [
    { id: 1, name: 'Sarah Connor', vehicle: 'Honda Scooter', contact: '555-1234', dist: '2km away' },
    { id: 2, name: 'Kyle Reese', vehicle: 'Suzuki Bike', contact: '555-5678', dist: '0.5km away' },
    { id: 3, name: 'T-800', vehicle: 'Harley Davidson', contact: '555-9999', dist: '5km away' }
  ];

  // 3. UI States
  const [view, setView] = useState('list'); // 'list', 'assign-manual', 'track'
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [notification, setNotification] = useState('');
  const [trackingProgress, setTrackingProgress] = useState(0);

  // --- HANDLERS ---

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // Option 1: Auto Assign
  const handleAutoAssign = (orderId) => {
    showNotify(`System is searching for nearest rider for Order #${orderId}...`);
    
    // Simulate API delay
    setTimeout(() => {
      const randomRider = availableRiders[Math.floor(Math.random() * availableRiders.length)];
      updateOrderRider(orderId, randomRider);
      showNotify(`Rider ${randomRider.name} auto-assigned successfully!`);
    }, 1500);
  };

  // Option 2: Manual Assign (Open Modal)
  const openManualAssign = (orderId) => {
    setSelectedOrderId(orderId);
    setView('assign-manual');
  };

  // Confirm Manual Selection
  const handleManualSelect = (rider) => {
    updateOrderRider(selectedOrderId, rider);
    setView('list');
    setSelectedOrderId(null);
    showNotify(`Rider ${rider.name} manually assigned.`);
  };

  // Helper to update state
  const updateOrderRider = (id, rider) => {
    setDeliveries(prev => prev.map(order => 
      order.id === id 
      ? { ...order, status: 'Assigned', rider: rider, progress: 0 } 
      : order
    ));
  };

  // Option 3: Track Live Location
  const openTracking = (order) => {
    setSelectedOrderId(order.id);
    setTrackingProgress(order.progress || 0);
    setView('track');
  };

  // Simulate Real-time Movement in Tracking View
  useEffect(() => {
    let interval;
    if (view === 'track') {
      interval = setInterval(() => {
        setTrackingProgress(old => {
          if (old >= 100) return 100;
          return old + 10; // Move 10% every second
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [view]);

  // --- RENDER HELPERS ---

  const renderList = () => (
    <>
      {deliveries.map(order => (
        <div key={order.id} className="delivery-card">
          <div className="delivery-top">
            <h4>Order #{order.id} <span style={{fontSize:'0.9rem', color:'#666'}}>- {order.customer}</span></h4>
            <span className={`status-badge ${order.status === 'Pending' ? 'status-pending' : 'status-shipped'}`}>
              {order.status}
            </span>
          </div>
          <p style={{color:'#555', fontSize:'0.9rem', marginBottom:'10px'}}>📍 {order.address}</p>

          {order.rider ? (
            // Assigned State
            <div>
              <div className="rider-info">
                <strong>🏍️ Rider: {order.rider.name}</strong><br/>
                <span>Vehicle: {order.rider.vehicle}</span><br/>
                <span>Contact: {order.rider.contact}</span>
              </div>
              <button className="submit-button" style={{width:'100%'}} onClick={() => openTracking(order)}>
                🗺️ Track Live Location
              </button>
            </div>
          ) : (
            // Unassigned State
            <div className="action-row">
              <button className="submit-button" onClick={() => handleAutoAssign(order.id)}>
                ⚡ Auto Assign
              </button>
              <button className="btn-secondary" onClick={() => openManualAssign(order.id)}>
                👆 Manual Select
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );

  const renderManualAssign = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Select Rider for Order #{selectedOrderId}</h3>
        <p>Available Riders nearby:</p>
        <div className="rider-list">
          {availableRiders.map(rider => (
            <div key={rider.id} className="rider-option" onClick={() => handleManualSelect(rider)}>
              <div>
                <strong>{rider.name}</strong>
                <div style={{fontSize:'0.8rem', color:'#666'}}>{rider.vehicle}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <span style={{color:'green', fontWeight:'bold'}}>{rider.dist}</span>
                <br/><small>Click to Assign</small>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-secondary" style={{marginTop:'15px', width:'100%'}} onClick={() => setView('list')}>Cancel</button>
      </div>
    </div>
  );

  const renderTracking = () => {
    const currentOrder = deliveries.find(d => d.id === selectedOrderId);
    if (!currentOrder) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{width:'500px'}}>
          <h3>Tracking Order #{currentOrder.id}</h3>
          <p>Rider: <strong>{currentOrder.rider.name}</strong> is on the way.</p>

          {/* Fake Map Visualization */}
          <div className="map-container">
            <div style={{position:'absolute', top:'10px', left:'10px', background:'white', padding:'5px', borderRadius:'4px', zIndex:2, fontSize:'0.8rem'}}>
               Live GPS Feed 🟢
            </div>
            
            <div className="map-route">
              <div className="map-progress" style={{width: `${trackingProgress}%`}}></div>
              <div className="map-rider-icon" style={{left: `${trackingProgress}%`}}>🛵</div>
            </div>
            
            <div style={{position:'absolute', left:'5px', bottom:'100px', fontSize:'20px'}}>🏪</div> {/* Store */}
            <div style={{position:'absolute', right:'5px', bottom:'100px', fontSize:'20px'}}>🏠</div> {/* Home */}
          </div>

          <div className="eta-box">
             Estimated Arrival: {trackingProgress >= 100 ? "Arrived!" : `${Math.max(1, 15 - Math.floor(trackingProgress / 7))} mins`}
          </div>

          <button className="btn-secondary" style={{marginTop:'20px', width:'100%'}} onClick={() => setView('list')}>Close Tracking</button>
        </div>
      </div>
    );
  };

  return (
    <div className="delivery-container">
      <div className="delivery-header">
        <h2>Delivery Coordination</h2>
        <span>Active Assignments: {deliveries.filter(d => d.rider).length}</span>
      </div>

      {notification && <div className="alert-success">🔔 {notification}</div>}

      {view === 'list' && renderList()}
      {view === 'assign-manual' && renderManualAssign()}
      {view === 'track' && renderTracking()}
    </div>
  );
};

export default Delivery;