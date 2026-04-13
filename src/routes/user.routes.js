const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.get('/', auth, authorize('admin'), userController.getUsers);

router.get('/profile/me', auth, authorize('user'), userController.getMyProfile);

router.put('/profile/me', auth, authorize('user'), upload.single('profilePicture'), userController.uploadProfilePicture);

router.get('/:id', auth, authorize('user', 'admin'), userController.getUserById);

router.put('/:id', auth, authorize('user', 'admin'), userController.updateUser);

router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

router.delete('/picture/:id', auth, authorize('user', 'admin'), userController.deleteProfilePicture);

module.exports = router;