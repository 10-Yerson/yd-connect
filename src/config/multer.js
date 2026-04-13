const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype.startsWith('audio/')
    ) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes, videos y audios'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = upload;