const Letter = require('../models/Letter');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const { startDate } = require('../config/appConfig');

// 🟢 Crear carta (ADMIN)
exports.createLetter = async (req, res) => {
    try {
        const { title, message, month } = req.body;

        if (!month || month < 1 || month > 12) {
            return res.status(400).json({ msg: 'Mes inválido (1-12)' });
        }

        // const existing = await Letter.findOne({ month });
        // if (existing) {
        //     return res.status(400).json({ msg: 'Ya existe una carta para este mes' });
        // }

        const now = new Date();

        // 🔥 Calcular mes actual basado en startDate
        const diffMonths =
            (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth()) + 1;

        const currentMonth = Math.max(1, diffMonths);

        if (month < currentMonth) {
            return res.status(400).json({
                msg: `No puedes crear cartas en meses pasados. Mes actual: ${currentMonth}`
            });
        }

        // 📸 Subidas
        const imageUrl = req.files?.image?.[0]
            ? await uploadToCloudinary(req.files.image[0], 'letters/images', 'image')
            : null;

        const videoUrl = req.files?.video?.[0]
            ? await uploadToCloudinary(req.files.video[0], 'letters/videos', 'video')
            : null;

        const audioUrl = req.files?.audio?.[0]
            ? await uploadToCloudinary(req.files.audio[0], 'letters/audio', 'video')
            : null;

        const openedAt = new Date(startDate);
        openedAt.setMonth(startDate.getMonth() + (month - 1));

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

        if (month && (month < 1 || month > 12)) {
            return res.status(400).json({ msg: 'Mes inválido' });
        }

        // Evitar duplicados
        if (month && month !== letter.month) {
            const existing = await Letter.findOne({ month });
            if (existing) {
                return res.status(400).json({ msg: 'Ya existe una carta en ese mes' });
            }

            // 🔥 recalcular fecha
            const openedAt = new Date(startDate);
            openedAt.setMonth(startDate.getMonth() + (month - 1));

            letter.month = month;
            letter.openedAt = openedAt;
        }

        letter.title = title || letter.title;
        letter.message = message || letter.message;

        await letter.save();

        res.json({ msg: 'Carta actualizada', letter });

    } catch (error) {
        res.status(500).json({ msg: 'Error actualizando carta' });
    }
};

exports.getLettersForUser = async (req, res) => {
    try {
        const now = new Date();

        const diffMonths =
            (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth()) + 1;

        const currentMonth = Math.min(12, Math.max(1, diffMonths));

        const letters = await Letter.find().sort({ month: 1 });

        const formatted = letters.map(letter => {
            const isUnlocked = currentMonth >= letter.month;

            const isViewed = letter.viewedBy?.includes(req.user.id);

            return {
                ...letter.toObject(),
                isUnlocked,
                isViewed,
                status: isUnlocked
                    ? isViewed
                        ? 'vista'
                        : 'disponible'
                    : 'bloqueada'
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

        if (!letter.viewedBy.includes(req.user.id)) {
            letter.viewedBy.push(req.user.id);
            await letter.save();
        }

        res.json({ msg: 'Carta marcada como vista' });

    } catch (error) {
        res.status(500).json({ msg: 'Error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const now = new Date();

        const letters = await Letter.find({
            openedAt: { $lte: now }
        }).sort({ month: 1 });

        res.json(letters);

    } catch (error) {
        res.status(500).json({ msg: 'Error historial' });
    }
};

exports.getCountdownAndProgress = async (req, res) => {
    try {
        const now = new Date();

        const diffMonths =
            (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth()) + 1;

        const currentMonth = Math.min(12, Math.max(1, diffMonths));

        const totalMonths = 12;

        const unlocked = await Letter.countDocuments({
            openedAt: { $lte: now }
        });

        const percentage = Math.round((unlocked / totalMonths) * 100);

        const nextMonth = currentMonth < 12 ? currentMonth + 1 : null;

        const nextUnlockDate = new Date(startDate);
        nextUnlockDate.setMonth(startDate.getMonth() + currentMonth);

        const diff = Math.max(0, nextUnlockDate - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);

        const unseen = await Letter.countDocuments({
            openedAt: { $lte: now },
            viewedBy: { $ne: req.user.id }
        });

        res.json({
            monthsTogether: currentMonth,
            progress: {
                total: totalMonths,
                unlocked,
                remaining: totalMonths - unlocked,
                percentage
            },
            countdown: {
                nextMonth,
                nextUnlockDate,
                timeLeft: {
                    days,
                    hours,
                    minutes
                }
            },
            notifications: {
                unseenLetters: unseen
            }
        });

    } catch (error) {
        console.error("ERROR STATUS:", error);
        res.status(500).json({ msg: 'Error obteniendo datos' });
    }
};