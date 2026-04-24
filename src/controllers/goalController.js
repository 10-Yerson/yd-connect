const Goal = require('../models/goal');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');


// 👑 CREAR META
exports.createGoal = async (req, res) => {
    try {
        const { title, description } = req.body;

        const media = {};

        if (req.files?.image) {
            // Subir imagen a carpeta goals/images
            media.image = await uploadToCloudinary(req.files.image[0], 'goals/images', 'image');
        }

        if (req.files?.video) {
            // Subir video a carpeta goals/videos
            media.video = await uploadToCloudinary(req.files.video[0], 'goals/videos', 'video');
        }

        const goal = await Goal.create({
            title,
            description,
            media
        });

        res.status(201).json(goal);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 👀 VER TODAS
exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find().sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 📋 ADMIN - OBTENER TODAS LAS METAS
exports.getAllGoals = async (req, res) => {
    try {
        const goals = await Goal.find().sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// 👀 VER UNA
exports.getGoalById = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: "Meta no encontrada" });
        }

        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✏️ ACTUALIZAR META (texto y multimedia)
exports.updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: "Meta no encontrada" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "No autorizado" });
        }

        // Actualizar texto
        if (req.body.title !== undefined) goal.title = req.body.title;
        if (req.body.description !== undefined) goal.description = req.body.description;

        // Obtener flags de eliminación
        const removeImage = req.body.removeImage === 'true';
        const removeVideo = req.body.removeVideo === 'true';

        // Inicializar media si no existe
        if (!goal.media) goal.media = {};

        // ========== MANEJAR IMAGEN ==========
        if (req.files?.image) {
            // Eliminar imagen anterior si existe
            if (goal.media.image) {
                await deleteFromCloudinary(goal.media.image);
            }
            // Subir nueva imagen a carpeta goals/images
            const imageUrl = await uploadToCloudinary(req.files.image[0], 'goals/images', 'image');
            goal.media.image = imageUrl;
        } else if (removeImage) {
            // Eliminar imagen existente de Cloudinary
            if (goal.media.image) {
                await deleteFromCloudinary(goal.media.image);
            }
            goal.media.image = null;
        }

        // ========== MANEJAR VIDEO ==========
        if (req.files?.video) {
            // Eliminar video anterior si existe
            if (goal.media.video) {
                await deleteFromCloudinary(goal.media.video);
            }
            // Subir nuevo video a carpeta goals/videos
            const videoUrl = await uploadToCloudinary(req.files.video[0], 'goals/videos', 'video');
            goal.media.video = videoUrl;
        } else if (removeVideo) {
            // Eliminar video existente de Cloudinary
            if (goal.media.video) {
                await deleteFromCloudinary(goal.media.video);
            }
            goal.media.video = null;
        }

        await goal.save();

        res.json({
            message: "Meta actualizada exitosamente",
            goal
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// 🔄 CAMBIAR ESTADO
exports.updateGoalStatus = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: "Meta no encontrada" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "No autorizado" });
        }

        goal.status = req.body.status;

        await goal.save();

        res.json(goal);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🗑️ ELIMINAR META
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: "Meta no encontrada" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "No autorizado" });
        }

        // Eliminar archivos de Cloudinary si existen
        if (goal.media) {
            if (goal.media.image) {
                await deleteFromCloudinary(goal.media.image);
            }
            if (goal.media.video) {
                await deleteFromCloudinary(goal.media.video);
            }
        }

        await goal.deleteOne();

        res.json({ message: "Meta eliminada 💔" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};