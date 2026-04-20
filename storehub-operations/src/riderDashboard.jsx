// RiderDashboard.jsx
import React, { useState, useEffect } from 'react';
import './riderDashboard.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RiderDashboard = ({ onLogout }) => {
  // --- GLOBAL STATE ---
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('new'); 
  const [selectedTask, setSelectedTask] = useState(null); // Task Modal
  const [selectedTxn, setSelectedTxn] = useState(null);   // Transaction Modal

  // --- DATA: NEW TASKS ---
  const [tasks, setTasks] = useState([]);
  //new code
const riderId = localStorage.getItem("user_id"); // Get logged in rider ID

  // --- FETCH INITIAL TASKS & LISTEN FOR REAL-TIME ---
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/rider/available-tasks');
        setTasks(response.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks();

    // Socket: Listen for new orders placed by customers
    socket.on("new_order_available", (newOrder) => {
      setTasks((prev) => [newOrder, ...prev]);
    });

    // Socket: Remove order if another rider accepts it
    socket.on("task_taken", (orderId) => {
      setTasks((prev) => prev.filter(t => t.id !== orderId));
    });

    return () => {
      socket.off("new_order_available");
      socket.off("task_taken");
    };
  }, []);

  // --- DATA: EARNINGS HISTORY (Req 5 & 6) ---
  const [earningsFilter, setEarningsFilter] = useState('weekly');
  const [historyData, setHistoryData] = useState([
    { id: 901, date: '2025-10-26', time: '14:30', dist: '3.2 km', base: 4.50, bonus: 1.00, cod: 0, type: 'Payout', status: 'Settled' },
    { id: 902, date: '2025-10-26', time: '16:45', dist: '5.1 km', base: 8.20, bonus: 0, cod: 0, type: 'Payout', status: 'Processing' },
    { id: 903, date: '2025-10-25', time: '12:15', dist: '2.0 km', base: 0, bonus: 0, cod: 45.50, type: 'COD', status: 'Collected' },
    { id: 904, date: '2025-10-24', time: '19:20', dist: '4.5 km', base: 5.00, bonus: 2.50, cod: 0, type: 'Payout', status: 'Settled' },
  ]);

  // --- DATA: SCHEDULE ---
  const [schedule, setSchedule] = useState({
    Monday: { active: true, start: '09:00', end: '17:00' },
    Tuesday: { active: true, start: '09:00', end: '17:00' },
    Wednesday: { active: true, start: '09:00', end: '17:00' },
    Thursday: { active: true, start: '09:00', end: '17:00' },
    Friday: { active: true, start: '09:00', end: '17:00' },
    Saturday: { active: false, start: '10:00', end: '14:00' },
    Sunday: { active: false, start: '00:00', end: '00:00' },
  });

  // --- ACTIVE DELIVERY STATE ---
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState('accepted'); 
  const [navStatus, setNavStatus] = useState('idle'); 
  const [progress, setProgress] = useState(0); 
  const [enteredOtp, setEnteredOtp] = useState('');

  // --- SOCKET AND LOCATION ---
  const [socket, setSocket] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // --- HANDLERS: TASKS ---
  const handleViewDetails = (task) => setSelectedTask(task);
  const handleCloseModal = () => { setSelectedTask(null); setSelectedTxn(null); };

  //new code
  const handleAccept = async (task) => {
    try {
      // 1. Tell backend we accepted this task
      await axios.post('http://localhost:5000/api/rider/accept-task', {
        order_id: task.id,
        rider_id: riderId
      });

      // 2. Update UI (your existing logic)
      setCurrentDelivery(task);
      setDeliveryStatus('accepted');
      setNavStatus('idle'); setProgress(0); setEnteredOtp('');
      setTasks(tasks.filter(t => t.id !== task.id));
      setSelectedTask(null);
      setActiveTab('active');
      alert("Delivery task accepted successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Could not accept task.");
    }
  };

  const handleReject = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  // --- HANDLERS: NAVIGATION ---
  const startNavigation = () => {
    setNavStatus('calculating');
    setTimeout(() => setNavStatus('navigating'), 1000);
  };

  useEffect(() => {
    let interval;
    if (navStatus === 'navigating') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            if (deliveryStatus === 'accepted') handleStatusUpdate('arrived_store');
            else if (deliveryStatus === 'picked_up') handleStatusUpdate('arrived_customer');
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [navStatus, deliveryStatus]);

  // --- SOCKET AND LOCATION SETUP ---
  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const getSessionData = () => {
      const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
      if (!saved) return null;
      try {
        return JSON.parse(saved);
      } catch (parseError) {
        console.warn('Unable to parse login data from localStorage:', parseError);
        return null;
      }
    };

    newSocket.on('connect', () => {
      console.log('Rider socket connected:', newSocket.id);
      const riderData = getSessionData();
      if (riderData) {
        const { user_id, id, userId, seller_id } = riderData;
        newSocket.emit('rider_login', {
          user_id: user_id || userId || id,
          rider_id: seller_id || userId || id
        });
      }
    });

    newSocket.on('rider_order_assigned', (data) => {
      console.log('Rider assignment event received:', data);
      alert('A rider order assignment was received. Check the dashboard for details.');
    });

    // Get initial location
    if (navigator.geolocation) {
      const sendLocation = (loc) => {
        const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
        let userId = null;
        if (saved) {
          try {
            const riderData = JSON.parse(saved);
            userId = riderData.user_id || riderData.userId || riderData.id;
          } catch (err) {
            console.warn('Unable to parse user data for location update:', err);
          }
        }

        newSocket.emit('rider_location', {
          user_id: userId,
          riderId: userId || 'rider123',
          location: loc,
          timestamp: new Date().toISOString()
        });
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const loc = { lat: latitude, lng: longitude };
          setLocation(loc);
          setLocationError(null);
          sendLocation(loc);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get location. Please enable location services.');
        }
      );

      // Watch position for real-time updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const loc = { lat: latitude, lng: longitude };
          setLocation(loc);
          sendLocation(loc);
        },
        (error) => {
          console.error('Error watching position:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      // Cleanup
      return () => {
        newSocket.disconnect();
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleStatusUpdate = (newStatus) => {
    setDeliveryStatus(newStatus);
    setNavStatus('idle'); setProgress(0);
  };

  const proceedToNextStep = () => {
    switch (deliveryStatus) {
      case 'accepted': handleStatusUpdate('arrived_store'); break;
      case 'arrived_store': handleStatusUpdate('picked_up'); break;
      case 'picked_up': handleStatusUpdate('arrived_customer'); break;
      case 'arrived_customer':
        if (enteredOtp === currentDelivery.otp) {
          alert(`Success! Delivery verified. Earnings of ${currentDelivery.earnings} added.`);
          completeOrder();
        } else alert("Invalid OTP. (Mock: 1234)");
        break;
      default: break;
    }
  };

  const completeOrder = () => {
    // Add to history (Mock)
    const newTxn = {
      id: Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      dist: currentDelivery.distance,
      base: parseFloat(currentDelivery.earnings.replace('$','')),
      bonus: 0,
      cod: 0,
      type: 'Payout',
      status: 'Processing'
    };
    setHistoryData([newTxn, ...historyData]);

    setCurrentDelivery(null);
    setActiveTab('new');
    setDeliveryStatus('accepted'); setNavStatus('idle'); setProgress(0); setEnteredOtp('');
  };

  // --- HANDLERS: EARNINGS ---
  // Req 8: Download/Export Data
  const handleExport = () => {
    const csvHeader = "ID,Date,Time,Distance,Base Pay,Bonus,COD,Status\n";
    const csvRows = historyData.map(row => 
      `${row.id},${row.date},${row.time},${row.dist},${row.base},${row.bonus},${row.cod},${row.status}`
    ).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${earningsFilter}.csv`;
    a.click();
    alert("Earnings report downloaded successfully.");
  };

  // --- HANDLERS: SCHEDULE ---
  const handleScheduleChange = (day, field, value) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };
  const saveAvailability = () => alert("Availability updated successfully.");

  // --- RENDER FUNCTIONS ---

  const renderNewTasks = () => (
    <div>
      <h3 className="section-title">Available Deliveries Nearby</h3>
      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <div className="empty-state"><h3>No new tasks</h3><p>We will notify you when an order arrives.</p></div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header-row"><span className="task-id">Order #{task.ordernumber || task.id}</span><span className="task-earnings">{task.earnings}</span></div>
              <div className="route-details">
                <div className="route-row"><span className="route-icon">🏪</span><div className="route-text"><strong>{task.restaurant}</strong><span>{task.distance} away</span></div></div>
                <div className="route-row"><span className="route-icon">📍</span><div className="route-text"><strong>{task.dropoffAddr}</strong></div></div>
              </div>
              <div className="task-actions">
                <button className="btn" style={{background:'#e5e7eb', color:'#374151'}} onClick={() => handleViewDetails(task)}>Details</button>
                <button className="btn btn-primary" onClick={() => handleViewDetails(task)}>Accept/Reject</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderActiveDelivery = () => {
    if (!currentDelivery) return (
      <div className="empty-state"><h3>No Active Delivery</h3><button className="btn btn-primary" style={{marginTop:'15px', width:'auto'}} onClick={() => setActiveTab('new')}>Find Orders</button></div>
    );

    const isPickupLeg = (deliveryStatus === 'accepted' || deliveryStatus === 'arrived_store');
    const statusLabel = isPickupLeg ? "Pickup Phase" : "Delivery Phase";
    let btnText = "", btnClass = "btn-primary", showMapNav = false, showOtpInput = false;

    if (deliveryStatus === 'accepted') { btnText = "Arrived at Store (Manual)"; showMapNav = true; }
    else if (deliveryStatus === 'arrived_store') { btnText = "📦 Confirm Picked Up"; btnClass = "btn-warning"; }
    else if (deliveryStatus === 'picked_up') { btnText = "Arrived at Customer (Manual)"; showMapNav = true; }
    else if (deliveryStatus === 'arrived_customer') { btnText = "✅ Verify & Complete"; btnClass = "btn-success"; showOtpInput = true; }

    const isNavigating = navStatus === 'navigating';
    const isCalculating = navStatus === 'calculating';

    return (
      <div style={{maxWidth:'800px', margin:'0 auto'}}>
        <h3 className="section-title">{statusLabel}</h3>
        <div className="task-card">
          <div className="timeline">
            {['accepted','arrived_store','picked_up','arrived_customer'].map((step, i) => (
              <div key={step} className={`timeline-step ${['accepted','arrived_store','picked_up','arrived_customer'].indexOf(deliveryStatus) >= i ? 'active' : ''}`}>
                <div className="timeline-dot"></div> {step.replace('_',' ')}
              </div>
            ))}
          </div>

          {!showOtpInput && (
             <div className="map-box">
                {isCalculating && <div className="nav-overlay"><div className="spinner"></div><div>Calculating...</div></div>}
                <div className="map-label start">{isPickupLeg ? '🔵' : '🏪'} <span>{isPickupLeg ? 'Me' : 'Vendor'}</span></div>
                <div className="map-label end">{isPickupLeg ? '🏪' : '🏠'} <span>{isPickupLeg ? 'Vendor' : 'Customer'}</span></div>
                <div className="track-line"><div className="rider-emoji" style={{left: `${progress}%`, transition: isNavigating ? 'left 0.05s linear' : 'none'}}>🛵</div></div>
             </div>
          )}

          {showOtpInput && (
            <div className="verification-box">
              <label style={{display:'block', marginBottom:'10px', color:'#166534'}}>Enter Customer OTP</label>
              <input type="text" maxLength="4" className="otp-input" value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value)} placeholder="____" />
              <p style={{fontSize:'0.8rem', color:'#666'}}>Mock OTP: 1234</p>
            </div>
          )}

          <div className="route-details" style={{marginTop:'20px'}}>
             <p><strong>Order:</strong> #{currentDelivery.id}</p>
             <p><strong>Address:</strong> {isPickupLeg ? currentDelivery.pickupAddr : currentDelivery.dropoffAddr}</p>
          </div>

          <div style={{marginTop:'20px'}}>
            {showMapNav && navStatus === 'idle' && (
              <button className="btn btn-primary" style={{width:'100%', marginBottom:'10px'}} onClick={startNavigation}>📍 Start Navigation</button>
            )}
            <button className={`btn ${btnClass}`} style={{width:'100%'}} onClick={proceedToNextStep} disabled={isNavigating}>
              {isNavigating ? `Navigating...` : btnText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEarnings = () => {
    // Filter Logic (Req 4)
    const filteredData = historyData.filter(item => {
      if (earningsFilter === 'daily') return item.date === '2025-10-26';
      if (earningsFilter === 'weekly') return true; // simplified mock
      return true;
    });

    // Summary Calculations (Req 3)
    const totalEarnings = filteredData.reduce((sum, item) => sum + item.base + item.bonus, 0);
    const totalCod = filteredData.reduce((sum, item) => sum + item.cod, 0);

    return (
      <div style={{maxWidth: '1000px', margin: '0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h3 className="section-title" style={{marginBottom:0}}>Earnings & History</h3>
          <button className="export-btn" onClick={handleExport}>📥 Export CSV</button>
        </div>
        
        {/* Filters (Req 4) */}
        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
          {['daily', 'weekly', 'monthly'].map(f => (
            <button key={f} className={`btn ${earningsFilter === f ? 'btn-primary' : ''}`} style={{background: earningsFilter === f ? '' : '#e5e7eb', color: earningsFilter === f ? '' : '#374151', padding:'8px 16px'}} onClick={() => setEarningsFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Summary (Req 3) */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-title">Total Earnings</div><div className="stat-value" style={{color:'#10b981'}}>PKR {totalEarnings.toFixed(2)}</div></div>
          <div className="stat-card"><div className="stat-title">Completed Orders</div><div className="stat-value">{filteredData.length}</div></div>
          <div className="stat-card"><div className="stat-title">COD Collected</div><div className="stat-value" style={{color:'#f59e0b'}}>PKR {totalCod.toFixed(2)}</div></div>
        </div>

        {/* List (Req 5 & 6) */}
        <div className="task-card" style={{padding:0, overflow:'hidden'}}>
           <table className="history-table">
            <thead><tr><th>Date/Time</th><th>Order Info</th><th>Breakdown</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{fontWeight:'bold'}}>{item.date}</div>
                    <div style={{fontSize:'0.8rem', color:'#666'}}>{item.time}</div>
                  </td>
                  <td>
                    <div>Order #{item.id}</div>
                    <div style={{fontSize:'0.8rem', color:'#666'}}>{item.dist}</div>
                  </td>
                  <td>
                    {item.type === 'Payout' ? (
                      <div className="breakdown-cell">
                        <span className="text-base">Base: PKR {item.base.toFixed(2)}</span>
                        {item.bonus > 0 && <span className="text-bonus">+ Bonus: PKR {item.bonus.toFixed(2)}</span>}
                      </div>
                    ) : (
                      <span className="text-cod">COD: PKR {item.cod.toFixed(2)}</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${item.status === 'Settled' ? 'status-online' : 'status-offline'}`} style={{fontSize:'0.75rem', padding:'4px 8px', cursor:'default'}}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn" style={{padding:'5px 10px', fontSize:'0.8rem', background:'#f3f4f6'}} onClick={() => setSelectedTxn(item)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>
      </div>
    );
  };

  const renderAvailability = () => (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
      <h3 className="section-title">Availability & Schedule</h3>
      <div className="availability-card">
        <div className="status-toggle-large">
          <div><h3>Current Status: <span style={{color: isOnline ? '#10b981' : '#ef4444'}}>{isOnline ? 'Online' : 'Offline'}</span></h3><p>{isOnline ? 'You are visible for tasks.' : 'You are currently hidden.'}</p></div>
          <label className="switch"><input type="checkbox" checked={isOnline} onChange={() => setIsOnline(!isOnline)} /><span className="slider"></span></label>
        </div>
      </div>
      <div className="availability-card">
        <h3 style={{marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Weekly Schedule</h3>
        <div className="schedule-grid">
          {Object.keys(schedule).map(day => (
            <div key={day} className="day-row">
              <div className="day-name">{day}</div>
              {schedule[day].active ? (
                <><input type="time" className="time-input" value={schedule[day].start} onChange={(e) => handleScheduleChange(day, 'start', e.target.value)} /><span>to</span><input type="time" className="time-input" value={schedule[day].end} onChange={(e) => handleScheduleChange(day, 'end', e.target.value)} /></>
              ) : <span style={{color:'#9ca3af', fontStyle:'italic', flex:1}}>Unavailable</span>}
              <label className="switch" style={{transform: 'scale(0.8)'}}><input type="checkbox" checked={schedule[day].active} onChange={(e) => handleScheduleChange(day, 'active', e.target.checked)} /><span className="slider"></span></label>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{marginTop:'25px', width:'100%'}} onClick={saveAvailability}>Save Schedule</button>
      </div>
    </div>
  );

  const renderLocation = () => (
    <div>
      <h3 className="section-title">My Location</h3>
      {locationError ? (
        <div className="empty-state">
          <h3>Location Error</h3>
          <p>{locationError}</p>
        </div>
      ) : location ? (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4>Current Location</h4>
            <p>Latitude: {location.lat.toFixed(6)}</p>
            <p>Longitude: {location.lng.toFixed(6)}</p>
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
          <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  You are here!<br />
                  Lat: {location.lat.toFixed(6)}<br />
                  Lng: {location.lng.toFixed(6)}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Getting Location...</h3>
          <p>Please allow location access to track your position.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="rider-layout">
      <aside className="rider-sidebar">
        <div className="sidebar-brand"><h2>Rider Panel</h2></div>
        <nav className="sidebar-menu">
          <button className={`menu-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>📦 Available Tasks</button>
          <button className={`menu-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>🚀 Current Deliveries</button>
          <button className={`menu-item ${activeTab === 'location' ? 'active' : ''}`} onClick={() => setActiveTab('location')}>📍 My Location</button>
          <button className={`menu-item ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>💰 Earnings & History</button>
          <button className={`menu-item ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => setActiveTab('availability')}>📅 Availability</button>
        </nav>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>
      <main className="rider-main">
        <header className="rider-header">
          <div className="header-title"><h1>Rider Dashboard</h1></div>
          <div className="header-status">
             <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`} onClick={() => setIsOnline(!isOnline)}>
               <div className={`dot ${isOnline ? 'dot-green' : 'dot-red'}`}></div>{isOnline ? 'Online' : 'Offline'}
             </div>
          </div>
        </header>
        <div className="content-wrapper">
          {!isOnline && activeTab !== 'availability' ? (
            <div className="empty-state"><h3>You are Offline</h3><p>Go to Availability tab or toggle status to start.</p><button className="btn btn-primary" style={{marginTop:'15px', width:'auto'}} onClick={() => setActiveTab('availability')}>Go to Availability</button></div>
          ) : (
            activeTab === 'new' ? renderNewTasks() : activeTab === 'active' ? renderActiveDelivery() : activeTab === 'location' ? renderLocation() : activeTab === 'earnings' ? renderEarnings() : renderAvailability()
          )}
        </div>
      </main>

      {/* TASK MODAL */}
      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Order #{selectedTask.id}</h3><button className="close-btn" onClick={handleCloseModal}>&times;</button></div>
            <div className="detail-row"><span className="detail-label">Earnings</span><span className="detail-value" style={{color:'#10b981'}}>{selectedTask.earnings}</span></div>
            <div className="detail-row"><span className="detail-label">Vendor</span><div className="detail-value"><strong>{selectedTask.restaurant}</strong><br/><span>{selectedTask.pickupAddr}</span></div></div>
            <div className="detail-row"><span className="detail-label">Customer</span><div className="detail-value"><strong>{selectedTask.customer}</strong><br/><span>{selectedTask.dropoffAddr}</span></div></div>
            <div className="detail-row"><span className="detail-label">Items</span><div>{selectedTask.items.map((i,x)=><div key={x} style={{textAlign:'right'}}>{i.name} x{i.qty}</div>)}</div></div>
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
               <button className="btn btn-danger" onClick={() => handleReject(selectedTask.id)}>Reject</button>
               <button className="btn btn-success" onClick={() => handleAccept(selectedTask)}>Accept Task</button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAIL MODAL (Req 7) */}
      {selectedTxn && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Transaction Details</h3><button className="close-btn" onClick={handleCloseModal}>&times;</button></div>
            <div className="txn-row"><span className="txn-label">Transaction ID</span><span className="txn-val">TXN-{selectedTxn.id}99</span></div>
            <div className="txn-row"><span className="txn-label">Order ID</span><span className="txn-val">#{selectedTxn.id}</span></div>
            <div className="txn-row"><span className="txn-label">Date & Time</span><span className="txn-val">{selectedTxn.date} {selectedTxn.time}</span></div>
            <div className="txn-row"><span className="txn-label">Distance</span><span className="txn-val">{selectedTxn.dist}</span></div>
            <div className="txn-row"><span className="txn-label">Status</span><span className={`status-badge ${selectedTxn.status==='Settled'?'status-online':'status-offline'}`} style={{display:'inline-flex', padding:'2px 8px'}}>{selectedTxn.status}</span></div>
            
            <hr style={{border:'0', borderTop:'1px dashed #eee', margin:'15px 0'}}/>
            
            {selectedTxn.type === 'Payout' ? (
              <>
                <div className="txn-row"><span className="txn-label">Base Fare</span><span className="txn-val">PKR {selectedTxn.base.toFixed(2)}</span></div>
                <div className="txn-row"><span className="txn-label">Surge/Bonus</span><span className="txn-val" style={{color:'#10b981'}}>+ PKR {selectedTxn.bonus.toFixed(2)}</span></div>
                <div className="txn-total"><span>Total Payout</span><span>PKR {(selectedTxn.base + selectedTxn.bonus).toFixed(2)}</span></div>
              </>
            ) : (
              <>
                 <div className="txn-row"><span className="txn-label">Cash Collected</span><span className="txn-val">PKR {selectedTxn.cod.toFixed(2)}</span></div>
                 <div className="txn-total" style={{color:'#f59e0b'}}><span>Amount Owed</span><span>- PKR {selectedTxn.cod.toFixed(2)}</span></div>
              </>
            )}
            
            <button className="btn btn-primary" style={{marginTop:'20px', width:'100%'}} onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;