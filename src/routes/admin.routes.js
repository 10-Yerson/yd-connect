const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer'); 

router.get('/me', auth, authorize('admin'), adminController.getMyProfile);
router.put('/me', auth, authorize('admin'), adminController.updateAdmin);
router.put('/profile-picture', auth, authorize('admin'), upload.single('image'), adminController.uploadProfilePicture);

module.exports = router;