const { User, Review, Bookmark, Movie, sequelize } = require('../models');
const { Op } = require('sequelize');

class UserController {
  async getUserProfile(req, res, next) {
    try {
      const user_id = req.params.id || req.user.user_id;
      
      const user = await User.findByPk(user_id, {
        attributes: { 
          exclude: ['password_hash'] 
        }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      // Получаем статистику асинхронно
      const [reviewsCount, bookmarksCount, avgRating, recentReviews, recentBookmarks] = await Promise.all([
        Review.count({ where: { user_id } }),
        Bookmark.count({ where: { user_id } }),
        Review.findOne({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating']
          ],
          where: { user_id }
        }),
        Review.findAll({
          where: { user_id },
          include: [{
            model: Movie,
            attributes: ['movie_id', 'title', 'slug', 'poster_url']
          }],
          order: [['created_at', 'DESC']],
          limit: 5
        }),
        Bookmark.findAll({
          where: { user_id },
          include: [{
            model: Movie,
            attributes: ['movie_id', 'title', 'slug', 'poster_url']
          }],
          order: [['created_at', 'DESC']],
          limit: 5
        })
      ]);
      
      const stats = {
        reviews_count: reviewsCount,
        bookmarks_count: bookmarksCount,
        avg_rating: parseFloat(avgRating?.dataValues?.avg_rating) || 0
      };
      
      res.json({
        success: true,
        data: {
          user,
          stats,
          recent_reviews: recentReviews,
          recent_bookmarks: recentBookmarks
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateAvatar(req, res, next) {
    try {
      const user = await User.findByPk(req.user.user_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Файл не загружен'
        });
      }
      
      // Сохраняем путь к файлу
      const avatar_url = `/uploads/avatars/${req.file.filename}`;
      
      await user.update({ 
        avatar_url,
        updated_at: new Date()
      });
      
      res.json({
        success: true,
        data: {
          avatar_url
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getUserStats(req, res, next) {
    try {
      const user_id = req.params.id || req.user.user_id;
      
      const [reviewsCount, bookmarksCount, avgRating, ratingDistribution, recentActivity] = await Promise.all([
        Review.count({ where: { user_id } }),
        Bookmark.count({ where: { user_id } }),
        Review.findOne({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating']
          ],
          where: { user_id }
        }),
        Review.findAll({
          attributes: [
            'rating',
            [sequelize.fn('COUNT', sequelize.col('review_id')), 'count']
          ],
          where: { user_id },
          group: ['rating'],
          order: [['rating', 'DESC']]
        }),
        Review.findAll({
          where: { user_id },
          include: [{
            model: Movie,
            attributes: ['title', 'slug', 'poster_url']
          }],
          order: [['created_at', 'DESC']],
          limit: 10
        })
      ]);
      
      res.json({
        success: true,
        data: {
          reviews_count: reviewsCount,
          bookmarks_count: bookmarksCount,
          avg_rating: parseFloat(avgRating?.dataValues?.avg_rating) || 0,
          rating_distribution: ratingDistribution,
          recent_activity: recentActivity
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async searchUsers(req, res, next) {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (query) {
        where[Op.or] = [
          { username: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ];
      }
      
      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { 
          exclude: ['password_hash'] 
        },
        limit,
        offset,
        order: [['registration_date', 'DESC']]
      });
      
      res.json({
        success: true,
        data: users,
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
}

module.exports = new UserController();