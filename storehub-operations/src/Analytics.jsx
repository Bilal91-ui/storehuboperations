// Analytics.jsx
import React, { useState, useEffect } from 'react';
import './analytics.css';
import './sellerDashboard.css';

const Analytics = () => {
  // 1. State for Time Range
  const [range, setRange] = useState('monthly'); // 'daily', 'weekly', 'monthly'
  const [loading, setLoading] = useState(false);

  // 2. Mock Data Objects for different ranges
  const dataMap = {
    daily: {
      sales: 450,
      orders: 12,
      avgOrder: 37.50,
      trend: '+5% vs yesterday',
      peakHour: '18:00 (6 PM)',
      topProducts: [
        { name: 'Coffee Beans', qty: 5 },
        { name: 'Muffin', qty: 4 },
        { name: 'Iced Tea', qty: 3 }
      ],
      chartData: [20, 45, 30, 80, 50, 90, 40] // Hourly distribution
    },
    weekly: {
      sales: 3200,
      orders: 85,
      avgOrder: 37.65,
      trend: '+12% vs last week',
      peakHour: 'Friday 7 PM',
      topProducts: [
        { name: 'Wireless Headphones', qty: 20 },
        { name: 'Smart Watch', qty: 15 },
        { name: 'USB Cable', qty: 12 }
      ],
      chartData: [400, 600, 450, 700, 800, 950, 600] // Daily distribution
    },
    monthly: {
      sales: 12500,
      orders: 340,
      avgOrder: 36.76,
      trend: '+8% vs last month',
      peakHour: 'Weekends 2 PM',
      topProducts: [
        { name: 'Wireless Headphones', qty: 85 },
        { name: 'Gaming Mouse', qty: 60 },
        { name: 'Mechanical Keyboard', qty: 45 }
      ],
      chartData: [2500, 3200, 2800, 4000] // Weekly distribution
    }
  };

  // 3. Current Data State
  const [data, setData] = useState(dataMap.monthly);

  // 4. Handle Range Change (Simulate API Call)
  const handleRangeChange = (newRange) => {
    setLoading(true);
    setRange(newRange);
    
    // Fake loading delay
    setTimeout(() => {
      setData(dataMap[newRange]);
      setLoading(false);
    }, 600);
  };

  // 5. Handle Export
  const handleExport = () => {
    const csvContent = `data:text/csv;charset=utf-8,Metric,Value\nTotal Sales,${data.sales}\nTotal Orders,${data.orders}\nTop Product,${data.topProducts[0].name}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    alert(`Report for ${range} exported successfully!`);
  };

  // Helper to get labels based on range
  const getChartLabels = () => {
    if (range === 'daily') return ['10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
    if (range === 'weekly') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  };

  const chartLabels = getChartLabels();

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h2>Sales Reports & Analytics</h2>
          <p style={{color:'#666', fontSize:'0.9rem', margin:0}}>Overview of your store performance</p>
        </div>
        <div style={{display:'flex', gap:'15px'}}>
          <div className="range-controls">
            <button className={`range-btn ${range === 'daily' ? 'active' : ''}`} onClick={() => handleRangeChange('daily')}>Daily</button>
            <button className={`range-btn ${range === 'weekly' ? 'active' : ''}`} onClick={() => handleRangeChange('weekly')}>Weekly</button>
            <button className={`range-btn ${range === 'monthly' ? 'active' : ''}`} onClick={() => handleRangeChange('monthly')}>Monthly</button>
          </div>
          <button className="submit-button" onClick={handleExport} style={{height:'100%'}}>📥 Export Report</button>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:'center', padding:'50px', color:'#666'}}>Generating Report...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Sales</h3>
              <div className="metric-value">${data.sales.toLocaleString()}</div>
              <div className="metric-trend" style={{color:'green'}}>{data.trend}</div>
            </div>
            <div className="metric-card">
              <h3>Total Orders</h3>
              <div className="metric-value">{data.orders}</div>
              <div className="metric-trend" style={{color:'green'}}>Completed Orders</div>
            </div>
            <div className="metric-card">
              <h3>Avg. Order Value</h3>
              <div className="metric-value">${data.avgOrder}</div>
              <div className="metric-trend" style={{color:'#666'}}>Per Customer</div>
            </div>
          </div>

          {/* Charts & Insights */}
          <div className="charts-section">
            
            {/* Main Chart */}
            <div className="chart-box">
              <h4 style={{margin:0}}>Sales Trends ({range})</h4>
              <div className="bar-chart">
                {data.chartData.map((val, idx) => {
                   const maxVal = Math.max(...data.chartData);
                   const heightPct = (val / maxVal) * 100;
                   return (
                     <div key={idx} className="bar" style={{height: `${heightPct}%`}}>
                       <span style={{bottom: '-25px'}}>{chartLabels[idx]}</span>
                     </div>
                   );
                })}
              </div>
            </div>

            {/* Sidebar Insights */}
            <div className="insights-box">
              <h4 style={{marginTop:0}}>🏆 Best Selling Products</h4>
              <ul className="top-list">
                {data.topProducts.map((prod, index) => (
                  <li key={index}>
                    <span>{prod.name}</span>
                    <strong>{prod.qty} sold</strong>
                  </li>
                ))}
              </ul>

              <h4 style={{marginTop:'30px'}}>⏰ Peak Sales Hours</h4>
              <div style={{background:'#e3f2fd', color:'#0d47a1', padding:'10px', borderRadius:'4px', textAlign:'center', fontWeight:'bold'}}>
                {data.peakHour}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;