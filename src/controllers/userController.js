const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const bcrypt = require('bcryptjs');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

// ========== FUNCIONES PARA ADMIN ==========

// 🔍 Obtener todos los usuarios (con filtros)
exports.getUsers = async (req, res) => {
    try {
        const { isActive, search, page = 1, limit = 10 } = req.query;

        const filters = {};
        if (isActive !== undefined) filters.isActive = isActive === 'true';

        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { apellido: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [users, total] = await Promise.all([
            User.find(filters)
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            User.countDocuments(filters)
        ]);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            users
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// 🔍 Obtener usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// 🔄 Actualizar cualquier usuario (solo admin)
exports.updateUserByAdmin = async (req, res) => {
    const { name, apellido, email, genero, telefono, password, isActive } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Verificar email único
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ msg: 'El email ya está registrado' });
            }
            user.email = email.toLowerCase();
        }

        if (name) user.name = name;
        if (apellido) user.apellido = apellido;
        if (genero) user.genero = genero;
        if (telefono) user.telefono = telefono;
        if (isActive !== undefined) user.isActive = isActive;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ 
            success: true,
            msg: 'Usuario actualizado correctamente', 
            user: userResponse 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// ❌ Eliminar cualquier usuario (solo admin)
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        await user.deleteOne();

        res.json({ 
            success: true,
            msg: 'Usuario eliminado correctamente' 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// 📸 Subir foto de perfil de CUALQUIER usuario (solo admin)
exports.uploadUserProfilePictureByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ msg: 'No se subió ningún archivo' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const imageUrl = await uploadToCloudinary(
            req.file,
            'nuestra-historia/users',
            'image'
        );

        user.profilePicture = imageUrl;
        await user.save();

        res.json({
            success: true,
            msg: `Foto actualizada para ${user.name} ${user.apellido}`,
            profilePicture: imageUrl,
            user: {
                id: user._id,
                name: user.name,
                apellido: user.apellido,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error subiendo imagen' });
    }
};

// 🗑️ Eliminar foto de perfil de CUALQUIER usuario (solo admin)
exports.deleteUserProfilePictureByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        user.profilePicture = defaultUrl;
        await user.save();

        res.json({ 
            success: true,
            msg: 'Foto restaurada a la predeterminada',
            profilePicture: defaultUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error eliminando imagen' });
    }
};

// ========== FUNCIONES PARA EL PROPIO USUARIO ==========

// 👤 Mi perfil
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                apellido: user.apellido,
                email: user.email,
                genero: user.genero,
                telefono: user.telefono,
                profilePicture: user.profilePicture,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error obteniendo perfil' });
    }
};

// 🔄 Actualizar mi propio perfil
exports.updateMyProfile = async (req, res) => {
    const { name, apellido, email, genero, telefono, password } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Verificar email único
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ msg: 'El email ya está registrado' });
            }
            user.email = email.toLowerCase();
        }

        if (name) user.name = name;
        if (apellido) user.apellido = apellido;
        if (genero) user.genero = genero;
        if (telefono) user.telefono = telefono;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            msg: 'Perfil actualizado correctamente',
            user: userResponse
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// 📸 Subir mi foto de perfil
exports.uploadMyProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No se subió ningún archivo' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const imageUrl = await uploadToCloudinary(
            req.file,
            'nuestra-historia/users',
            'image'
        );

        user.profilePicture = imageUrl;
        await user.save();

        res.json({
            success: true,
            msg: 'Foto de perfil actualizada',
            profilePicture: imageUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error subiendo imagen' });
    }
};

// 🗑️ Eliminar mi foto de perfil (volver a default)
exports.deleteMyProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        user.profilePicture = defaultUrl;
        await user.save();

        res.json({ 
            success: true,
            msg: 'Foto restaurada a la predeterminada',
            profilePicture: defaultUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error eliminando imagen' });
    }
};

// 🗑️ Eliminar mi propia cuenta
exports.deleteMyAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Opcional: soft delete en lugar de eliminar realmente
        // user.isActive = false;
        // await user.save();
        
        await user.deleteOne();

        res.json({
            success: true,
            msg: 'Cuenta eliminada correctamente'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};