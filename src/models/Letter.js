const mongoose = require('mongoose');

const LetterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },

    month: {
        type: Number, // 1 - 12
        required: true,
        min: 1,
        max: 12
    },

    year: {
        type: Number,
        default: () => new Date().getFullYear()
    },

    imageUrl: String,
    videoUrl: String,
    audioUrl: String,

    isActive: {
        type: Boolean,
        default: true
    },

    openedAt: {
        type: Date // cuando se desbloquea
    },

    seenAt: {
        type: Date, // cuando la usuaria la vio
        default: null
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Letter', LetterSchema);