// MAIN_HUB API URL
const MAIN_HUB_API_URL = process.env.REACT_APP_MAIN_HUB_API_URL || 'http://localhost:5000';

// Get image URL from MAIN_HUB
export const getImageUrl = (imageId) => {
    if (!imageId) return null;
    return `${MAIN_HUB_API_URL}/api/images/${imageId}`;
};

// Get image as data URL (base64)
export const getImageDataUrl = async (imageId) => {
    if (!imageId) return null;
    try {
        const response = await fetch(`${MAIN_HUB_API_URL}/api/images/dataurl/${imageId}`);
        const data = await response.json();
        return data.success ? data.data.dataUrl : null;
    } catch (error) {
        console.error('Failed to fetch image:', error);
        return null;
    }
};

// Get profile picture for a user
export const getProfilePicture = (user) => {
    if (!user) return null;
    if (user.profilePicture) {
        return getImageUrl(user.profilePicture);
    }
    // Fallback to avatar or default
    return user.avatar || null;
};

// Get company logo
export const getCompanyLogo = (company) => {
    if (!company) return null;
    if (company.logo) {
        return getImageUrl(company.logo);
    }
    return null;
};

// Check if image exists
export const checkImageExists = async (imageId) => {
    if (!imageId) return false;
    try {
        const response = await fetch(`${MAIN_HUB_API_URL}/api/images/${imageId}`, {
            method: 'HEAD'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};