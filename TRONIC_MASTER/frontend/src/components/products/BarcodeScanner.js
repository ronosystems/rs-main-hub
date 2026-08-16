import React, { useState, useRef } from 'react';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, onClose, label = 'Scan Barcode' }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start scanning loop
      scanLoop();
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const scanLoop = () => {
    if (!scanning || !videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      setTimeout(() => {
        if (scanning) {
          scanLoop();
        }
      }, 100);
    } else {
      setTimeout(() => {
        if (scanning) {
          scanLoop();
        }
      }, 100);
    }
  };

  const stopScanner = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value) {
        onScan(value);
        e.target.value = '';
      }
    }
  };

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scanner-header">
          <h3>{label}</h3>
          <button className="scanner-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="scanner-body">
          {!scanning ? (
            <div className="scanner-start">
              <div className="scanner-icon">📷</div>
              <p>Click the button below to start scanning</p>
              <button className="btn-scan" onClick={startScanner}>
                <span>📸</span> Start Scanner
              </button>
              
              <div className="divider">
                <span>OR</span>
              </div>
              
              <div className="manual-input">
                <label>Enter manually:</label>
                <input
                  type="text"
                  placeholder="Type barcode/IMEI/Serial number..."
                  onKeyPress={handleManualInput}
                  className="manual-input-field"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="scanner-active">
              <div className="scanner-viewport">
                <video ref={videoRef} className="scanner-video" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="scanner-overlay-guide">
                  <div className="scanner-frame"></div>
                  <p className="scanner-hint">Align barcode/QR code in the frame</p>
                </div>
              </div>
              
              {error && (
                <div className="scanner-error">
                  <span>⚠️</span> {error}
                </div>
              )}
              
              <div className="scanner-actions">
                <button className="btn-stop" onClick={stopScanner}>
                  ⏹ Stop Scanning
                </button>
                <button className="btn-manual" onClick={stopScanner}>
                  ✏️ Enter Manually
                </button>
              </div>
            </div>
          )}
          
          {error && !scanning && (
            <div className="scanner-error">
              <span>⚠️</span> {error}
              <button className="btn-retry" onClick={() => setError(null)}>
                Retry
              </button>
            </div>
          )}
        </div>
        
        <div className="scanner-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
