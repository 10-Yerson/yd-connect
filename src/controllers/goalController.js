const Goal = require('../models/goal');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


// 👑 CREAR META
exports.createGoal = async (req, res) => {
    try {
        const { title, description } = req.body;

        const media = {};

        if (req.files?.image) {
            media.image = await uploadToCloudinary(req.files.image[0], 'goals');
        }

        if (req.files?.video) {
            media.video = await uploadToCloudinary(req.files.video[0], 'goals', 'video');
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


// ✏️ ACTUALIZAR META (texto)
exports.updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: "Meta no encontrada" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "No autorizado" });
        }

        goal.title = req.body.title || goal.title;
        goal.description = req.body.description || goal.description;

        await goal.save();

        res.json(goal);

    } catch (error) {
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

        await goal.deleteOne();

        res.json({ message: "Meta eliminada 💔" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};