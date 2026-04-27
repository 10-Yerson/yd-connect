const Admin = require('../models/Admin');
const cloudinary = require('../config/cloudinary');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// 👤 Obtener mi propio perfil
exports.getMyProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        res.json({
            success: true,
            admin: {
                _id: admin._id,
                name: admin.name,
                apellido: admin.apellido,
                email: admin.email,
                genero: admin.genero,
                profileUrl: admin.profileUrl,
                role: admin.role,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// 🔄 Actualizar mi propio perfil
exports.updateMyProfile = async (req, res) => {
    const { name, email, apellido, genero } = req.body;
    
    try {
        const admin = await Admin.findById(req.user.id);
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        // Verificar si el email ya existe (si se está cambiando)
        if (email && email !== admin.email) {
            const emailExists = await Admin.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ msg: 'Email already exists' });
            }
            admin.email = email.toLowerCase();
        }
        
        admin.name = name || admin.name;
        admin.apellido = apellido || admin.apellido;
        admin.genero = genero || admin.genero;
        
        await admin.save();
        
        res.json({
            success: true,
            msg: 'Profile updated successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                apellido: admin.apellido,
                email: admin.email,
                genero: admin.genero,
                profileUrl: admin.profileUrl,
                role: admin.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// 📸 Subir mi propia foto de perfil
exports.uploadMyProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        
        const admin = await Admin.findById(req.user.id);
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        // Guardar la URL anterior para eliminarla después
        const oldProfileUrl = admin.profileUrl;
        
        // Subir la nueva imagen a Cloudinary
        const imageUrl = await uploadToCloudinary(
            req.file,
            'nuestra-historia/profile',
            'image'
        );
        
        // Actualizar la foto de perfil
        admin.profileUrl = imageUrl;
        await admin.save();
        
        // Eliminar la foto anterior de Cloudinary (si no es la default)
        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        if (oldProfileUrl && oldProfileUrl !== defaultUrl) {
            await deleteFromCloudinary(oldProfileUrl);
        }
        
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        
        res.json({
            success: true,
            msg: 'Profile picture updated successfully',
            profileUrl: imageUrl,
            admin: adminResponse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error uploading image' });
    }
};

// 🗑️ Eliminar mi propia cuenta
exports.deleteMyAccount = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        // Guardar la URL de la foto antes de eliminar
        const profileUrl = admin.profileUrl;
        
        // Eliminar el admin de la base de datos
        await admin.deleteOne();
        
        // Eliminar la foto de Cloudinary (si no es la default)
        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        if (profileUrl && profileUrl !== defaultUrl) {
            await deleteFromCloudinary(profileUrl);
        }
        
        res.json({
            success: true,
            msg: 'Account deleted successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ========== FUNCIONES PARA SUPERADMIN ==========

// 📖 Obtener todos los admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        
        res.json({
            success: true,
            count: admins.length,
            admins
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// 👤 Obtener un admin por ID
exports.getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        res.json({
            success: true,
            admin
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// 🔄 Actualizar cualquier admin
exports.updateAdminById = async (req, res) => {
    const { name, email, apellido, genero, role } = req.body;
    
    try {
        const admin = await Admin.findById(req.params.id);
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        // Verificar si el email ya existe
        if (email && email !== admin.email) {
            const emailExists = await Admin.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ msg: 'Email already exists' });
            }
            admin.email = email.toLowerCase();
        }
        
        admin.name = name || admin.name;
        admin.apellido = apellido || admin.apellido;
        admin.genero = genero || admin.genero;
        admin.role = role || admin.role;
        
        // Si se proporciona una nueva contraseña, encriptarla
        if (password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
        }
        
        await admin.save();
        
        // Devolver admin sin contraseña
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        
        res.json({
            success: true,
            msg: 'Admin updated successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                apellido: admin.apellido,
                email: admin.email,
                genero: admin.genero,
                profileUrl: admin.profileUrl,
                role: admin.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// 📸 Subir foto de perfil de CUALQUIER admin (solo superadmin)
exports.uploadAnyAdminProfilePicture = async (req, res) => {
    try {
        const { adminId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        
        // Verificar que el admin existe
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        // Guardar la URL anterior para eliminarla después
        const oldProfileUrl = admin.profileUrl;
        
        // Subir la nueva imagen a Cloudinary
        const imageUrl = await uploadToCloudinary(
            req.file,
            'nuestra-historia/profile',
            'image'
        );
        
        // Actualizar la foto de perfil del admin específico
        admin.profileUrl = imageUrl;
        await admin.save();
        
        // Eliminar la foto anterior de Cloudinary (si no es la default)
        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        if (oldProfileUrl && oldProfileUrl !== defaultUrl) {
            await deleteFromCloudinary(oldProfileUrl);
        }
        
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        
        res.json({
            success: true,
            msg: `Profile picture updated for admin: ${admin.name} ${admin.apellido}`,
            profileUrl: imageUrl,
            admin: adminResponse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error uploading image for admin' });
    }
};

// 🗑️ Eliminar cualquier admin (solo superadmin)
exports.deleteAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        
        // Evitar que el superadmin se elimine a sí mismo
        if (admin._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot delete your own account through this endpoint' });
        }
        
        // Guardar la URL de la foto antes de eliminar
        const profileUrl = admin.profileUrl;
        
        // Eliminar el admin de la base de datos
        await admin.deleteOne();
        
        // Eliminar la foto de Cloudinary (si no es la default)
        const defaultUrl = 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png';
        if (profileUrl && profileUrl !== defaultUrl) {
            await deleteFromCloudinary(profileUrl);
        }
        
        res.json({
            success: true,
            msg: 'Admin deleted successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};