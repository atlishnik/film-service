const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Все эндпоинты требуют авторизации
router.use(authenticate);

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     summary: Получить закладки пользователя
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список закладок
 */
router.get('/', bookmarkController.getUserBookmarks);

/**
 * @swagger
 * /bookmarks/folders:
 *   get:
 *     summary: Получить папки с закладками
 *     tags: [Bookmarks]
 *     responses:
 *       200:
 *         description: Список папок
 */
router.get('/folders', bookmarkController.getUserFolders);

/**
 * @swagger
 * /bookmarks:
 *   post:
 *     summary: Добавить фильм в закладки
 *     tags: [Bookmarks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movie_id
 *             properties:
 *               movie_id:
 *                 type: integer
 *               folder:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Фильм добавлен в закладки
 */
router.post('/', bookmarkController.addBookmark);

/**
 * @swagger
 * /bookmarks/{id}:
 *   put:
 *     summary: Обновить закладку
 *     tags: [Bookmarks]
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
 *               folder:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Закладка обновлена
 */
router.put('/:id', bookmarkController.updateBookmark);

/**
 * @swagger
 * /bookmarks/{id}:
 *   delete:
 *     summary: Удалить закладку
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Закладка удалена
 */
router.delete('/:id', bookmarkController.removeBookmark);

module.exports = router;