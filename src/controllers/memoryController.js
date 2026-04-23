const Memory = require('../models/memory');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


// 👑 CREAR (SOLO ADMIN - tú)
exports.createMemory = async (req, res) => {
    try {
        const { text, date } = req.body;

        let image, video, music;

        if (req.files?.image) {
            image = await uploadToCloudinary(req.files.image[0], 'memories', 'image');
        }

        if (req.files?.video) {
            video = await uploadToCloudinary(req.files.video[0], 'memories', 'video');
        }

        if (req.files?.music) {
            music = await uploadToCloudinary(req.files.music[0], 'memories', 'video');
        }

        const memory = await Memory.create({
            text,
            date: new Date(),
            image,
            video,
            music,
            user: req.user.id
        });

        res.status(201).json(memory);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 👀 VER TODAS (LOS 2 PUEDEN VER)
exports.getMemories = async (req, res) => {
    try {
        const memories = await Memory.find()
            .populate('user', 'name');

        res.json(memories);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 👀 VER UNO
exports.getMemoryById = async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id)
            .populate('user', 'name');

        if (!memory) {
            return res.status(404).json({ message: "Recuerdo no encontrado" });
        }

        res.json(memory);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✏️ ACTUALIZAR (SOLO ADMIN)
exports.updateMemory = async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);

        if (!memory) {
            return res.status(404).json({ message: "Recuerdo no encontrado" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Solo tú puedes editar recuerdos 💌" });
        }

        // Actualizar texto y fecha
        if (req.body.text !== undefined) memory.text = req.body.text;
        if (req.body.date !== undefined) memory.date = req.body.date;

        // Obtener flags de eliminación
        const { removeImage, removeVideo, removeAudio } = req.body;

        // ========== MANEJAR IMAGEN ==========
        if (req.files?.image) {
            // Subir nueva imagen
            const imageUrl = await uploadToCloudinary(req.files.image[0], 'memories', 'image');
            memory.image = imageUrl;
        } else if (removeImage === 'true') {
            // Eliminar imagen existente
            memory.image = null;
        }

        // ========== MANEJAR VIDEO ==========
        if (req.files?.video) {
            // Subir nuevo video
            const videoUrl = await uploadToCloudinary(req.files.video[0], 'memories', 'video');
            memory.video = videoUrl;
        } else if (removeVideo === 'true') {
            // Eliminar video existente
            memory.video = null;
        }

        // ========== MANEJAR AUDIO ==========
        if (req.files?.music) {
            // Subir nuevo audio
            const audioUrl = await uploadToCloudinary(req.files.music[0], 'memories', 'auto');
            memory.music = audioUrl;
        } else if (removeAudio === 'true') {
            // Eliminar audio existente
            memory.music = null;
        }

        await memory.save();

        res.json({
            message: "Recuerdo actualizado exitosamente",
            memory
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// 🗑️ ELIMINAR (SOLO ADMIN)
exports.deleteMemory = async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);

        if (!memory) {
            return res.status(404).json({ message: "Recuerdo no encontrado" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Solo tú puedes eliminar recuerdos 💔" });
        }

        await memory.deleteOne();

        res.json({ message: "Recuerdo eliminado 💔" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN - Obtener todos los recuerdos (para administrar)
exports.getAllMemories = async (req, res) => {
    try {
        const memories = await Memory.find()
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(memories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};