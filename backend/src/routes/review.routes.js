const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Создать отзыв
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movie_id
 *               - rating
 *             properties:
 *               movie_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               title:
 *                 type: string
 *               review_text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Отзыв создан
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Обновить отзыв
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               title:
 *                 type: string
 *               review_text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Отзыв обновлен
 */
router.put('/:id', authenticate, reviewController.updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Удалить отзыв
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Отзыв удален
 */
router.delete('/:id', authenticate, reviewController.deleteReview);

/**
 * @swagger
 * /reviews/movie/{movie_id}:
 *   get:
 *     summary: Получить отзывы к фильму
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список отзывов
 */
router.get('/movie/:movie_id', optionalAuthenticate, reviewController.getMovieReviews);

/**
 * @swagger
 * /reviews/user/{id}:
 *   get:
 *     summary: Получить отзывы пользователя
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список отзывов
 */
router.get('/user/:id?', authenticate, reviewController.getUserReviews);

// Последние отзывы
router.get('/latest', optionalAuthenticate, reviewController.getLatestReviews);

/**
 * @swagger
 * /reviews/{id}/like:
 *   post:
 *     summary: Лайкнуть отзыв
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Лайк добавлен
 */
router.post('/:id/like', authenticate, reviewController.likeReview);

module.exports = router;
