// Communication.jsx
import React, { useState } from 'react';
import './communication.css';
import './sellerDashboard.css';

const Communication = () => {
  // 1. Mock Data: Message Threads
  const [threads, setThreads] = useState([
    {
      id: 1,
      customer: 'Alice Johnson',
      subject: 'Damaged Item received',
      status: 'Pending',
      lastUpdate: '10:30 AM',
      messages: [
        { sender: 'customer', text: 'Hi, I received my order #101 but the packaging is torn.', time: '10:30 AM' }
      ]
    },
    {
      id: 2,
      customer: 'Bob Smith',
      subject: 'Inquiry about bulk pricing',
      status: 'Resolved',
      lastUpdate: 'Yesterday',
      messages: [
        { sender: 'customer', text: 'Do you offer discounts for bulk orders?', time: 'Yesterday 2:00 PM' },
        { sender: 'vendor', text: 'Yes, for orders over 50 units we offer 10% off.', time: 'Yesterday 2:30 PM' },
        { sender: 'customer', text: 'Great, thanks!', time: 'Yesterday 2:45 PM' }
      ]
    },
    {
      id: 3,
      customer: 'Charlie Brown',
      subject: 'Wrong color delivered',
      status: 'Pending',
      lastUpdate: '2 days ago',
      messages: [
        { sender: 'customer', text: 'I ordered Black but got Blue.', time: 'Mon 9:00 AM' }
      ]
    }
  ]);

  const [activeId, setActiveId] = useState(1);
  const [replyText, setReplyText] = useState('');

  // Helper: Get active thread object
  const activeThread = threads.find(t => t.id === activeId);

  // --- HANDLERS ---

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMessage = {
      sender: 'vendor',
      text: replyText,
      time: 'Just now'
    };

    const updatedThreads = threads.map(t => 
      t.id === activeId 
      ? { ...t, messages: [...t.messages, newMessage], lastUpdate: 'Just now' }
      : t
    );

    setThreads(updatedThreads);
    setReplyText('');
  };

  const handleResolve = () => {
    const updatedThreads = threads.map(t => 
      t.id === activeId ? { ...t, status: 'Resolved' } : t
    );
    setThreads(updatedThreads);
    alert('Inquiry marked as Resolved.');
  };

  const handleCallbackRequest = () => {
    const confirm = window.confirm(`Request a Call-Back for ${activeThread.customer}?`);
    if (confirm) {
        const sysMsg = {
            sender: 'vendor',
            text: '📞 Call-back request initiated. A support agent will call you shortly.',
            time: 'Just now'
        };
        const updatedThreads = threads.map(t => 
            t.id === activeId 
            ? { ...t, messages: [...t.messages, sysMsg], lastUpdate: 'Just now' }
            : t
        );
        setThreads(updatedThreads);
    }
  };

  return (
    <div className="dashboard-section" style={{padding:0, border:'none', boxShadow:'none', background:'transparent'}}>
      <h2 style={{marginBottom: '15px'}}>Customer Communication</h2>
      
      <div className="comm-container">
        {/* Sidebar List */}
        <div className="comm-sidebar">
          <div className="comm-header">
            Messages ({threads.filter(t => t.status === 'Pending').length} Pending)
          </div>
          <div className="msg-list">
            {threads.map(thread => (
              <div 
                key={thread.id} 
                className={`msg-item ${activeId === thread.id ? 'active' : ''}`}
                onClick={() => setActiveId(thread.id)}
              >
                <div className="msg-top">
                  <span className="msg-name">
                    <span className={`status-dot ${thread.status === 'Pending' ? 'dot-pending' : 'dot-resolved'}`}></span>
                    {thread.customer}
                  </span>
                  <span className="msg-date">{thread.lastUpdate}</span>
                </div>
                <div style={{fontWeight: 'bold', fontSize: '0.8rem', marginBottom:'3px'}}>{thread.subject}</div>
                <div className="msg-preview">
                  {thread.messages[thread.messages.length - 1].text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="comm-chat-area">
          {activeThread ? (
            <>
              <div className="chat-header">
                <div>
                  <strong>{activeThread.customer}</strong>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>Subject: {activeThread.subject}</div>
                </div>
                <div>
                  {activeThread.status === 'Pending' && (
                    <button className="submit-button" style={{fontSize: '0.8rem', padding:'5px 10px'}} onClick={handleResolve}>
                       ✅ Mark Resolved
                    </button>
                  )}
                  {activeThread.status === 'Resolved' && (
                     <span className="status-badge status-delivered">Resolved</span>
                  )}
                </div>
              </div>

              <div className="chat-messages">
                {activeThread.messages.map((msg, index) => (
                  <div key={index} className={`bubble ${msg.sender === 'customer' ? 'bubble-customer' : 'bubble-vendor'}`}>
                    {msg.text}
                    <span className="bubble-time">{msg.time}</span>
                  </div>
                ))}
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <button type="button" className="btn-callback" title="Request Call Back" onClick={handleCallbackRequest}>📞 Call Back</button>
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder="Type your reply..." 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button type="submit" className="btn-send">Send</button>
              </form>
            </>
          ) : (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>
                Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication;