const Memory = require('../models/memory');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');


// 👑 CREAR (SOLO ADMIN - tú)
exports.createMemory = async (req, res) => {
    try {
        const { text, date } = req.body;

        let image, video, music;

        if (req.files?.image) {
            // Imagen a carpeta memories/images
            image = await uploadToCloudinary(req.files.image[0], 'memories/images', 'image');
        }

        if (req.files?.video) {
            // Video a carpeta memories/videos
            video = await uploadToCloudinary(req.files.video[0], 'memories/videos', 'video');
        }

        if (req.files?.music) {
            // Audio a carpeta memories/audio (subido como video)
            music = await uploadToCloudinary(req.files.music[0], 'memories/audio', 'video');
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

        if (req.files?.image) {
            if (memory.image) {
                await deleteFromCloudinary(memory.image);
            }
            // Subir nueva imagen a carpeta memories/images
            const imageUrl = await uploadToCloudinary(req.files.image[0], 'memories/images', 'image');
            memory.image = imageUrl;
        } else if (removeImage === 'true') {
            if (memory.image) {
                await deleteFromCloudinary(memory.image);
            }
            memory.image = null;
        }

        if (req.files?.video) {
            if (memory.video) {
                await deleteFromCloudinary(memory.video);
            }
            // Subir nuevo video a carpeta memories/videos
            const videoUrl = await uploadToCloudinary(req.files.video[0], 'memories/videos', 'video');
            memory.video = videoUrl;
        } else if (removeVideo === 'true') {
            if (memory.video) {
                await deleteFromCloudinary(memory.video);
            }
            memory.video = null;
        }

        if (req.files?.music) {
            if (memory.music) {
                await deleteFromCloudinary(memory.music);
            }
            // Subir nuevo audio a carpeta memories/audio (como video)
            const audioUrl = await uploadToCloudinary(req.files.music[0], 'memories/audio', 'video');
            memory.music = audioUrl;
        } else if (removeAudio === 'true') {
            if (memory.music) {
                await deleteFromCloudinary(memory.music);
            }
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

        // Eliminar todos los archivos de Cloudinary antes de borrar el recuerdo
        if (memory.image) {
            await deleteFromCloudinary(memory.image);
        }
        if (memory.video) {
            await deleteFromCloudinary(memory.video);
        }
        if (memory.music) {
            await deleteFromCloudinary(memory.music);
        }

        await memory.deleteOne();

        res.json({ message: "Recuerdo eliminado 💔" });

    } catch (error) {
        console.error(error);
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