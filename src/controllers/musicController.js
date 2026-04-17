const Music = require('../models/Music');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const musicMetadata = require('music-metadata');

// ADMIN - Subir canción (extrae todo automáticamente)
const uploadSong = async (req, res) => {
    try {
        if (!req.files || !req.files.audio) {
            return res.status(400).json({ msg: 'El archivo de audio es obligatorio' });
        }

        const audioFile = req.files.audio[0];
        
        // Extraer TODOS los metadatos del audio
        let metadata = {
            title: audioFile.originalname.replace(/\.[^/.]+$/, ''),
            artist: 'Artista desconocido',
            album: '',
            genre: '',
            year: '',
            duration: '0:00',
            durationSeconds: 0,
            coverImage: ''
        };

        try {
            const parsedMetadata = await musicMetadata.parseBuffer(audioFile.buffer, {
                mimeType: audioFile.mimetype,
                size: audioFile.size
            });
            
            const common = parsedMetadata.common;
            
            metadata = {
                title: common.title || audioFile.originalname.replace(/\.[^/.]+$/, ''),
                artist: common.artist || common.artists?.[0] || 'Artista desconocido',
                album: common.album || '',
                genre: common.genre?.[0] || '',
                year: common.year ? common.year.toString() : '',
                duration: formatDuration(parsedMetadata.format.duration || 0),
                durationSeconds: Math.floor(parsedMetadata.format.duration || 0),
                coverImage: ''
            };

            // Extraer imagen de portada del MP3
            if (common.picture && common.picture[0]) {
                try {
                    const picture = common.picture[0];
                    const coverBuffer = Buffer.from(picture.data);
                    const coverFile = {
                        buffer: coverBuffer,
                        originalname: 'cover.jpg',
                        mimetype: picture.format
                    };
                    metadata.coverImage = await uploadToCloudinary(coverFile, 'music/covers', 'image');
                } catch (error) {
                    console.log('No se pudo extraer la imagen de portada');
                }
            }

        } catch (error) {
            console.log('Error al leer metadatos:', error.message);
        }

        // Subir audio a Cloudinary
        const audioUrl = await uploadToCloudinary(audioFile, 'music/audios', 'auto');

        // Crear canción
        const song = await Music.create({
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            genre: metadata.genre,
            year: metadata.year,
            duration: metadata.duration,
            durationSeconds: metadata.durationSeconds,
            coverImage: metadata.coverImage,
            audioUrl,
            createdBy: req.user.id
        });

        res.status(201).json({
            msg: 'Canción subida exitosamente',
            song
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al subir la canción' });
    }
};

// ADMIN - Eliminar canción
const deleteSong = async (req, res) => {
    try {
        const song = await Music.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ msg: 'Canción no encontrada' });
        }
        await song.deleteOne();
        res.status(200).json({ msg: 'Canción eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al eliminar la canción' });
    }
};

// ADMIN - Obtener todas las canciones
const getAllSongs = async (req, res) => {
    try {
        const songs = await Music.find().sort({ createdAt: -1 });
        res.status(200).json(songs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener las canciones' });
    }
};

// USER - Obtener canciones
const getSongsForUser = async (req, res) => {
    try {
        const songs = await Music.find().sort({ createdAt: -1 });
        res.status(200).json(songs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener las canciones' });
    }
};

// USER - Obtener una canción
const getSongById = async (req, res) => {
    try {
        const song = await Music.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ msg: 'Canción no encontrada' });
        }
        res.status(200).json(song);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener la canción' });
    }
};

// Función para formatear duración
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    uploadSong,
    deleteSong,
    getAllSongs,
    getSongsForUser,
    getSongById
};