const express = require('express');
const router = express.Router();

const memoryController = require('../controllers/memoryController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');


// 👑 CREAR MEMORY (SOLO ADMIN)
router.post(
    '/',
    auth,
    authorize('admin'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'music', maxCount: 1 }
    ]),
    memoryController.createMemory
);

// 📋 OBTENER TODOS LOS RECUERDOS PARA ADMIN
router.get(
    '/admin',
    auth,
    authorize('admin'),
    memoryController.getAllMemories
);

// 👀 VER TODAS (USER Y ADMIN PUEDEN VER)
router.get(
    '/',
    auth,
    authorize('user', 'admin'),
    memoryController.getMemories
);


// 👀 VER UNA (USER Y ADMIN PUEDEN VER)
router.get(
    '/:id',
    auth,
    authorize('user', 'admin'),
    memoryController.getMemoryById
);


router.put(
    '/:id',
    auth,
    authorize('admin'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'music', maxCount: 1 }
    ]),
    memoryController.updateMemory
);


// 🗑️ ELIMINAR (SOLO ADMIN)
router.delete(
    '/:id',
    auth,
    authorize('admin'),
    memoryController.deleteMemory
);

module.exports = router;