const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (file, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
};

module.exports = uploadToCloudinary;