const express = require('express');
const router = express.Router();

const goalController = require('../controllers/goalController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');


// 👑 CREAR META
router.post(
    '/',
    auth,
    authorize('admin'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 }
    ]),
    goalController.createGoal
);

// 📋 ADMIN - OBTENER TODAS LAS METAS
router.get(
    '/admin',
    auth,
    authorize('admin'),
    goalController.getAllGoals
);


// 👀 VER TODAS
router.get(
    '/',
    auth,
    authorize('user', 'admin'),
    goalController.getGoals
);


// 👀 VER UNA
router.get(
    '/:id',
    auth,
    authorize('user', 'admin'),
    goalController.getGoalById
);


// ✏️ EDITAR META (con soporte para archivos)
router.put(
    '/:id',
    auth,
    authorize('admin'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 }
    ]),
    goalController.updateGoal
);


// 🔄 CAMBIAR ESTADO
router.patch(
    '/:id/status',
    auth,
    authorize('admin'),
    goalController.updateGoalStatus
);


// 🗑️ ELIMINAR
router.delete(
    '/:id',
    auth,
    authorize('admin'),
    goalController.deleteGoal
);

module.exports = router;