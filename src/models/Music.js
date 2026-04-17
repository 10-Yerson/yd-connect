const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    album: {
        type: String,
        default: ''
    },
    genre: {
        type: String,
        default: ''
    },
    year: {
        type: String,
        default: ''
    },
    duration: {
        type: String,
        default: '0:00'
    },
    durationSeconds: {
        type: Number,
        default: 0
    },
    coverImage: {
        type: String,
        default: ''
    },
    audioUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Music', musicSchema);