import React, { useState, useEffect } from 'react';

const MAIN_HUB_API_URL = process.env.REACT_APP_MAIN_HUB_API_URL || 'http://localhost:5000';

const ProfileImage = ({ 
    imageId, 
    alt = 'Profile', 
    className = '', 
    style = {},
    fallbackText = '',
    size = 40,
    shape = 'circle' // 'circle' or 'square'
}) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!imageId) {
            setLoading(false);
            setError(true);
            return;
        }

        const fetchImage = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${MAIN_HUB_API_URL}/api/images/${imageId}`);
                if (!response.ok) throw new Error('Image not found');
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setImageUrl(url);
                setError(false);
            } catch (err) {
                console.error('Failed to load image:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();

        // Cleanup URL
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageId]);

    const borderRadius = shape === 'circle' ? '50%' : '4px';

    if (loading) {
        return (
            <div 
                className={`profile-image-placeholder ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderRadius: borderRadius,
                    background: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...style
                }}
            >
                <span className="spinner-border spinner-border-sm" />
            </div>
        );
    }

    if (error || !imageUrl) {
        const initial = fallbackText ? fallbackText.charAt(0).toUpperCase() : alt.charAt(0).toUpperCase();
        return (
            <div 
                className={`profile-image-placeholder ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderRadius: borderRadius,
                    background: '#6c757d',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: size * 0.4,
                    ...style
                }}
            >
                {initial}
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={`profile-image ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: borderRadius,
                objectFit: 'cover',
                ...style
            }}
            onError={() => setError(true)}
        />
    );
};

export default ProfileImage;