const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Получить профиль пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *     responses:
 *       200:
 *         description: Данные пользователя
 */
router.get('/:id?', authenticate, userController.getUserProfile);

/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Получить статистику пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *     responses:
 *       200:
 *         description: Статистика
 */
router.get('/:id?/stats', authenticate, userController.getUserStats);

module.exports = router;