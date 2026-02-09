// SystemMonitoring.jsx
import React, { useState, useEffect, useRef } from 'react';
import './systemMonitoring.css';
import './adminDashboard.css'; // Reuse generic admin styles

const SystemMonitoring = () => {
  // --- STATE ---
  
  // 3. Performance Metrics
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 60,
    disk: 35,
    uptime: '14d 03h 22m',
    status: 'Operational'
  });

  // 3. Logs Data
  const [logs, setLogs] = useState([
    { id: 1, ts: '2025-03-05 10:00:01', level: 'INFO', msg: 'System backup completed successfully.' },
    { id: 2, ts: '2025-03-05 10:05:23', level: 'WARN', msg: 'High latency detected on API Gateway (400ms).' },
    { id: 3, ts: '2025-03-05 10:12:45', level: 'INFO', msg: 'User login attempt: Admin_01 (Success).' },
    { id: 4, ts: '2025-03-05 10:15:00', level: 'ERROR', msg: 'Payment Gateway Timeout: Stripe API not responding.' },
    { id: 5, ts: '2025-03-05 10:20:11', level: 'INFO', msg: 'Cron job [OrderSync] executed.' },
  ]);

  const [activeLogTab, setActiveLogTab] = useState('ALL'); // ALL, ERROR, WARN, INFO, ADMIN
  const logsEndRef = useRef(null);

  // --- EFFECTS ---

  // Simulate Live Metrics (Step 3)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(20, prev.memory + (Math.random() * 5 - 2))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- HANDLERS ---

  // 6. Log Admin Actions
  const addLog = (level, msg) => {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    const newLog = { id: Date.now(), ts: now, level, msg };
    setLogs(prev => [...prev, newLog]);
  };

  // 5. Admin Actions
  const handleRestart = () => {
    if (window.confirm("Are you sure you want to restart the web services? This may cause brief downtime.")) {
      addLog('ADMIN', 'Initiated System Restart: Web Services');
      alert("Restart command sent. Services rebooting...");
    }
  };

  const handleClearCache = () => {
    addLog('ADMIN', 'Cleared Redis Cache');
    alert("System Cache Cleared.");
  };

  const handleEscalate = () => {
    const note = prompt("Enter escalation note for IT Support:");
    if (note) {
      addLog('ADMIN', `Security Alert Escalated: ${note}`);
      alert("Ticket #9921 created and sent to IT Security Team.");
    }
  };

  // Filter Logic (Step 4)
  const filteredLogs = activeLogTab === 'ALL' 
    ? logs 
    : logs.filter(l => l.level === activeLogTab);

  // --- RENDER ---
  return (
    <div className="monitor-container">
      <div className="monitor-header">
        <h2 className="section-title" style={{margin:0, border:0, padding:0}}>System Monitoring</h2>
        <div className="server-status">
          <div className="pulse-dot"></div>
          {metrics.status}
        </div>
      </div>

      {/* 3. Performance Metrics */}
      <div className="metrics-row">
        <div className="metric-box">
          <div className="metric-label">CPU Usage</div>
          <div className="metric-number">{Math.floor(metrics.cpu)}%</div>
          <div className="bar-container">
            <div className={`bar-fill ${metrics.cpu > 80 ? 'crit' : metrics.cpu > 60 ? 'warn' : ''}`} style={{width: `${metrics.cpu}%`}}></div>
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Memory Usage</div>
          <div className="metric-number">{Math.floor(metrics.memory)}%</div>
          <div className="bar-container">
            <div className={`bar-fill ${metrics.memory > 85 ? 'crit' : ''}`} style={{width: `${metrics.memory}%`}}></div>
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Disk Space</div>
          <div className="metric-number">{metrics.disk}%</div>
          <div className="bar-container">
            <div className="bar-fill" style={{width: `${metrics.disk}%`}}></div>
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-label">System Uptime</div>
          <div className="metric-number" style={{fontSize:'1.5rem', marginTop:'5px'}}>{metrics.uptime}</div>
          <div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'5px'}}>Last reboot: 14 days ago</div>
        </div>
      </div>

      {/* 4. Logs Review */}
      <h3 style={{color:'#334155', marginBottom:'15px'}}>System Logs & Events</h3>
      <div className="logs-panel">
        <div className="logs-header">
          <div className="log-tabs">
            {['ALL', 'INFO', 'WARN', 'ERROR', 'ADMIN'].map(tab => (
              <button 
                key={tab} 
                className={`log-tab ${activeLogTab === tab ? 'active' : ''}`}
                onClick={() => setActiveLogTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="btn-sm btn-outline" onClick={() => {
             const blob = new Blob([JSON.stringify(logs, null, 2)], {type : 'application/json'});
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a'); a.href = url; a.download = 'system_logs.json'; a.click();
          }}>Download Logs</button>
        </div>
        
        <div className="log-console">
          {filteredLogs.map(log => (
            <div key={log.id} className="log-line">
              <span className="log-ts">{log.ts}</span>
              <span className={`log-lvl lvl-${log.level}`}>[{log.level}]</span>
              <span className="log-msg">{log.msg}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* 5. Admin Actions */}
      <h3 style={{color:'#334155', marginTop:'30px'}}>Maintenance Actions</h3>
      <div className="maintenance-grid">
        <button className="maint-btn" onClick={handleClearCache}>
          <span className="maint-title">🧹 Clear System Cache</span>
          <span className="maint-desc">Purge Redis and temporary files.</span>
        </button>
        <button className="maint-btn" onClick={handleEscalate}>
          <span className="maint-title">🛡️ Escalate Security Alert</span>
          <span className="maint-desc">Notify IT Security of suspicious activity.</span>
        </button>
        <button className="maint-btn danger" onClick={handleRestart}>
          <span className="maint-title">⚠️ Restart Services</span>
          <span className="maint-desc">Reboot web server and API nodes.</span>
        </button>
      </div>

    </div>
  );
};

export default SystemMonitoring;