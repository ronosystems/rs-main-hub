// /home/kk/RS/MAIN HUB/frontend/src/pages/StaffDashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// ✅ Removed unused useNavigate
import MainLayout from '../components/layout/MainLayout';
import { companyService } from '../services/companyService';
import './Dashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth(); // ✅ Removed unused logout
  // ✅ Removed unused navigate
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  // ✅ Removed unused selectedCompany
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Guest', message: 'Hello, I need help with my order', time: '10:30 AM' },
    { id: 2, sender: 'Staff', message: 'Hi! How can I help you?', time: '10:32 AM' },
    { id: 3, sender: 'Guest', message: 'My order #1234 hasn\'t been delivered yet', time: '10:35 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies();
      setCompanies(data.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Removed unused handleLogout function

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      sender: 'Staff',
      message: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages([...chatMessages, message]);
    setNewMessage('');
    
    // Simulate guest reply
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        sender: 'Guest',
        message: 'Thank you for your help! I\'ll wait for the update.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, reply]);
    }, 2000);
  };

  // Stats
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;

  if (loading) {
    return (
      <MainLayout title="Staff Dashboard" breadcrumbs={['Home', 'Staff']}>
        <div className="loading-state">Loading dashboard...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Staff Dashboard" breadcrumbs={['Home', 'Staff']}>
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p>Your daily tasks and operations for: <strong>{user?.company?.name || 'Your Company'}</strong></p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalCompanies}</div>
            <div className="stat-label">Assigned Companies</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeCompanies}</div>
            <div className="stat-label">Active Companies</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{chatMessages.length}</div>
            <div className="stat-label">Chat Messages</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">✅</div>
            <div className="stat-label">On Track</div>
          </div>
        </div>

        {/* Assigned Companies */}
        <div className="section">
          <h2 className="section-title">🏢 Assigned Companies</h2>
          <div className="companies-grid">
            {companies.length === 0 ? (
              <div className="no-data-message">
                <p>No companies assigned to you yet.</p>
              </div>
            ) : (
              companies.map((company) => (
                <div key={company._id} className="company-card">
                  <div className="company-header">
                    <h3>{company.name}</h3>
                    <span className={`company-status ${company.status}`}>
                      {company.status}
                    </span>
                  </div>
                  <p>Project: {company.project?.name || 'No Project'}</p>
                  <p>Users: {company.userCount || 0}</p>
                  <div className="company-actions">
                    <button className="btn-primary" onClick={() => {/* View details */}}>
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Support */}
        <div className="section">
          <h2 className="section-title">💬 Live Chat Support</h2>
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-info">
                <span className="chat-status online">●</span>
                <span className="chat-title">Support Chat</span>
                <span className="chat-badge">{chatMessages.filter(m => m.sender === 'Guest').length} guests</span>
              </div>
            </div>
            
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender === 'Staff' ? 'staff' : 'guest'}`}>
                  <div className="message-content">
                    <div className="message-sender">{msg.sender}</div>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="chat-input"
              />
              <button type="submit" className="btn-send">
                <i className="fas fa-paper-plane"></i> Send
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        /* Company Cards */
        .company-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .company-header h3 {
          margin: 0;
          color: #1a1a2e;
        }

        .company-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .company-status.active {
          background: #c6f6d5;
          color: #276749;
        }

        .company-status.inactive {
          background: #fed7d7;
          color: #9b2c2c;
        }

        .company-actions {
          margin-top: 10px;
        }

        .company-actions .btn-primary {
          padding: 6px 16px;
          font-size: 0.85rem;
        }

        /* Chat Container */
        .chat-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 500px;
        }

        .chat-header {
          padding: 15px 20px;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-status {
          font-size: 0.6rem;
          color: #28a745;
        }

        .chat-title {
          font-weight: 600;
          color: #1a1a2e;
        }

        .chat-badge {
          background: #00d4ff;
          color: white;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          max-height: 300px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 5px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: #f7fafc;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #00d4ff;
          border-radius: 10px;
        }

        .chat-message {
          display: flex;
          flex-direction: column;
          max-width: 75%;
        }

        .chat-message.staff {
          align-self: flex-end;
        }

        .chat-message.guest {
          align-self: flex-start;
        }

        .message-content {
          padding: 10px 15px;
          border-radius: 12px;
          background: #f7fafc;
        }

        .chat-message.staff .message-content {
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          color: white;
        }

        .chat-message.guest .message-content {
          background: #f0f0f0;
        }

        .message-sender {
          font-size: 0.7rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: #718096;
        }

        .chat-message.staff .message-sender {
          color: rgba(255, 255, 255, 0.8);
        }

        .message-text {
          font-size: 0.95rem;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 0.65rem;
          color: #a0aec0;
          margin-top: 4px;
          text-align: right;
        }

        .chat-message.staff .message-time {
          color: rgba(255, 255, 255, 0.6);
        }

        .chat-input-form {
          display: flex;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f7fafc;
        }

        .chat-input {
          flex: 1;
          padding: 10px 15px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .chat-input:focus {
          outline: none;
          border-color: #00d4ff;
        }

        .btn-send {
          padding: 10px 20px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-send:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
        }

        .btn-send i {
          font-size: 0.9rem;
        }

        .no-data-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px;
          background: white;
          border-radius: 12px;
          color: #718096;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .chat-message {
            max-width: 85%;
          }
          .chat-input-form {
            flex-direction: column;
          }
          .btn-send {
            justify-content: center;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default StaffDashboard;