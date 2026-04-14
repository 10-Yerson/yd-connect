const Letter = require('../models/Letter');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

// 🟢 Crear carta (ADMIN)
exports.createLetter = async (req, res) => {
    try {
        const { title, message, month } = req.body;

        const imageUrl = req.files?.image?.[0]
            ? await uploadToCloudinary(req.files.image[0], 'letters/images', 'image')
            : null;

        const videoUrl = req.files?.video?.[0]
            ? await uploadToCloudinary(req.files.video[0], 'letters/videos', 'video')
            : null;

        const audioUrl = req.files?.audio?.[0]
            ? await uploadToCloudinary(req.files.audio[0], 'letters/audio', 'video')
            : null;

        const openedAt = new Date();
        openedAt.setMonth(month - 1); // lógica base de mes

        const letter = await Letter.create({
            title,
            message,
            month,
            imageUrl,
            videoUrl,
            audioUrl,
            openedAt,
            createdBy: req.user.id
        });

        res.json({ msg: 'Carta creada', letter });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error creando carta' });
    }
};

exports.updateLetter = async (req, res) => {
    try {
        const letter = await Letter.findById(req.params.id);

        if (!letter) {
            return res.status(404).json({ msg: 'Carta no encontrada' });
        }

        const { title, message, month } = req.body;

        letter.title = title || letter.title;
        letter.message = message || letter.message;
        letter.month = month || letter.month;

        await letter.save();

        res.json({ msg: 'Carta actualizada', letter });

    } catch (error) {
        res.status(500).json({ msg: 'Error actualizando carta' });
    }
};

exports.getLettersForUser = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;

        const letters = await Letter.find({ isActive: true });

        const formatted = letters.map(letter => {
            const isUnlocked = currentMonth >= letter.month;

            return {
                ...letter.toObject(),
                isUnlocked,
                seen: !!letter.seenAt
            };
        });

        res.json(formatted);

    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo cartas' });
    }
};

exports.markAsSeen = async (req, res) => {
    try {
        const letter = await Letter.findById(req.params.id);

        if (!letter) {
            return res.status(404).json({ msg: 'Carta no encontrada' });
        }

        letter.seenAt = new Date();

        await letter.save();

        res.json({ msg: 'Carta marcada como vista' });

    } catch (error) {
        res.status(500).json({ msg: 'Error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;

        const letters = await Letter.find({
            month: { $lte: currentMonth }
        }).sort({ month: 1 });

        res.json(letters);

    } catch (error) {
        res.status(500).json({ msg: 'Error historial' });
    }
};