const Memory = require('../models/memory');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


// 👑 CREAR (SOLO ADMIN - tú)
exports.createMemory = async (req, res) => {
    try {
        const { text, date } = req.body;

        let image, video, music;

        if (req.files?.image) {
            image = await uploadToCloudinary(req.files.image[0], 'memories');
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

        memory.text = req.body.text || memory.text;
        memory.date = req.body.date || memory.date;

        await memory.save();

        res.json(memory);

    } catch (error) {
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