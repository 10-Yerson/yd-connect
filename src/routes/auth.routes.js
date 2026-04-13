const express = require('express');
const router = express.Router();

const { registerUser, registerAdmin, login, logout, checkAuth, getUserInfo } = require('../controllers/authController');

const { auth } = require('../middleware/authMiddleware');

// 🔐 Auth check
router.get('/check-auth', auth, checkAuth);
router.get('/user-info', auth, getUserInfo);

// 📝 Registro
router.post('/register', registerUser);
router.post('/register/admin', registerAdmin);

// 🔑 Login / Logout
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;