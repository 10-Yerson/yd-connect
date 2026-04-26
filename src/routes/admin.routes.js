const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer'); 

// ========== PERFIL PROPIO ==========
// 📖 Obtener mi perfil
router.get('/me', auth, authorize('admin'), adminController.getMyProfile);

// 🔄 Actualizar mis datos
router.put('/me', auth, authorize('admin'), adminController.updateMyProfile); // Cambiado de updateAdmin a updateMyProfile

// 📸 Subir mi foto de perfil
router.put('/profile-picture', auth, authorize('admin'), upload.single('image'), adminController.uploadMyProfilePicture);

// 🗑️ Eliminar mi cuenta
router.delete('/me', auth, authorize('admin'), adminController.deleteMyAccount);

// ========== ADMINISTRACIÓN DE ADMINS (SOLO SUPERADMIN) ==========
// 📖 Obtener todos los admins
router.get('/', auth, authorize('admin'), adminController.getAllAdmins);

// 📖 Obtener admin por ID
router.get('/:id', auth, authorize('admin'), adminController.getAdminById);

// 🔄 Actualizar cualquier admin
router.put('/:id', auth, authorize('admin'), adminController.updateAdminById);

// 📸 Subir foto de perfil de cualquier admin
router.put('/:adminId/profile-picture', auth, authorize('admin'), upload.single('image'), adminController.uploadAnyAdminProfilePicture);

// 🗑️ Eliminar cualquier admin
router.delete('/:id', auth, authorize('admin'), adminController.deleteAdminById);

module.exports = router;