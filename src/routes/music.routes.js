const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// ============ ADMIN ============
// Subir canción (solo el MP3)
router.post(
    '/',
    auth,
    authorize('admin'),
    upload.fields([{ name: 'audio', maxCount: 1 }]),
    musicController.uploadSong
);

// Eliminar canción
router.delete(
    '/:id',
    auth,
    authorize('admin'),
    musicController.deleteSong
);

// Obtener todas las canciones (admin)
router.get(
    '/all',
    auth,
    authorize('admin'),
    musicController.getAllSongs
);

// ============ USER ============
// Obtener todas las canciones
router.get(
    '/',
    auth,
    authorize('user'),
    musicController.getSongsForUser
);

// Obtener una canción
router.get(
    '/:id',
    auth,
    authorize('user'),
    musicController.getSongById
);

module.exports = router;