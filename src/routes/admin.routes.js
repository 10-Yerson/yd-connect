const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Rutas del propio admin
router.get('/me', auth, authorize('admin'), adminController.getMyProfile);
router.put('/me', auth, authorize('admin'), adminController.updateMyProfile);
router.put('/profile-picture', auth, authorize('admin'), upload.single('image'), adminController.uploadMyProfilePicture);
router.delete('/me', auth, authorize('admin'), adminController.deleteMyAccount);

// Rutas de administración de admins
router.get('/', auth, authorize('admin'), adminController.getAllAdmins);
router.get('/:id', auth, authorize('admin'), adminController.getAdminById);
router.put('/:id', auth, authorize('admin'), adminController.updateAdminById);
router.put('/:adminId/profile-picture', auth, authorize('admin'), upload.single('image'), adminController.uploadAnyAdminProfilePicture);
router.delete('/:id', auth, authorize('admin'), adminController.deleteAdminById);

module.exports = router;