// utils/cloudinaryHelper.js
const cloudinary = require('cloudinary').v2;

/**
 * Extrae el public_id y resource_type de una URL de Cloudinary
 * @param {string} url - URL completa de Cloudinary
 * @returns {Object|null} - { publicId, resourceType } o null
 */
const extractCloudinaryInfo = (url) => {
    if (!url) return null;
    
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Obtener el resource type (image, video, raw)
    let resourceType = parts[uploadIndex - 1];
    
    // Obtener el public_id (todo después de 'upload' + 1 para saltar la versión)
    const publicIdParts = parts.slice(uploadIndex + 2);
    let publicId = publicIdParts.join('/');
    
    // Remover extensión
    publicId = publicId.split('.')[0];
    
    // Normalizar: Si es audio (por la carpeta o extensión), asegurar que sea 'video'
    // porque así lo subiste
    if (publicId.includes('/audio/') || url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        resourceType = 'video'; // Tus audios se suben como video
    }
    
    return { publicId, resourceType };
};

/**
 * Elimina un archivo de Cloudinary
 * @param {string} url - URL del archivo en Cloudinary
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object|null>}
 */
const deleteFromCloudinary = async (url, options = {}) => {
    if (!url) return null;
    
    const info = extractCloudinaryInfo(url);
    if (!info) {
        console.log(`⚠️ No se pudo extraer info de: ${url}`);
        return null;
    }
    
    const { publicId, resourceType } = info;
    
    try {
        const deleteOptions = {
            invalidate: true,
            resource_type: resourceType, // 'image' para imágenes, 'video' para videos y audios
            ...options
        };
        
        console.log(`🗑️ Intentando eliminar: [${resourceType}] ${publicId}`);
        
        const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
        
        if (result.result === 'ok') {
            console.log(`✅ Eliminado: [${resourceType}] ${publicId}`);
        } else if (result.result === 'not found') {
            console.log(`⚠️ No encontrado: [${resourceType}] ${publicId}`);
        } else {
            console.log(`❌ Resultado inesperado: ${result.result} para ${publicId}`);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Error eliminando ${publicId}:`, error.message);
        throw error;
    }
};

/**
 * Elimina múltiples archivos
 * @param {string[]} urls - Array de URLs
 * @returns {Promise<Object[]>}
 */
const deleteMultipleFromCloudinary = async (urls) => {
    const validUrls = urls.filter(url => url);
    const results = await Promise.allSettled(
        validUrls.map(url => deleteFromCloudinary(url))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.result === 'ok').length;
    console.log(`📊 Resumen: ${successful} de ${validUrls.length} archivos eliminados`);
    
    return results;
};

// Mantener compatibilidad con código existente
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