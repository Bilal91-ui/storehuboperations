// Delivery.jsx
import React, { useState, useEffect } from 'react';
import './delivery.css';
import './sellerDashboard.css';

const Delivery = () => {
  // Remove mock data - use actual riders from API
  const [deliveries, setDeliveries] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [session, setSession] = useState(null);

  // 3. UI States
  const [view, setView] = useState('list');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [notification, setNotification] = useState('');
  const [trackingProgress, setTrackingProgress] = useState(0);

  // Load session data
  useEffect(() => {
    const getSessionData = () => {
      const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
      if (!saved) return null;
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn('Invalid seller session data', err);
        return null;
      }
    };
    setSession(getSessionData());
  }, []);

  // Fetch nearby riders
  useEffect(() => {
    if (session && session.user_id) {
      fetch(`http://localhost:5000/api/seller/nearby-riders?userId=${session.user_id}`)
        .then(res => res.json())
        .then(data => {
          const formatted = data.map(rider => ({
            id: rider.id,
            name: rider.name,
            vehicle: rider.vehicle_type || 'Unknown',
            contact: 'N/A',
            dist: `${rider.distance.toFixed(1)}km away`
          }));
          setAvailableRiders(formatted);
        })
        .catch(err => console.error('Error fetching nearby riders:', err));
    }
  }, [session]);

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
      <div className="delivery-header">
        <h2>Available Riders - 5km Radius</h2>
        <span>Total Riders: {availableRiders.length}</span>
      </div>
      
      {availableRiders.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
          <p>No riders available in 5km radius</p>
          <p style={{fontSize: '0.9rem'}}>📍 Make sure your location is enabled and riders are active</p>
        </div>
      ) : (
        <div style={{display: 'grid', gap: '15px'}}>
          {availableRiders.map((rider, idx) => (
            <div key={idx} className="delivery-card">
              <div className="delivery-top">
                <h4>🏍️ {rider.name}</h4>
                <span style={{background: '#4CAF50', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem'}}>
                  Available
                </span>
              </div>
              <p style={{color: '#555', fontSize: '0.9rem', marginBottom: '8px'}}>
                <strong>Vehicle:</strong> {rider.vehicle}<br/>
                <strong>Distance:</strong> {rider.dist}
              </p>

            </div>
          ))}
        </div>
      )}
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
        <h2>Rider Management</h2>
        <span>Available: {availableRiders.length}</span>
      </div>

      {notification && <div className="alert-success">🔔 {notification}</div>}

      {view === 'list' && renderList()}
      {view === 'assign-manual' && renderManualAssign()}
      {view === 'track' && renderTracking()}
    </div>
  );
};

export default Delivery;