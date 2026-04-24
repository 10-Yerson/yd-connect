const cloudinary = require('cloudinary').v2;

const extractCloudinaryInfo = (url) => {
    if (!url) return null;
    
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    let resourceType = parts[uploadIndex - 1];
    const publicIdParts = parts.slice(uploadIndex + 2);
    let publicId = publicIdParts.join('/');
    publicId = publicId.split('.')[0];
    
    if (publicId.includes('/audio/') || url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        resourceType = 'video';
    }
    
    return { publicId, resourceType };
};

const deleteFromCloudinary = async (url, options = {}) => {
    if (!url) return null;
    
    const info = extractCloudinaryInfo(url);
    if (!info) return null;
    
    const { publicId, resourceType } = info;
    
    try {
        const deleteOptions = {
            invalidate: true,
            resource_type: resourceType,
            ...options
        };
        
        return await cloudinary.uploader.destroy(publicId, deleteOptions);
    } catch (error) {
        throw error;
    }
};

const deleteMultipleFromCloudinary = async (urls) => {
    const validUrls = urls.filter(url => url);
    return await Promise.allSettled(
        validUrls.map(url => deleteFromCloudinary(url))
    );
};

const getPublicIdFromUrl = (url) => {
    const info = extractCloudinaryInfo(url);
    return info ? info.publicId : null;
};

module.exports = {
    extractCloudinaryInfo,
    getPublicIdFromUrl,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary
};