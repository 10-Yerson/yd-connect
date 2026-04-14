const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },

    image: String,
    video: String,
    music: String,

    date: {
        type: Date,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Memory', memorySchema);