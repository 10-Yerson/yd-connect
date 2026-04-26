const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Rutas del propio usuario
router.get('/profile/me', auth, authorize('user'), userController.getMyProfile);
router.put('/profile/me', auth, authorize('user'), userController.updateMyProfile);
router.put('/profile/picture', auth, authorize('user'), upload.single('image'), userController.uploadMyProfilePicture);
router.delete('/profile/picture', auth, authorize('user'), userController.deleteMyProfilePicture);
router.delete('/profile/me', auth, authorize('user'), userController.deleteMyAccount);

// Rutas de administración (solo admin)
router.get('/', auth, authorize('admin'), userController.getUsers);
router.get('/:id', auth, authorize('admin'), userController.getUserById);
router.put('/:id', auth, authorize('admin'), userController.updateUserByAdmin);
router.put('/:id/picture', auth, authorize('admin'), upload.single('image'), userController.uploadUserProfilePictureByAdmin);
router.delete('/:id/picture', auth, authorize('admin'), userController.deleteUserProfilePictureByAdmin);
router.delete('/:id', auth, authorize('admin'), userController.deleteUserByAdmin);

module.exports = router;