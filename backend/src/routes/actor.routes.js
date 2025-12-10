const express = require('express');
const router = express.Router();
const actorController = require('../controllers/actor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /actors:
 *   get:
 *     summary: Получить список актеров
 *     tags: [Actors]
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
 *         description: Список актеров
 */
router.get('/', actorController.getAllActors);

/**
 * @swagger
 * /actors/search:
 *   get:
 *     summary: Поиск актеров
 *     tags: [Actors]
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
 *           enum: [name_asc, name_desc, birth_date_asc, birth_date_desc]
 *     responses:
 *       200:
 *         description: Результаты поиска
 */
router.get('/search', actorController.searchActors);

/**
 * @swagger
 * /actors/popular:
 *   get:
 *     summary: Получить популярных актеров
 *     tags: [Actors]
 *     responses:
 *       200:
 *         description: Список популярных актеров
 */
router.get('/popular', actorController.getPopularActors);

/**
 * @swagger
 * /actors/stats:
 *   get:
 *     summary: Получить статистику по актерам
 *     tags: [Actors]
 *     responses:
 *       200:
 *         description: Статистика актеров
 */
router.get('/stats', actorController.getActorsStats);

/**
 * @swagger
 * /actors/{id}:
 *   get:
 *     summary: Получить актера по ID
 *     tags: [Actors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные актера
 *       404:
 *         description: Актер не найден
 */
router.get('/:id', actorController.getActorById);

/**
 * @swagger
 * /actors/{id}/movies:
 *   get:
 *     summary: Получить фильмы актера
 *     tags: [Actors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Фильмы актера
 *       404:
 *         description: Актер не найден
 */
router.get('/:id/movies', actorController.getActorMovies);

/**
 * @swagger
 * /actors:
 *   post:
 *     summary: Создать нового актера
 *     tags: [Actors]
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
 *         description: Актер создан
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав
 */
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  actorController.createActor
);

/**
 * @swagger
 * /actors/{id}:
 *   put:
 *     summary: Обновить актера
 *     tags: [Actors]
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
 *             $ref: '#/components/schemas/Actor'
 *     responses:
 *       200:
 *         description: Актер обновлен
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав
 *       404:
 *         description: Актер не найден
 */
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  actorController.updateActor
);

/**
 * @swagger
 * /actors/{id}:
 *   delete:
 *     summary: Удалить актера
 *     tags: [Actors]
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
 *         description: Актер удален
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав
 *       404:
 *         description: Актер не найден
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  actorController.deleteActor
);

module.exports = router;
