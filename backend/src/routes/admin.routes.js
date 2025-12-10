const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { posterUpload, backdropUpload, personUpload } = require('../middleware/upload.middleware');

// Все эндпоинты требуют роли ADMIN
router.use(authenticate, authorize(['ADMIN']));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Получить всех пользователей
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Обновить пользователя
 *     tags: [Admin]
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
 *               role:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Пользователь удален
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Получить статистику сервиса
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Статистика
 */
router.get('/stats', adminController.getServiceStats);

/**
 * @swagger
 * /admin/reviews/{id}/approve:
 *   post:
 *     summary: Одобрить отзыв
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Отзыв одобрен
 */
router.post('/reviews/:id/approve', adminController.approveReview);

/**
 * @swagger
 * /admin/reviews/{id}/reject:
 *   post:
 *     summary: Отклонить отзыв
 *     tags: [Admin]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Отзыв отклонен
 */
router.post('/reviews/:id/reject', adminController.rejectReview);

/**
 * @swagger
 * /admin/movies:
 *   post:
 *     summary: Создать фильм
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               original_title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               release_year:
 *                 type: integer
 *               country:
 *                 type: string
 *               duration:
 *                 type: integer
 *               director_id:
 *                 type: integer
 *               genres:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Фильм создан
 */
router.post('/movies', adminController.createMovie);

/**
 * @swagger
 * /admin/movies/{id}:
 *   put:
 *     summary: Обновить фильм
 *     tags: [Admin]
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
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               genres:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Фильм обновлен
 */
router.put('/movies/:id', adminController.updateMovie);

/**
 * @swagger
 * /admin/movies/{id}:
 *   delete:
 *     summary: Удалить фильм
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Фильм удален
 */
router.delete('/movies/:id', adminController.deleteMovie);

// Загрузка изображений
router.post('/upload/poster', posterUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Файл не загружен' });
  }
  const url = `/uploads/posters/${req.file.filename}`;
  res.json({ success: true, url });
});

router.post('/upload/backdrop', backdropUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Файл не загружен' });
  }
  const url = `/uploads/backdrops/${req.file.filename}`;
  res.json({ success: true, url });
});

router.post('/upload/person', personUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Файл не загружен' });
  }
  const url = `/uploads/persons/${req.file.filename}`;
  res.json({ success: true, url });
});


module.exports = router;
