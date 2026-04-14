const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    media: {
        image: String,
        video: String
    },

    status: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'cumplida'],
        default: 'pendiente'
    }

}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);