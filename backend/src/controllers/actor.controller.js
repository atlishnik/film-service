const { Actor, Movie, sequelize } = require('../models');
const { Op } = require('sequelize');

class ActorController {
  /**
   * Получить всех актеров с пагинацией
   */
  async getAllActors(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const { count, rows: actors } = await Actor.findAndCountAll({
        limit,
        offset,
        attributes: [
          'actor_id',
          'full_name',
          'birth_date',
          'death_date',
          'country',
          'photo_url',
          [
            sequelize.literal('(SELECT COUNT(*) FROM movie_actors WHERE movie_actors.actor_id = Actor.actor_id)'),
            'movies_count'
          ]
        ],
        order: [['full_name', 'ASC']]
      });
      
      res.json({
        success: true,
        data: actors,
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
   * Поиск актеров
   */
  async searchActors(req, res, next) {
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
      switch (sort_by) {
        case 'name_desc':
          order = [['full_name', 'DESC']];
          break;
        case 'birth_date_desc':
          order = [['birth_date', 'DESC']];
          break;
        case 'birth_date_asc':
          order = [['birth_date', 'ASC']];
          break;
        case 'name_asc':
        default:
          order = [['full_name', 'ASC']];
      }
      
      const { count, rows: actors } = await Actor.findAndCountAll({
        where,
        limit,
        offset,
        attributes: [
          'actor_id',
          'full_name',
          'birth_date',
          'death_date',
          'country',
          'photo_url',
          [
            sequelize.literal('(SELECT COUNT(*) FROM movie_actors WHERE movie_actors.actor_id = Actor.actor_id)'),
            'movies_count'
          ]
        ],
        order,
        distinct: true
      });
      
      res.json({
        success: true,
        data: actors,
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
   * Получить актера по ID
   */
  async getActorById(req, res, next) {
    try {
      const { id } = req.params;
      
      const actor = await Actor.findByPk(id, {
        include: [{
          model: Movie,
          attributes: ['movie_id', 'title', 'slug', 'poster_url', 'release_year', 'avg_rating'],
          through: { attributes: ['role_name', 'character_name'] }
        }]
      });
      
      if (!actor) {
        return res.status(404).json({
          success: false,
          error: 'Актер не найден'
        });
      }
      
      res.json({
        success: true,
        data: actor
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить фильмы актера
   */
  async getActorMovies(req, res, next) {
    try {
      const { id } = req.params;
      
      const actor = await Actor.findByPk(id, {
        include: [{
          model: Movie,
          attributes: ['movie_id', 'title', 'slug', 'poster_url', 'release_year', 'avg_rating'],
          through: { attributes: ['role_name', 'character_name', 'order'] }
        }]
      });
      
      if (!actor) {
        return res.status(404).json({
          success: false,
          error: 'Актер не найден'
        });
      }
      
      res.json({
        success: true,
        data: actor.Movies
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить популярных актеров
   */
  async getPopularActors(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const actors = await Actor.findAll({
        limit,
        attributes: [
          'actor_id',
          'full_name',
          'photo_url',
          [
            sequelize.literal('(SELECT COUNT(*) FROM movie_actors WHERE movie_actors.actor_id = Actor.actor_id)'),
            'movies_count'
          ]
        ],
        order: [
          [sequelize.literal('movies_count'), 'DESC']
        ]
      });
      
      res.json({
        success: true,
        data: actors
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Создать актера (только для админов/модераторов)
   */
  async createActor(req, res, next) {
    try {
      const {
        full_name,
        birth_date,
        death_date,
        country,
        biography,
        photo_url
      } = req.body;
      
      const actor = await Actor.create({
        full_name,
        birth_date,
        death_date,
        country,
        biography,
        photo_url
      });
      
      res.status(201).json({
        success: true,
        data: actor
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Обновить актера
   */
  async updateActor(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const actor = await Actor.findByPk(id);
      
      if (!actor) {
        return res.status(404).json({
          success: false,
          error: 'Актер не найден'
        });
      }
      
      await actor.update(updateData);
      
      res.json({
        success: true,
        data: actor
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Удалить актера
   */
  async deleteActor(req, res, next) {
    try {
      const { id } = req.params;
      
      const actor = await Actor.findByPk(id);
      
      if (!actor) {
        return res.status(404).json({
          success: false,
          error: 'Актер не найден'
        });
      }
      
      await actor.destroy();
      
      res.json({
        success: true,
        message: 'Актер успешно удален'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Получить статистику по актерам
   */
  async getActorsStats(req, res, next) {
    try {
      const totalActors = await Actor.count();
      const countries = await Actor.findAll({
        attributes: [
          'country',
          [sequelize.fn('COUNT', sequelize.col('actor_id')), 'actor_count']
        ],
        where: {
          country: {
            [Op.ne]: null
          }
        },
        group: ['country'],
        order: [[sequelize.fn('COUNT', sequelize.col('actor_id')), 'DESC']],
        limit: 10
      });
      
      const avgAge = await Actor.findAll({
        attributes: [
          [sequelize.fn('AVG', sequelize.fn('TIMESTAMPDIFF', sequelize.literal('YEAR'), sequelize.col('birth_date'), sequelize.fn('CURDATE'))), 'avg_age']
        ],
        where: {
          birth_date: {
            [Op.ne]: null
          }
        }
      });
      
      res.json({
        success: true,
        data: {
          total_actors: totalActors,
          countries,
          avg_age: avgAge[0]?.dataValues.avg_age || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActorController();