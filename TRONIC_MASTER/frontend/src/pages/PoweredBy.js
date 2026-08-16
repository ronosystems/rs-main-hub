// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/PoweredBy.js

import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import './PoweredBy.css';

const PoweredBy = () => {

  // Handle social media button clicks
  const handleSocialClick = (platform) => {
    console.log(`Social media ${platform} clicked`);
    // Add actual URLs here later
    const socialUrls = {
      Facebook: 'https://facebook.com/rsafrica',
      Twitter: 'https://twitter.com/rsafrica',
      LinkedIn: 'https://linkedin.com/company/rsafrica',
      YouTube: 'https://youtube.com/rsafrica',
      Instagram: 'https://instagram.com/rsafrica',
      WhatsApp: 'https://wa.me/254722527955'
    };
    if (socialUrls[platform]) {
      window.open(socialUrls[platform], '_blank');
    }
  };

  return (
    <MainLayout title="Powered By RS Africa" breadcrumbs={['Home', 'Powered By']}>
      <div className="powered-by-page">
        {/* ============================================ */}
        {/* HERO SECTION */}
        {/* ============================================ */}
        <section className="powered-hero">
          <div className="powered-hero-content">
            <div className="powered-hero-icon">🚀</div>
            <h1>Powered By</h1>
            <h2 className="powered-hero-brand">RS Africa</h2>
            <p className="powered-hero-subtitle">
              Your trusted partner in business technology solutions
            </p>
            <div className="powered-hero-buttons">
              <button 
                className="btn-primary"
              >
                Back to Dashboard
              </button>
              <a href="#about" className="btn-secondary">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* ABOUT SECTION */}
        {/* ============================================ */}
        <section id="about" className="section powered-about">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">🌍</span>
              About RS Africa
            </h2>
            <div className="powered-about-content">
              <p className="powered-about-description">
                RS Africa is a leading technology solutions provider dedicated to empowering businesses 
                across Africa with innovative, scalable, and reliable business management systems. 
                With a focus on excellence and customer satisfaction, we deliver cutting-edge solutions 
                that drive growth, efficiency, and success.
              </p>
              <div className="powered-about-features">
                <div className="feature-item">
                  <span className="feature-icon">💡</span>
                  <span>Innovative Solutions</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🤝</span>
                  <span>Trusted Partner</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌟</span>
                  <span>Excellence Driven</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📈</span>
                  <span>Growth Focused</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SERVICES SECTION */}
        {/* ============================================ */}
        <section className="section powered-services">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">💼</span>
              Our Services
            </h2>
            <div className="powered-services-grid">
              <div className="service-card">
                <div className="service-icon">🏪</div>
                <h3>POS Solutions</h3>
                <p>Complete Point of Sale systems for retail and hospitality businesses.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">📊</div>
                <h3>Business Management</h3>
                <p>Comprehensive ERP and business management systems.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">💻</div>
                <h3>Custom Development</h3>
                <p>Tailored software solutions for your specific business needs.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">☁️</div>
                <h3>Cloud Solutions</h3>
                <p>Scalable cloud-based systems for modern businesses.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🔒</div>
                <h3>IT Security</h3>
                <p>Comprehensive security solutions to protect your business data.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">📞</div>
                <h3>24/7 Support</h3>
                <p>Round-the-clock technical support for your peace of mind.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* WHY RS AFRICA */}
        {/* ============================================ */}
        <section className="section powered-why">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">⭐</span>
              Why RS Africa?
            </h2>
            <div className="powered-why-grid">
              <div className="why-card">
                <div className="why-number">1</div>
                <h3>Innovation</h3>
                <p>We stay ahead of the curve with cutting-edge technology solutions.</p>
              </div>
              <div className="why-card">
                <div className="why-number">2</div>
                <h3>Reliability</h3>
                <p>Our systems are built for stability and performance you can count on.</p>
              </div>
              <div className="why-card">
                <div className="why-number">3</div>
                <h3>Support</h3>
                <p>Dedicated support team available to assist you 24/7.</p>
              </div>
              <div className="why-card">
                <div className="why-number">4</div>
                <h3>Scalability</h3>
                <p>Solutions that grow with your business, from startup to enterprise.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* STATS SECTION */}
        {/* ============================================ */}
        <section className="section powered-stats">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">📊</span>
              Our Impact
            </h2>
            <div className="powered-stats-grid">
              <div className="stat-card">
                <div className="stat-value">100+</div>
                <div className="stat-label">📁 Projects Delivered</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">100+</div>
                <div className="stat-label">🏢 Satisfied Companies</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">100+</div>
                <div className="stat-label">👥 Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">📈 Uptime Guarantee</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* CONTACT & SOCIAL SECTION */}
        {/* ============================================ */}
        <section id="contact" className="section powered-contact">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">📞</span>
              Connect With Us
            </h2>
            <div className="powered-contact-grid">
              {/* Contact Info */}
              <div className="contact-card">
                <h3>📧 Get in Touch</h3>
                <div className="contact-info">
                  <p>✉️ info@rsafrica.com</p>
                  <p>📞 +254 722 527 955</p>
                  <p>📍 Nairobi, Kenya</p>
                  <p>🕐 Mon - Fri: 8:00 AM - 10:00 PM EAT</p>
                </div>
              </div>

              {/* Social Media */}
              <div className="social-card">
                <h3>🔗 Follow Us</h3>
                <div className="social-icons-row">
                  <button 
                    className="social-circle facebook" 
                    onClick={() => handleSocialClick('Facebook')}
                    aria-label="Facebook"
                  >
                    <span>f</span>
                    <span className="social-label">Facebook</span>
                  </button>
                  <button 
                    className="social-circle twitter" 
                    onClick={() => handleSocialClick('Twitter')}
                    aria-label="X (Twitter)"
                  >
                    <span>🐦</span>
                    <span className="social-label">X</span>
                  </button>
                  <button 
                    className="social-circle linkedin" 
                    onClick={() => handleSocialClick('LinkedIn')}
                    aria-label="LinkedIn"
                  >
                    <span>in</span>
                    <span className="social-label">LinkedIn</span>
                  </button>
                  <button 
                    className="social-circle youtube" 
                    onClick={() => handleSocialClick('YouTube')}
                    aria-label="YouTube"
                  >
                    <span>▶</span>
                    <span className="social-label">YouTube</span>
                  </button>
                  <button 
                    className="social-circle instagram" 
                    onClick={() => handleSocialClick('Instagram')}
                    aria-label="Instagram"
                  >
                    <span>📷</span>
                    <span className="social-label">Instagram</span>
                  </button>
                  <button 
                    className="social-circle whatsapp" 
                    onClick={() => handleSocialClick('WhatsApp')}
                    aria-label="WhatsApp"
                  >
                    <span>💬</span>
                    <span className="social-label">WhatsApp</span>
                  </button>
                </div>

                {/* Newsletter */}
                <div className="social-newsletter">
                  <h4>📰 Subscribe to our Newsletter</h4>
                  <div className="newsletter-form">
                    <input type="email" placeholder="Enter your email" className="newsletter-input" />
                    <button className="btn-subscribe">
                      📨 Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* BACK TO TOP */}
        {/* ============================================ */}
        <div className="powered-footer-actions">
          <button 
            className="btn-back-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Back to Top
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default PoweredBy;