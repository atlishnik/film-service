const express = require('express');
const router = express.Router();
const directorController = require('../controllers/director.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /directors:
 *   get:
 *     summary: Получить список режиссеров
 *     tags: [Directors]
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
 *         description: Список режиссеров
 */
router.get('/', directorController.getAllDirectors);

/**
 * @swagger
 * /directors/search:
 *   get:
 *     summary: Поиск режиссеров
 *     tags: [Directors]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name_asc, name_desc, movies_desc, rating_desc]
 *     responses:
 *       200:
 *         description: Результаты поиска
 */
router.get('/search', directorController.searchDirectors);

/**
 * @swagger
 * /directors/popular:
 *   get:
 *     summary: Получить популярных режиссеров
 *     tags: [Directors]
 *     responses:
 *       200:
 *         description: Список популярных режиссеров
 */
router.get('/popular', directorController.getPopularDirectors);

/**
 * @swagger
 * /directors/stats:
 *   get:
 *     summary: Получить статистику по режиссерам
 *     tags: [Directors]
 *     responses:
 *       200:
 *         description: Статистика режиссеров
 */
router.get('/stats', directorController.getDirectorsStats);

/**
 * @swagger
 * /directors/{id}:
 *   get:
 *     summary: Получить режиссера по ID
 *     tags: [Directors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные режиссера
 *       404:
 *         description: Режиссер не найден
 */
router.get('/:id', directorController.getDirectorById);

/**
 * @swagger
 * /directors/{id}/movies:
 *   get:
 *     summary: Получить фильмы режиссера
 *     tags: [Directors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Фильмы режиссера
 *       404:
 *         description: Режиссер не найден
 */
router.get('/:id/movies', directorController.getDirectorMovies);

/**
 * @swagger
 * /directors:
 *   post:
 *     summary: Создать нового режиссера
 *     tags: [Directors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *             properties:
 *               full_name:
 *                 type: string
 *               birth_date:
 *                 type: string
 *                 format: date
 *               country:
 *                 type: string
 *               biography:
 *                 type: string
 *               photo_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Режиссер создан
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав
 */
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  directorController.createDirector
);

/**
 * @swagger
 * /directors/{id}:
 *   put:
 *     summary: Обновить режиссера
 *     tags: [Directors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Director'
 *     responses:
 *       200:
 *         description: Режиссер обновлен
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав
 *       404:
 *         description: Режиссер не найден
 */
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  directorController.updateDirector
);

/**
 * @swagger
 * /directors/{id}:
 *   delete:
 *     summary: Удалить режиссер
 *     tags: [Directors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Режиссер удален
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав
 *       404:
 *         description: Режиссер не найден
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  directorController.deleteDirector
);

module.exports = router;
