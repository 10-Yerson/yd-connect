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

router.put(
    '/:id',
    auth,
    authorize('admin'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
    ]),
    controller.updateLetter
);

// USER
router.get('/user', auth, authorize('user'), controller.getLettersForUser);

router.get('/admin', auth, authorize('admin'), controller.getAllLetters);

router.get('/history', auth, authorize('user'), controller.getHistory);

router.put('/seen/:id', auth, authorize('user'), controller.markAsSeen);

router.put('/:id', auth, authorize('admin'), controller.updateLetter);

router.get('/status', auth, authorize('user'), controller.getCountdownAndProgress);

router.get('/public-status', controller.getPublicCountdown);

router.delete('/:id', auth, authorize('admin'), controller.deleteLetter);

module.exports = router;