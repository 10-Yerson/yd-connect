const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const bcrypt = require('bcryptjs');

// 🔍 Obtener usuarios
exports.getUsers = async (req, res) => {
    try {
        const { isActive, search } = req.query;

        const filters = {};
        if (isActive !== undefined) filters.isActive = isActive === 'true';

        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { apellido: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filters).select('-password');

        res.json(users);
    } catch (err) {
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

        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// 🔄 Actualizar usuario
exports.updateUser = async (req, res) => {
    const { name, apellido, email, genero, telefono, password, isActive } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (name) user.name = name;
        if (apellido) user.apellido = apellido;
        if (email) user.email = email;
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

        res.json({ msg: 'Usuario actualizado', user: userResponse });

    } catch (err) {
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// ❌ Eliminar usuario
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        await user.deleteOne();

        res.json({ msg: 'Usuario eliminado' });

    } catch (err) {
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// ☁️ Subir imagen a Cloudinary
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'nuestra-historia/users',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
};

// 📸 Subir foto perfil
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const imageUrl = await uploadToCloudinary(req.file);

        user.profilePicture = imageUrl;
        await user.save();

        res.json({
            msg: 'Foto actualizada',
            profilePicture: imageUrl
        });

    } catch (error) {
        res.status(500).json({ msg: 'Error subiendo imagen' });
    }
};

// 👤 Mi perfil
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({
            id: user._id,
            name: user.name,
            apellido: user.apellido,
            email: user.email,
            genero: user.genero,
            telefono: user.telefono,
            profilePicture: user.profilePicture,
            role: user.role,
            isActive: user.isActive
        });

    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo perfil' });
    }
};

// 🗑️ Eliminar foto (volver a default)
exports.deleteProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';

        user.profilePicture = defaultUrl;
        await user.save();

        res.json({ msg: 'Imagen restaurada' });

    } catch (error) {
        res.status(500).json({ msg: 'Error eliminando imagen' });
    }
};