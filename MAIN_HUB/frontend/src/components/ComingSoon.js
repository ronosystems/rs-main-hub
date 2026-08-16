import React from 'react';
import './ComingSoon.css';

const ComingSoon = ({ title, description }) => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">🚧</div>
        <h1 className="coming-soon-title">{title || 'Coming Soon'}</h1>
        <p className="coming-soon-description">
          {description || 'This feature is currently under development. We\'re working hard to bring it to you soon!'}
        </p>
        <div className="coming-soon-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '45%' }}></div>
          </div>
          <span className="progress-text">45% Complete</span>
        </div>
        <div className="coming-soon-features">
          <h4>What's Coming:</h4>
          <ul>
            <li>✅ Full CRUD operations</li>
            <li>✅ Advanced filtering & search</li>
            <li>✅ Export & reporting</li>
            <li>✅ User management</li>
            <li>✅ Integration with other modules</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
