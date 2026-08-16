// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Support.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { FaArrowLeft, FaEnvelope, FaPhone, FaWhatsapp, FaClock, FaHeadset, FaQuestionCircle, FaFileAlt, FaVideo, FaBook, FaLifeRing } from 'react-icons/fa';
import './Support.css';

const Support = () => {
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: <FaEnvelope />,
      title: 'Email Support',
      description: 'Get help via email',
      action: 'mailto:support@ronosystems.com',
      buttonText: 'Send Email',
      color: '#0d6efd'
    },
    {
      icon: <FaWhatsapp />,
      title: 'WhatsApp',
      description: 'Chat with us on WhatsApp',
      action: 'https://wa.me/254722527955',
      buttonText: 'Chat Now',
      color: '#25d366'
    },
    {
      icon: <FaPhone />,
      title: 'Phone Support',
      description: 'Call our support team',
      action: 'tel:+254722527955',
      buttonText: 'Call Now',
      color: '#dc3545'
    },
    {
      icon: <FaHeadset />,
      title: 'Live Chat',
      description: 'Chat with a support agent',
      action: '#',
      buttonText: 'Start Chat',
      color: '#6c5ce7'
    }
  ];

  const helpTopics = [
    {
      icon: <FaQuestionCircle />,
      title: 'FAQ',
      description: 'Frequently asked questions',
      link: '/support/faq'
    },
    {
      icon: <FaFileAlt />,
      title: 'Documentation',
      description: 'Read our documentation',
      link: '/support/docs'
    },
    {
      icon: <FaVideo />,
      title: 'Video Tutorials',
      description: 'Watch video guides',
      link: '/support/videos'
    },
    {
      icon: <FaBook />,
      title: 'User Guide',
      description: 'Download user guide',
      link: '/support/guide'
    }
  ];

  return (
    <MainLayout title="Support" breadcrumbs={['Home', 'Support']}>
      <div className="support-page">
        <div className="support-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <div className="support-header-content">
            <div className="support-header-icon">
              <FaLifeRing />
            </div>
            <div>
              <h2>Help & Support</h2>
              <p>How can we help you today?</p>
            </div>
          </div>
        </div>

        <div className="support-grid">
          {/* Support Options */}
          <div className="support-section">
            <h3>📞 Contact Us</h3>
            <div className="support-options-grid">
              {supportOptions.map((option, index) => (
                <div key={index} className="support-card">
                  <div className="support-card-icon" style={{ background: option.color }}>
                    {option.icon}
                  </div>
                  <h4>{option.title}</h4>
                  <p>{option.description}</p>
                  <a 
                    href={option.action} 
                    className="support-btn"
                    style={{ borderColor: option.color, color: option.color }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {option.buttonText}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Help Topics */}
          <div className="support-section">
            <h3>📚 Help Topics</h3>
            <div className="help-topics-grid">
              {helpTopics.map((topic, index) => (
                <div key={index} className="help-card" onClick={() => navigate(topic.link)}>
                  <div className="help-card-icon">{topic.icon}</div>
                  <h4>{topic.title}</h4>
                  <p>{topic.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Hours */}
          <div className="support-section support-hours">
            <h3>🕐 Support Hours</h3>
            <div className="hours-grid">
              <div className="hour-item">
                <span className="day">Monday - Friday</span>
                <span className="time">8:00 AM - 10:00 PM EAT</span>
              </div>
              <div className="hour-item">
                <span className="day">Saturday</span>
                <span className="time">9:00 AM - 6:00 PM EAT</span>
              </div>
              <div className="hour-item">
                <span className="day">Sunday</span>
                <span className="time">10:00 AM - 4:00 PM EAT</span>
              </div>
              <div className="hour-item">
                <span className="day">Holidays</span>
                <span className="time">Closed</span>
              </div>
            </div>
            <div className="support-info">
              <FaClock className="info-icon" />
              <span>Response time: Within 24 hours</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="support-section quick-actions">
            <h3>⚡ Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('/settings')}>
                <span className="action-icon">⚙️</span>
                <span>Settings</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/profile')}>
                <span className="action-icon">👤</span>
                <span>My Profile</span>
              </button>
              <button className="quick-action-btn" onClick={() => window.open('mailto:support@ronosystems.com', '_blank')}>
                <span className="action-icon">📧</span>
                <span>Email Us</span>
              </button>
              <button className="quick-action-btn" onClick={() => window.open('https://wa.me/254722527955', '_blank')}>
                <span className="action-icon">💬</span>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Support;