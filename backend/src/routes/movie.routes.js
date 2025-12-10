const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Получить список фильмов
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Список фильмов
 */
router.get('/', movieController.getAllMovies);

/**
 * @swagger
 * /movies/popular:
 *   get:
 *     summary: Получить популярные фильмы
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Список популярных фильмов
 */
router.get('/popular', movieController.getPopularMovies);

/**
 * @swagger
 * /movies/genres:
 *   get:
 *     summary: Получить список жанров
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Список жанров
 */
router.get('/genres', movieController.getGenres);

/**
 * @swagger
 * /movies/search:
 *   get:
 *     summary: Поиск фильмов
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: year_from
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year_to
 *         schema:
 *           type: integer
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [rating, year_asc, year_desc, title]
 *     responses:
 *       200:
 *         description: Результаты поиска
 */
router.get('/search', movieController.searchMovies);

/**
 * @swagger
 * /movies/stats:
 *   get:
 *     summary: Получить статистику по фильмам
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Статистика фильмов
 */
router.get('/stats', movieController.getMovieStats);

/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Получить фильм по ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные фильма
 *       404:
 *         description: Фильм не найден
 */
router.get('/:id', movieController.getMovieById);

/**
 * @swagger
 * /movies/slug/{slug}:
 *   get:
 *     summary: Получить фильм по slug
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные фильма
 *       404:
 *         description: Фильм не найден
 */
router.get('/slug/:slug', movieController.getMovieBySlug);

// Лайки фильма
router.post('/:id/like', authenticate, movieController.likeMovie);
router.delete('/:id/like', authenticate, movieController.unlikeMovie);

module.exports = router;
