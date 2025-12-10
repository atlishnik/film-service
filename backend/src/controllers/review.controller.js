const { Review, Movie, User, ReviewLike, sequelize } = require('../models');
const { Op } = require('sequelize');

class ReviewController {
  async createReview(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { movie_id, rating, title, review_text } = req.body;
      const user_id = req.user.user_id;
      
      // Валидация
      if (!movie_id || !rating) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Фильм и оценка обязательны'
        });
      }
      
      if (rating < 1 || rating > 10) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Оценка должна быть от 1 до 10'
        });
      }
      
      // Проверка существования фильма
      const movie = await Movie.findByPk(movie_id, { transaction });
      if (!movie) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Фильм не найден'
        });
      }
      
      // Проверка, не оставлял ли пользователь уже отзыв
      const existingReview = await Review.findOne({
        where: { movie_id, user_id },
        transaction
      });
      
      if (existingReview) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Вы уже оставили отзыв на этот фильм'
        });
      }
      
      // Создание отзыва
      const review = await Review.create({
        movie_id,
        user_id,
        rating,
        title,
        review_text,
        is_approved: true
      }, { transaction });
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async getLatestReviews(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const reviews = await Review.findAll({
        where: { is_approved: true },
        include: [
          { model: User, attributes: ['username', 'avatar_url'] },
          { model: Movie, attributes: ['title', 'slug'] }
        ],
        order: [['created_at', 'DESC']],
        limit
      });
      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }
  
  async updateReview(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { rating, title, review_text, is_approved } = req.body;
      const user_id = req.user.user_id;
      
      const review = await Review.findByPk(id, { transaction });
      
      if (!review) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Отзыв не найден'
        });
      }
      
      // Проверка прав: только автор или админ
      if (review.user_id !== user_id && req.user.role === 'USER') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Нет прав для редактирования этого отзыва'
        });
      }
      
      // Валидация рейтинга
      if (rating && (rating < 1 || rating > 10)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Оценка должна быть от 1 до 10'
        });
      }
      
      const updateData = {
        updated_at: new Date()
      };
      
      if (rating !== undefined) updateData.rating = rating;
      if (title !== undefined) updateData.title = title;
      if (review_text !== undefined) updateData.review_text = review_text;
      // Администратор может скрыть или восстановить отзыв через is_approved
      if (is_approved !== undefined && req.user.role === 'ADMIN') {
        updateData.is_approved = !!is_approved;
      }
      
      await review.update(updateData, { transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  async deleteReview(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const review = await Review.findByPk(id, { transaction });
      
      if (!review) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Отзыв не найден'
        });
      }
      
      // Проверка прав
      if (review.user_id !== user_id && req.user.role === 'USER') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Нет прав для удаления этого отзыва'
        });
      }
      
      await review.destroy({ transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Отзыв успешно удален'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  async getMovieReviews(req, res, next) {
    try {
      const { movie_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const where = { movie_id };
      if (req.user) {
        where[Op.or] = [{ is_approved: true }, { user_id: req.user.user_id }];
      } else {
        where.is_approved = true;
      }

      const { count, rows: reviews } = await Review.findAndCountAll({
        where,
        include: [{
          model: User,
          attributes: ['user_id', 'username', 'avatar_url']
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      res.json({
        success: true,
        data: reviews,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getUserReviews(req, res, next) {
    try {
      const user_id = req.params.id || req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { user_id },
        include: [{
          model: Movie,
          attributes: ['movie_id', 'title', 'slug', 'poster_url']
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      res.json({
        success: true,
        data: reviews,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async likeReview(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const review = await Review.findByPk(id, { transaction });
      
      if (!review) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Отзыв не найден'
        });
      }
      
      // Проверка, не лайкал ли уже пользователь
      const existingLike = await ReviewLike.findOne({
        where: { review_id: id, user_id },
        transaction
      });
      
      if (existingLike) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Вы уже лайкнули этот отзыв'
        });
      }
      
      // Проверка, не пытается ли пользователь лайкнуть свой собственный отзыв
      if (review.user_id === user_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Нельзя лайкать свой собственный отзыв'
        });
      }
      
      // Создание лайка (триггер автоматически увеличит likes_count)
      await ReviewLike.create({
        review_id: id,
        user_id
      }, { transaction });
      
      await transaction.commit();
      
      // Получаем обновленный отзыв
      const updatedReview = await Review.findByPk(id, {
        include: [{
          model: User,
          attributes: ['user_id', 'username', 'avatar_url']
        }]
      });
      
      res.json({
        success: true,
        data: updatedReview
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  async unlikeReview(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const review = await Review.findByPk(id, { transaction });
      
      if (!review) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Отзыв не найден'
        });
      }
      
      // Проверка существования лайка
      const existingLike = await ReviewLike.findOne({
        where: { review_id: id, user_id },
        transaction
      });
      
      if (!existingLike) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Вы еще не лайкнули этот отзыв'
        });
      }
      
      // Удаление лайка (триггер автоматически уменьшит likes_count)
      await existingLike.destroy({ transaction });
      
      await transaction.commit();
      
      // Получаем обновленный отзыв
      const updatedReview = await Review.findByPk(id, {
        include: [{
          model: User,
          attributes: ['user_id', 'username', 'avatar_url']
        }]
      });
      
      res.json({
        success: true,
        data: updatedReview
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  async getReviewLikes(req, res, next) {
    try {
      const { id } = req.params;
      
      const likes = await ReviewLike.findAll({
        where: { review_id: id },
        include: [{
          model: User,
          attributes: ['user_id', 'username', 'avatar_url']
        }],
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        success: true,
        data: likes
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
