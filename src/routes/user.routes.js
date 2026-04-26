const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// ========== RUTAS PARA EL PROPIO USUARIO ==========
// 📖 Obtener mi perfil
router.get('/profile/me', auth, authorize('user'), userController.getMyProfile);

// 🔄 Actualizar mi perfil
router.put('/profile/me', auth, authorize('user'), userController.updateMyProfile);

// 📸 Subir mi foto de perfil
router.put('/profile/picture', auth, authorize('user'), upload.single('image'), userController.uploadMyProfilePicture);

// 🗑️ Eliminar mi foto de perfil
router.delete('/profile/picture', auth, authorize('user'), userController.deleteMyProfilePicture);

// 🗑️ Eliminar mi cuenta
router.delete('/profile/me', auth, authorize('user'), userController.deleteMyAccount);

// ========== RUTAS PARA ADMIN (GESTIÓN DE USUARIOS) ==========
// 📖 Obtener todos los usuarios
router.get('/', auth, authorize('admin'), userController.getUsers);

// 📖 Obtener usuario por ID
router.get('/:id', auth, authorize('admin'), userController.getUserById);

// 🔄 Actualizar cualquier usuario
router.put('/:id', auth, authorize('admin'), userController.updateUserByAdmin);

// 📸 Subir foto de cualquier usuario
router.put('/:id/picture', auth, authorize('admin'), upload.single('image'), userController.uploadUserProfilePictureByAdmin);

// 🗑️ Eliminar foto de cualquier usuario
router.delete('/:id/picture', auth, authorize('admin'), userController.deleteUserProfilePictureByAdmin);

// 🗑️ Eliminar cualquier usuario
router.delete('/:id', auth, authorize('admin'), userController.deleteUserByAdmin);

module.exports = router;