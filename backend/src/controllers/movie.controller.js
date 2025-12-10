const { Movie, Genre, Review, User, Director, Actor, MovieLike, sequelize } = require('../models');
const { Op } = require('sequelize');

class MovieController {
  /**
   * Получить все фильмы с пагинацией
   */
  async getAllMovies(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const { count, rows: movies } = await Movie.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: Genre,
            attributes: ['genre_id', 'name', 'slug'],
            through: { attributes: [] }
          }
        ],
        order: [
          ['avg_rating', 'DESC'],
          ['rating_count', 'DESC']
        ]
      });
      
      res.json({
        success: true,
        data: movies,
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
  
  /**
   * Получить фильм по ID
   */
  async getMovieById(req, res, next) {
    try {
      const { id } = req.params;
      
      const movie = await Movie.findByPk(id, {
        include: [
          {
            model: Genre,
            attributes: ['genre_id', 'name', 'slug'],
            through: { attributes: [] }
          },
          {
            model: Director,
            attributes: ['director_id', 'full_name', 'photo_url', 'country']
          },
          {
            model: Actor,
            attributes: ['actor_id', 'full_name', 'photo_url', 'country'],
            through: { attributes: ['role_name', 'character_name', 'order'] }
          },
          {
            model: Review,
            attributes: ['review_id', 'rating', 'title', 'review_text', 'created_at'],
            include: [{
              model: User,
              attributes: ['user_id', 'username', 'avatar_url']
            }],
            where: { is_approved: true },
            limit: 10,
            order: [['created_at', 'DESC']]
          }
        ]
      });
      
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Фильм не найден'
        });
      }
      
      res.json({
        success: true,
        data: movie
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить фильм по slug
   */
  async getMovieBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      
      const movie = await Movie.findOne({
        where: { slug },
        include: [
          {
            model: Genre,
            attributes: ['genre_id', 'name', 'slug'],
            through: { attributes: [] }
          },
          {
            model: Director,
            attributes: ['director_id', 'full_name', 'photo_url', 'country']
          },
          {
            model: Actor,
            attributes: ['actor_id', 'full_name', 'photo_url', 'country'],
            through: { attributes: ['role_name', 'character_name', 'order'] }
          },
          {
            model: Review,
            attributes: ['review_id', 'rating', 'title', 'review_text', 'likes_count', 'created_at'],
            include: [{
              model: User,
              attributes: ['user_id', 'username', 'avatar_url']
            }],
            where: { is_approved: true },
            limit: 10,
            order: [['likes_count', 'DESC']]
          }
        ]
      });
      
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Фильм не найден'
        });
      }
      
      res.json({
        success: true,
        data: movie
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Поиск фильмов
   */
  async searchMovies(req, res, next) {
    try {
      const { query, genre, year_from, year_to, min_rating, sort_by = 'rating' } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const where = {};
      const include = [];
      
      // Поиск по названию
      if (query) {
        where.title = {
          [Op.like]: `%${query}%`
        };
      }
      
      // Фильтрация по году
      if (year_from || year_to) {
        where.release_year = {};
        if (year_from) where.release_year[Op.gte] = year_from;
        if (year_to) where.release_year[Op.lte] = year_to;
      }
      
      // Фильтрация по рейтингу
      if (min_rating) {
        where.avg_rating = {
          [Op.gte]: parseFloat(min_rating)
        };
      }
      
      // Фильтрация по жанру
      if (genre) {
        include.push({
          model: Genre,
          attributes: [],
          where: {
            [Op.or]: [
              { slug: genre },
              { name: genre }
            ]
          },
          through: { attributes: [] }
        });
      }
      
      // Сортировка
      let order;
      switch (sort_by) {
        case 'year_asc':
          order = [['release_year', 'ASC']];
          break;
        case 'year_desc':
          order = [['release_year', 'DESC']];
          break;
        case 'title':
          order = [['title', 'ASC']];
          break;
        case 'rating':
        default:
          order = [
            ['avg_rating', 'DESC'],
            ['rating_count', 'DESC']
          ];
      }
      
      // Добавляем режиссёра в выборку для админ-таблицы
      include.push({
        model: Director,
        attributes: ['director_id', 'full_name']
      });

      const { count, rows: movies } = await Movie.findAndCountAll({
        where,
        include,
        limit,
        offset,
        order,
        distinct: true
      });
      
      res.json({
        success: true,
        data: movies,
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
  
  /**
   * Получить популярные фильмы
   */
  async getPopularMovies(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const movies = await Movie.findAll({
        limit,
        order: [
          ['avg_rating', 'DESC'],
          ['rating_count', 'DESC']
        ],
        where: {
          rating_count: {
            [Op.gte]: 1
          }
        },
        include: [{
          model: Genre,
          attributes: ['name', 'slug'],
          through: { attributes: [] }
        }]
      });
      
      res.json({
        success: true,
        data: movies
      });
    } catch (error) {
      next(error);
    }
  }

  async likeMovie(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      const movie = await Movie.findByPk(id, { transaction });
      if (!movie) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'Фильм не найден' });
      }
      const existing = await MovieLike.findOne({ where: { movie_id: id, user_id }, transaction });
      if (existing) {
        await transaction.rollback();
        return res.json({ success: true, message: 'Уже лайкнуто' });
      }
      await MovieLike.create({ movie_id: id, user_id }, { transaction });
      await movie.update({ likes_count: (movie.likes_count || 0) + 1, updated_at: new Date() }, { transaction });
      await transaction.commit();
      res.json({ success: true });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async unlikeMovie(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      const movie = await Movie.findByPk(id, { transaction });
      if (!movie) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'Фильм не найден' });
      }
      const existing = await MovieLike.findOne({ where: { movie_id: id, user_id }, transaction });
      if (!existing) {
        await transaction.rollback();
        return res.json({ success: true, message: 'Лайк отсутствует' });
      }
      await existing.destroy({ transaction });
      const newCount = Math.max(0, (movie.likes_count || 0) - 1);
      await movie.update({ likes_count: newCount, updated_at: new Date() }, { transaction });
      await transaction.commit();
      res.json({ success: true });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  /**
   * Создать новый фильм (только для админов/модераторов)
   */
  async createMovie(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        title,
        original_title,
        slug,
        description,
        release_date,
        release_year,
        country,
        duration,
        budget,
        revenue,
        director_id,
        genres = []
      } = req.body;
      
      // Проверка существования slug
      const existingMovie = await Movie.findOne({
        where: { slug },
        transaction
      });
      
      if (existingMovie) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Фильм с таким slug уже существует'
        });
      }
      
      // Создание фильма
      const movie = await Movie.create({
        title,
        original_title,
        slug,
        description,
        release_date,
        release_year,
        country,
        duration,
        budget,
        revenue,
        director_id,
        avg_rating: 0,
        rating_count: 0
      }, { transaction });
      
      // Добавление жанров
      if (genres.length > 0) {
        const genreRecords = await Genre.findAll({
          where: {
            genre_id: genres
          },
          transaction
        });
        
        await movie.addGenres(genreRecords, { transaction });
      }
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: movie
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  /**
   * Обновить фильм
   */
  async updateMovie(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const movie = await Movie.findByPk(id, { transaction });
      
      if (!movie) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Фильм не найден'
        });
      }
      
      // Обновление данных фильма
      await movie.update(updateData, { transaction });
      
      // Обновление жанров если переданы
      if (updateData.genres) {
        const genreRecords = await Genre.findAll({
          where: {
            genre_id: updateData.genres
          },
          transaction
        });
        
        await movie.setGenres(genreRecords, { transaction });
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: movie
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  /**
   * Удалить фильм
   */
  async deleteMovie(req, res, next) {
    try {
      const { id } = req.params;
      
      const movie = await Movie.findByPk(id);
      
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Фильм не найден'
        });
      }
      
      await movie.destroy();
      
      res.json({
        success: true,
        message: 'Фильм успешно удален'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить статистику по фильмам
   */
  async getMovieStats(req, res, next) {
    try {
      const stats = await Movie.findAll({
        attributes: [
          'country',
          [sequelize.fn('COUNT', sequelize.col('movie_id')), 'movie_count'],
          [sequelize.fn('AVG', sequelize.col('avg_rating')), 'avg_rating'],
          [sequelize.fn('SUM', sequelize.col('rating_count')), 'total_reviews']
        ],
        group: ['country'],
        having: sequelize.where(sequelize.fn('COUNT', sequelize.col('movie_id')), '>=', 1),
        order: [[sequelize.fn('COUNT', sequelize.col('movie_id')), 'DESC']],
        limit: 20
      });
      
      const yearlyStats = await Movie.findAll({
        attributes: [
          'release_year',
          [sequelize.fn('COUNT', sequelize.col('movie_id')), 'movie_count'],
          [sequelize.fn('AVG', sequelize.col('avg_rating')), 'avg_rating']
        ],
        where: {
          release_year: {
            [Op.ne]: null
          }
        },
        group: ['release_year'],
        order: [['release_year', 'DESC']],
        limit: 10
      });
      
      res.json({
        success: true,
        data: {
          by_country: stats,
          by_year: yearlyStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getGenres(req, res, next) {
    try {
      const genres = await Genre.findAll({
        attributes: ['genre_id', 'name', 'slug'],
        order: [['name', 'ASC']]
      });
      res.json({ success: true, data: genres });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MovieController();
