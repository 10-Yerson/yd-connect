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

        // 📸 uploads
        const imageUrl = req.files?.image?.[0]
            ? await uploadToCloudinary(req.files.image[0], 'letters/images', 'image')
            : null;

        const videoUrl = req.files?.video?.[0]
            ? await uploadToCloudinary(req.files.video[0], 'letters/videos', 'video')
            : null;

        const audioUrl = req.files?.audio?.[0]
            ? await uploadToCloudinary(req.files.audio[0], 'letters/audio', 'video')
            : null;

        // 🔥 CORREGIDO → SIEMPRE día 1
        const openedAt = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + (month - 1),
            1
        );

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

        if (month && month !== letter.month) {

            const openedAt = new Date(
                startDate.getFullYear(),
                startDate.getMonth() + (month - 1),
                1 // 🔥 día 1 siempre
            );

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

        // 🔥 CORREGIDO
        let currentMonth =
            diffMonths < 1 ? 0 : Math.min(12, diffMonths);

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
        // const now = new Date('2026-12-01');
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
        const totalMonths = 12;

        // 📅 fecha final (1 año)
        const endDate = new Date(
            startDate.getFullYear() + 1,
            startDate.getMonth(),
            1 // 🔥 SIEMPRE día 1
        );

        // 🧠 calcular meses desde inicio
        let diffMonths =
            (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth());

        if (now < startDate) diffMonths = -1;

        const currentMonth =
            diffMonths < 0 ? 0 : Math.min(totalMonths, diffMonths + 1);

        const finished = now >= endDate;

        // 📅 siguiente mes
        const nextMonth =
            currentMonth === 0 ? 1 :
                currentMonth < totalMonths ? currentMonth + 1 :
                    null;

        // 📅 próxima carta
        let nextUnlockDate = null;

        if (!finished) {
            nextUnlockDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth() + (currentMonth === 0 ? 0 : currentMonth),
                1 // 🔥 día 1
            );
        }

        // ⏳ tiempo hasta próxima carta
        let days = 0, hours = 0, minutes = 0;

        if (nextUnlockDate) {
            const diff = Math.max(0, nextUnlockDate - now);

            days = Math.floor(diff / (1000 * 60 * 60 * 24));
            hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            minutes = Math.floor((diff / (1000 * 60)) % 60);
        }

        // 🔥 tiempo REAL hasta el final (meses + días)
        const calculateRealMonthsAndDays = (from, to) => {
            let tempDate = new Date(from);
            let months = 0;

            while (true) {
                let nextMonth = new Date(tempDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                if (nextMonth <= to) {
                    months++;
                    tempDate = nextMonth;
                } else break;
            }

            const days = Math.floor(
                (to - tempDate) / (1000 * 60 * 60 * 24)
            );

            return { months, days };
        };

        const remainingTime = calculateRealMonthsAndDays(now, endDate);

        // 📊 progreso (solo si inició)
        const unlocked =
            now < startDate
                ? 0
                : await Letter.countDocuments({
                    openedAt: { $lte: now }
                });

        const percentage = Math.round((unlocked / totalMonths) * 100);

        // 👁️ no vistas
        const unseen =
            now < startDate
                ? 0
                : await Letter.countDocuments({
                    openedAt: { $lte: now },
                    viewedBy: { $ne: req.user.id }
                });

        // 💌 mensaje emocional
        let message = "";
        if (currentMonth === 0) {
            message = "Aún no comienza nuestra historia 💖";
        } else if (percentage < 25) {
            message = "Esto apenas comienza 💖";
        } else if (percentage < 50) {
            message = "Nuestro tiempo sigue creciendo...";
        } else if (percentage < 75) {
            message = "Ya hemos vivido mucho juntos 🥺";
        } else {
            message = "Casi llegamos al final… pero siempre serás tú 💖";
        }

        res.json({
            finished,
            monthsTogether: currentMonth,
            message,

            progress: {
                total: totalMonths,
                unlocked,
                remaining: Math.max(0, totalMonths - unlocked),
                percentage
            },

            countdown: {
                nextMonth,
                nextUnlockDate,
                timeLeft: { days, hours, minutes }
            },

            // 🔥 NUEVO (TIEMPO REAL RESTANTE)
            remainingTime: {
                months: remainingTime.months,
                days: remainingTime.days
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


exports.getPublicCountdown = (req, res) => {
    try {
        const now = new Date();
        const totalMonths = 12;

        // 📅 Fecha final (1 año después)
        const endDate = new Date(
            startDate.getFullYear() + 1,
            startDate.getMonth(),
            1
        );

        // 🧠 diferencia de meses desde inicio
        let diffMonths =
            (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth());

        const notStarted = now < startDate;
        const finished = now >= endDate;

        let months = 0;
        let days = 0;
        let hours = 0;
        let minutes = 0;
        let currentMonth = 0;
        let progress = 0;
        let message = "";
        let nextUnlockDate = null;

        // 🔥 FUNCIÓN PARA CALCULAR MESES REALES
        const calculateRealMonthsAndDays = (from, to) => {
            let tempDate = new Date(from);
            let months = 0;

            while (true) {
                let nextMonth = new Date(tempDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                if (nextMonth <= to) {
                    months++;
                    tempDate = nextMonth;
                } else break;
            }

            const days = Math.floor(
                (to - tempDate) / (1000 * 60 * 60 * 24)
            );

            return { months, days };
        };

        // ⏳ NO INICIADO
        if (notStarted) {
            currentMonth = 0;
            progress = 0;

            const diff = startDate - now;

            const time = calculateRealMonthsAndDays(now, startDate);

            months = time.months;
            days = time.days;

            hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            minutes = Math.floor((diff / (1000 * 60)) % 60);

            nextUnlockDate = new Date(startDate);

            message = "Aún no empieza… pero ya estoy preparando algo solo para ti 💖";
        }

        // 💖 EN PROGRESO
        else if (!finished) {
            const safeMonths = Math.max(0, diffMonths);

            currentMonth = safeMonths + 1;
            progress = Math.floor((currentMonth / totalMonths) * 100);

            const time = calculateRealMonthsAndDays(now, endDate);

            months = time.months;
            days = time.days;

            const diff = endDate - now;

            hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            minutes = Math.floor((diff / (1000 * 60)) % 60);

            nextUnlockDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth() + safeMonths + 1,
                1
            );

            message = "Cada mes es una parte de mí llegando a ti 💌";
        }

        // 🕊️ TERMINADO
        else {
            currentMonth = totalMonths;
            progress = 100;

            months = 0;
            days = 0;
            hours = 0;
            minutes = 0;

            message = "Ya viviste toda la historia… pero nunca termina lo que sentimos 💖";
        }

        return res.json({
            status: notStarted
                ? "not_started"
                : finished
                    ? "finished"
                    : "in_progress",

            phase: {
                code: notStarted ? "waiting" : finished ? "completed" : "living",
                label: notStarted
                    ? "Esperando el inicio 💫"
                    : finished
                        ? "Historia completa 🕊️"
                        : "Historia en curso 💖"
            },

            progress,
            currentMonth,

            timeLeft: {
                months,
                days,
                hours,
                minutes
            },

            nextUnlockDate,
            endDate, // 🔥 importante para frontend también

            message
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error público" });
    }
};

// ADMIN - Obtener todas las cartas (para administrar)
exports.getAllLetters = async (req, res) => {
    try {
        const letters = await Letter.find().sort({ month: 1 });
        res.json(letters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener las cartas' });
    }
};

// ADMIN - Eliminar carta
exports.deleteLetter = async (req, res) => {
    try {
        const letter = await Letter.findById(req.params.id);
        
        if (!letter) {
            return res.status(404).json({ msg: 'Carta no encontrada' });
        }
        
        await letter.deleteOne();
        res.json({ msg: 'Carta eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al eliminar la carta' });
    }
};