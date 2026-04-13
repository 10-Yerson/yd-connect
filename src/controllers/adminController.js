const Admin = require('../models/Admin');
const cloudinary = require('../config/cloudinary');

// 🔄 Actualizar perfil
exports.updateAdmin = async (req, res) => {
    const { name, email, apellido, genero } = req.body;

    try {
        const admin = await Admin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }

        admin.name = name || admin.name;
        admin.email = email || admin.email;
        admin.apellido = apellido || admin.apellido;
        admin.genero = genero || admin.genero;

        await admin.save();

        res.json({
            msg: 'Admin updated successfully',
            admin
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ☁️ Subida reutilizable
const uploadToCloudinary = (file, folder, type = 'auto') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: type
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
};

// 📸 Subir foto de perfil
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const imageUrl = await uploadToCloudinary(
            req.file,
            'nuestra-historia/profile',
            'image'
        );

        const admin = await Admin.findByIdAndUpdate(
            req.user.id,
            { profileUrl: imageUrl },
            { new: true }
        );

        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }

        res.json({
            msg: 'Profile updated successfully',
            profileUrl: imageUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error uploading image' });
    }
};

// 👤 Obtener perfil
exports.getMyProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }

        res.json({
            _id: admin._id,
            name: admin.name,
            apellido: admin.apellido,
            email: admin.email,
            genero: admin.genero,
            profileUrl: admin.profileUrl,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};