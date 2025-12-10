const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genre.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Создать жанр
router.post('/', authenticate, authorize(['ADMIN']), genreController.createGenre);

// Обновить жанр
router.put('/:id', authenticate, authorize(['ADMIN']), genreController.updateGenre);

// Удалить жанр
router.delete('/:id', authenticate, authorize(['ADMIN']), genreController.deleteGenre);

module.exports = router;
