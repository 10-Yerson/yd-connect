const express = require('express');
const router = express.Router();
const controller = require('../controllers/letterController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// ADMIN
router.post(
    '/',
    auth,
    authorize('admin'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
    ]),
    controller.createLetter
);

router.put('/:id', auth, authorize('admin'), controller.updateLetter);

// USER
router.get('/user', auth, authorize('user'), controller.getLettersForUser);

router.get('/history', auth, authorize('user'), controller.getHistory);

router.put('/seen/:id', auth, authorize('user'), controller.markAsSeen);

router.get('/status', auth, authorize('user'), controller.getCountdownAndProgress);

module.exports = router;