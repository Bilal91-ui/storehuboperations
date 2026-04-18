// ReportsAnalytics.jsx
import React, { useState } from 'react';
import './reportsAnalytics.css';
import './adminDashboard.css'; // Reuse generic admin styles

const ReportsAnalytics = () => {
  // --- STATE ---
  const [reportType, setReportType] = useState('sales'); // sales, users, vendors, products
  const [dateRange, setDateRange] = useState('7days'); // 7days, 30days, custom
  const [loading, setLoading] = useState(false);
  
  // Mock Data Holder
  const [reportData, setReportData] = useState(null);

  // --- MOCK DATA GENERATORS ---
  
  const generateSalesData = () => ({
    summary: { total: 'PKR 15,400', orders: 342, avg: 'PKR 45.02' },
    chart: [45, 60, 35, 80, 50, 90, 70], // Last 7 days
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    table: [
      { id: 1, date: '2025-03-01', revenue: 'PKR 2,400', orders: 55, topItem: 'Burger' },
      { id: 2, date: '2025-03-02', revenue: 'PKR 3,100', orders: 62, topItem: 'Pizza' },
      { id: 3, date: '2025-03-03', revenue: 'PKR 1,800', orders: 40, topItem: 'Sushi' },
      { id: 4, date: '2025-03-04', revenue: 'PKR 4,500', orders: 95, topItem: 'Steak' },
    ]
  });

  const generateUserData = () => ({
    summary: { total: '1,204', active: '850', new: '120' },
    chart: [10, 15, 8, 20, 25, 12, 30], // New users
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    table: [
      { id: 1, user: 'John Doe', role: 'Customer', joined: '2025-03-01', status: 'Active' },
      { id: 2, user: 'Jane Smith', role: 'Vendor', joined: '2025-03-02', status: 'Pending' },
      { id: 3, user: 'Mike Ross', role: 'Rider', joined: '2025-03-03', status: 'Active' },
    ]
  });

  // --- HANDLERS ---

  // 5. System generates the report
  const handleGenerateReport = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (reportType === 'sales') setReportData(generateSalesData());
      else if (reportType === 'users') setReportData(generateUserData());
      else setReportData(generateSalesData()); // Default fallback
      setLoading(false);
    }, 800);
  };

  // 6. Export Functions
  const handleExport = (format) => {
    if (!reportData) return alert("Please generate a report first.");
    
    if (format === 'csv') {
      // Simple CSV export logic
      const header = Object.keys(reportData.table[0]).join(',') + '\n';
      const rows = reportData.table.map(obj => Object.values(obj).join(',')).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.csv`;
      a.click();
    } else {
      alert(`Exporting ${reportType} report as ${format.toUpperCase()}... (Simulation)`);
    }
  };

  // Initialize data on load
  useState(() => {
    handleGenerateReport();
  }, []);

  // --- RENDER HELPERS ---

  const renderSummary = () => {
    if (!reportData) return null;
    return (
      <div className="summary-grid">
        {Object.entries(reportData.summary).map(([key, val]) => (
          <div key={key} className="summary-card">
            <div className="summary-label">{key.toUpperCase()}</div>
            <div className="summary-val">{val}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    if (!reportData) return null;
    const maxVal = Math.max(...reportData.chart);
    return (
      <div className="chart-container">
        <div className="chart-title">Trend Analysis ({dateRange})</div>
        <div className="chart-bars">
          {reportData.chart.map((val, idx) => (
            <div 
              key={idx} 
              className="chart-bar" 
              style={{ height: `${(val / maxVal) * 100}%` }}
            >
              <div className="bar-tooltip">{val}</div>
              <div className="bar-label">{reportData.labels[idx]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!reportData) return null;
    const headers = Object.keys(reportData.table[0]);
    return (
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              {headers.map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {reportData.table.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2 className="section-title" style={{margin:0, border:0, padding:0}}>Reports & Analytics</h2>
      </div>

      {/* 3. & 4. Controls & Parameters */}
      <div className="controls-panel">
        <div className="control-group">
          <label>Report Category</label>
          <select 
            className="control-select" 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="sales">Sales Performance</option>
            <option value="users">User Growth</option>
            <option value="vendors">Vendor Performance</option>
            <option value="products">Product Trends</option>
          </select>
        </div>

        <div className="control-group">
          <label>Date Range</label>
          <select 
            className="control-select" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Optional Filter based on type */}
        {reportType === 'sales' && (
          <div className="control-group">
            <label>Filter By Status</label>
            <select className="control-select">
              <option>All Orders</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        )}

        <button className="btn-generate" onClick={handleGenerateReport}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* 6. View & Analyze */}
      {!loading && reportData ? (
        <>
          {renderSummary()}
          {renderChart()}
          
          <h3 style={{color:'#334155', marginBottom:'15px'}}>Detailed Data</h3>
          {renderTable()}

          {/* 6. Export Options */}
          <div className="export-actions">
            <button className="btn-export" onClick={() => handleExport('csv')}>
              📄 CSV
            </button>
            <button className="btn-export" onClick={() => handleExport('excel')}>
              📊 Excel
            </button>
            <button className="btn-export" onClick={() => handleExport('pdf')}>
              📑 PDF
            </button>
          </div>
        </>
      ) : (
        <div style={{textAlign:'center', padding:'50px', color:'#94a3b8'}}>
          {loading ? 'Processing data...' : 'Select parameters and click Generate Report.'}
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;