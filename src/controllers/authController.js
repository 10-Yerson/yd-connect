const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/jwt');


exports.registerUser = async (req, res) => {
    const { name, apellido, genero, telefono, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        const newUser = new User({
            name,
            apellido,
            genero,
            telefono,
            email,
            password
        });

        await newUser.save();

        res.status(201).json({
            msg: 'Usuario registrado correctamente'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};


exports.registerAdmin = async (req, res) => {
    const { name, apellido, genero, email, password } = req.body;

    try {
        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({ msg: 'El admin ya existe' });
        }

        const newAdmin = new Admin({
            name,
            apellido,
            genero,
            email,
            password
        });

        await newAdmin.save();

        res.status(201).json({
            msg: 'Administrador registrado correctamente'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.login = async (req, res) => {

    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    email = email.toLowerCase().trim();

    try {
        const [admin, user] = await Promise.all([
            Admin.findOne({ email }),
            User.findOne({ email })
        ]);

        if (!admin && !user) {
            return res.status(404).json({ msg: "Correo no registrado" });
        }

        const account = admin || user;
        const role = admin ? 'admin' : 'user';

        const isMatch = await bcrypt.compare(password, account.password);

        if (!isMatch) {
            return res.status(400).json({ msg: "Contraseña incorrecta" });
        }

        const payload = {
            user: {
                id: account._id,
                role
            }
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire });

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 90 * 24 * 60 * 60 * 1000  // 90 días
        });

        res.json({
            msg: "Login exitoso",
            role,
            userId: account._id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};


exports.logout = (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });

    res.json({ msg: 'Logout exitoso' });
};


exports.checkAuth = (req, res) => {
    // req.user ya viene del middleware auth
    if (!req.user) {
        return res.status(401).json({ msg: 'No autenticado' });
    }

    res.json({
        role: req.user.role,
        userId: req.user.id
    });
};

exports.getUserInfo = (req, res) => {
    res.json({
        userId: req.user.id,
        role: req.user.role
    });
};

// Agregar esta función al final del archivo
exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        // Verificar el token actual
        const decoded = jwt.verify(token, jwtSecret);

        // Verificar si el usuario aún existe
        let account = await User.findById(decoded.user.id);
        if (!account) {
            account = await Admin.findById(decoded.user.id);
        }

        if (!account) {
            return res.status(401).json({ msg: 'User not found' });
        }

        // Crear nuevo token
        const payload = {
            user: {
                id: account._id,
                role: decoded.user.role
            }
        };

        const newToken = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire });

        res.cookie('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 90 * 24 * 60 * 60 * 1000  // 90 días
        });

        res.json({ msg: 'Token refreshed', role: decoded.user.role });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ msg: 'Invalid token' });
    }
};

exports.verificarEmergencia = async (req, res) => {
    const { password } = req.body;
    const EMERGENCIA_PASSWORD = process.env.EMERGENCIA_PASSWORD;
    
    if (password === EMERGENCIA_PASSWORD) {
        res.json({
            success: true,
            msg: 'Contraseña correcta'
        });
    } else {
        res.status(401).json({
            success: false,
            msg: 'Contraseña incorrecta'
        });
    }
};