const { Director, Movie, sequelize } = require('../models');
const { Op } = require('sequelize');

class DirectorController {
  /**
   * Получить всех режиссеров с пагинацией
   */
  async getAllDirectors(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const { count, rows: directors } = await Director.findAndCountAll({
        limit,
        offset,
        attributes: {
          include: [
            [
              sequelize.literal('(SELECT COUNT(*) FROM movies WHERE movies.director_id = Director.director_id)'),
              'movies_count'
            ],
            [
              sequelize.literal('(SELECT AVG(avg_rating) FROM movies WHERE movies.director_id = Director.director_id AND rating_count > 0)'),
              'avg_rating'
            ]
          ]
        },
        order: [['full_name', 'ASC']]
      });
      
      res.json({
        success: true,
        data: directors,
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
   * Поиск режиссеров
   */
  async searchDirectors(req, res, next) {
    try {
      const { search, country, sort_by = 'name_asc' } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const where = {};
      
      // Поиск по имени
      if (search) {
        where.full_name = {
          [Op.like]: `%${search}%`
        };
      }
      
      // Фильтрация по стране
      if (country) {
        where.country = country;
      }
      
      // Определение сортировки
      let order;
      let attributes = {
        include: [
          [
            sequelize.literal('(SELECT COUNT(*) FROM movies WHERE movies.director_id = Director.director_id)'),
            'movies_count'
          ],
          [
            sequelize.literal('(SELECT AVG(avg_rating) FROM movies WHERE movies.director_id = Director.director_id AND rating_count > 0)'),
            'avg_rating'
          ]
        ]
      };
      
      switch (sort_by) {
        case 'name_desc':
          order = [['full_name', 'DESC']];
          break;
        case 'movies_desc':
          order = [[sequelize.literal('movies_count'), 'DESC']];
          break;
        case 'rating_desc':
          order = [[sequelize.literal('avg_rating'), 'DESC']];
          break;
        case 'name_asc':
        default:
          order = [['full_name', 'ASC']];
      }
      
      const { count, rows: directors } = await Director.findAndCountAll({
        where,
        limit,
        offset,
        attributes,
        order,
        distinct: true
      });
      
      res.json({
        success: true,
        data: directors,
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
   * Получить режиссера по ID
   */
  async getDirectorById(req, res, next) {
    try {
      const { id } = req.params;
      
      const director = await Director.findByPk(id, {
        include: [{
          model: Movie,
          attributes: ['movie_id', 'title', 'slug', 'poster_url', 'release_year', 'avg_rating', 'rating_count']
        }]
      });
      
      if (!director) {
        return res.status(404).json({
          success: false,
          error: 'Режиссер не найден'
        });
      }
      
      res.json({
        success: true,
        data: director
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить фильмы режиссера
   */
  async getDirectorMovies(req, res, next) {
    try {
      const { id } = req.params;
      
      const movies = await Movie.findAll({
        where: { director_id: id },
        attributes: ['movie_id', 'title', 'slug', 'poster_url', 'release_year', 'avg_rating', 'rating_count'],
        order: [['release_year', 'DESC']]
      });
      
      res.json({
        success: true,
        data: movies
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить популярных режиссеров
   */
  async getPopularDirectors(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const directors = await Director.findAll({
        limit,
        attributes: {
          include: [
            [
              sequelize.literal('(SELECT COUNT(*) FROM movies WHERE movies.director_id = Director.director_id)'),
              'movies_count'
            ],
            [
              sequelize.literal('(SELECT AVG(avg_rating) FROM movies WHERE movies.director_id = Director.director_id AND rating_count > 0)'),
              'avg_rating'
            ]
          ]
        },
        order: [
          [sequelize.literal('movies_count'), 'DESC']
        ],
        where: sequelize.where(
          sequelize.literal('(SELECT COUNT(*) FROM movies WHERE movies.director_id = Director.director_id)'),
          '>=',
          3
        )
      });
      
      res.json({
        success: true,
        data: directors
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Создать режиссера (только для админов/модераторов)
   */
  async createDirector(req, res, next) {
    try {
      const {
        full_name,
        birth_date,
        death_date,
        country,
        biography,
        photo_url
      } = req.body;
      
      const director = await Director.create({
        full_name,
        birth_date,
        death_date,
        country,
        biography,
        photo_url
      });
      
      res.status(201).json({
        success: true,
        data: director
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Обновить режиссера
   */
  async updateDirector(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const director = await Director.findByPk(id);
      
      if (!director) {
        return res.status(404).json({
          success: false,
          error: 'Режиссер не найден'
        });
      }
      
      await director.update(updateData);
      
      res.json({
        success: true,
        data: director
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Удалить режиссера
   */
  async deleteDirector(req, res, next) {
    try {
      const { id } = req.params;
      
      const director = await Director.findByPk(id);
      
      if (!director) {
        return res.status(404).json({
          success: false,
          error: 'Режиссер не найден'
        });
      }
      
      await director.destroy();
      
      res.json({
        success: true,
        message: 'Режиссер успешно удален'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить статистику по режиссерам
   */
  async getDirectorsStats(req, res, next) {
    try {
      const stats = await Director.findAll({
        attributes: [
          'country',
          [sequelize.fn('COUNT', sequelize.col('director_id')), 'director_count'],
          [
            sequelize.literal('(SELECT AVG(m.avg_rating) FROM movies m WHERE m.director_id = Director.director_id AND m.rating_count > 0)'),
            'avg_rating'
          ]
        ],
        group: ['country'],
        having: sequelize.where(sequelize.fn('COUNT', sequelize.col('director_id')), '>=', 1),
        order: [[sequelize.fn('COUNT', sequelize.col('director_id')), 'DESC']],
        limit: 10
      });
      
      const totalDirectors = await Director.count();
      const totalCountries = await Director.count({
        distinct: true,
        col: 'country'
      });
      
      const avgMoviesPerDirector = await Director.findAll({
        attributes: [
          [
            sequelize.literal('(SELECT AVG(movie_count) FROM (SELECT COUNT(*) as movie_count FROM movies GROUP BY director_id) as counts)'),
            'avg_movies'
          ]
        ]
      });
      
      res.json({
        success: true,
        data: {
          total_directors: totalDirectors,
          total_countries: totalCountries,
          by_country: stats,
          avg_movies_per_director: avgMoviesPerDirector[0]?.dataValues.avg_movies || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DirectorController();