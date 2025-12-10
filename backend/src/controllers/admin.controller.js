const { User, Movie, Review, Actor, Director, Genre, ReviewLike, Bookmark, sequelize } = require('../models');
const { Op } = require('sequelize');

function slugifyName(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, '-');
}

class AdminController {
  // Управление пользователями
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search;
      
      const where = {};
      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
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
  
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, is_active } = req.body;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      // Нельзя изменить самого себя
      if (user.user_id === req.user.user_id) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя изменить свои собственные права'
        });
      }

      if (user.role === 'ADMIN') {
        if (typeof is_active === 'boolean' && is_active === false) {
          return res.status(400).json({ success: false, error: 'Нельзя блокировать администратора' });
        }
        if (role && role !== 'ADMIN') {
          return res.status(400).json({ success: false, error: 'Нельзя изменять роль администратора' });
        }
      }
      
      // Ограничения: нельзя менять роль/блокировать другого администратора
      if (user.role === 'ADMIN') {
        if (typeof is_active === 'boolean' && is_active === false) {
          return res.status(400).json({ success: false, error: 'Нельзя блокировать администратора' });
        }
        if (role && role !== 'ADMIN') {
          return res.status(400).json({ success: false, error: 'Нельзя изменять роль администратора' });
        }
      }

      const updateData = {};
      if (role) updateData.role = role;
      if (typeof is_active === 'boolean') updateData.is_active = is_active;
      updateData.updated_at = new Date();
      
      await user.update(updateData);
      
      res.json({
        success: true,
        data: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          updated_at: user.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteUser(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, { transaction });
      
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      // Нельзя удалить самого себя
      if (user.user_id === req.user.user_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Нельзя удалить свой собственный аккаунт'
        });
      }
      if (user.role === 'ADMIN') {
        await transaction.rollback();
        return res.status(400).json({ success: false, error: 'Нельзя удалять администратора' });
      }
      // Удаляем отзывы пользователя явно, чтобы сработали триггеры пересчёта рейтинга фильмов
      await Review.destroy({
        where: { user_id: id },
        transaction
      });

      // Удаляем пользователя
      await user.destroy({ transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Пользователь успешно удален'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
  
  // Статистика сервиса
  async getServiceStats(req, res, next) {
    try {
      // Основная статистика
      const [
        totalMovies,
        totalUsers,
        totalReviews,
        totalActors,
        totalDirectors,
        totalGenres
      ] = await Promise.all([
        Movie.count(),
        User.count(),
        Review.count({ where: { is_approved: true } }),
        Actor.count(),
        Director.count(),
        Genre.count()
      ]);
      
      // Самый популярный фильм
      const popularMovie = await Movie.findOne({
        order: [
          ['rating_count', 'DESC'],
          ['avg_rating', 'DESC']
        ],
        include: [{
          model: Director,
          attributes: ['full_name']
        }],
        limit: 1
      });
      
      // Самый популярный жанр
      const popularGenre = await sequelize.query(`
        SELECT 
          g.genre_id,
          g.name,
          COUNT(mg.movie_id) as movie_count
        FROM genres g
        LEFT JOIN movie_genres mg ON g.genre_id = mg.genre_id
        GROUP BY g.genre_id
        ORDER BY movie_count DESC
        LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      // Активность по дням (последние 30 дней)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyActivity = await Review.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('review_id')), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: thirtyDaysAgo
          },
          is_approved: true
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
        limit: 30
      });
      
      // Распределение пользователей по ролям
      const usersByRole = await User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']
        ],
        group: ['role'],
        order: [['role', 'ASC']]
      });
      
      // Топ 10 пользователей по количеству отзывов
      const topReviewers = await Review.findAll({
        attributes: [
          'user_id',
          [sequelize.fn('COUNT', sequelize.col('review_id')), 'review_count'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating']
        ],
        where: {
          is_approved: true,
          user_id: { [Op.ne]: null }
        },
        include: [{
          model: User,
          attributes: ['username', 'avatar_url']
        }],
        group: ['user_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('review_id')), 'DESC']],
        limit: 10
      });
      
      // Последние отзывы (логи действий)
      const recentReviews = await Review.findAll({
        attributes: ['review_id', 'rating', 'title', 'created_at'],
        where: { is_approved: true },
        include: [
          { model: User, attributes: ['username'] },
          { model: Movie, attributes: ['title'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 20
      });

      res.json({
        success: true,
        data: {
          totals: {
            movies: totalMovies,
            users: totalUsers,
            reviews: totalReviews,
            actors: totalActors,
            directors: totalDirectors,
            genres: totalGenres
          },
          popular: {
            movie: popularMovie,
            genre: popularGenre[0] || null
          },
          activity: {
            daily: dailyActivity,
            top_reviewers: topReviewers,
            recent_reviews: recentReviews
          },
          users: {
            by_role: usersByRole
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Управление контентом
  async approveReview(req, res, next) {
    try {
      const { id } = req.params;
      
      const review = await Review.findByPk(id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Отзыв не найден'
        });
      }
      
      await review.update({ 
        is_approved: true,
        updated_at: new Date()
      });
      
      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }
  
  async rejectReview(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const review = await Review.findByPk(id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Отзыв не найден'
        });
      }
      
      await review.update({
        is_approved: false,
        review_text: reason ? `Отзыв отклонен: ${reason}` : 'Отзыв отклонен модератором',
        updated_at: new Date()
      });
      
      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Управление фильмами
  async createMovie(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        title,
        original_title,
        slug,
        description,
        poster_url,
        backdrop_url,
        release_date,
        release_year,
        country,
        duration,
        budget,
        revenue,
        director_id,
        director_name,
        genres = [],
        actors = []
      } = req.body;
      
      // Проверка уникальности slug
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
      let dirId = director_id;
      if (!dirId && director_name) {
        const [director] = await Director.findOrCreate({
          where: { full_name: director_name },
          defaults: { full_name: director_name },
          transaction
        });
        dirId = director.director_id;
      }
      const movie = await Movie.create({
        title,
        original_title,
        slug,
        description,
        poster_url,
        backdrop_url,
        release_date,
        release_year,
        country,
        duration,
        budget,
        revenue,
        director_id: dirId,
        avg_rating: 0,
        rating_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
      
      // Добавление жанров
      const genresText = (req.body.genres_text || '').trim();
      if (genresText) {
        const names = genresText.split(',').map(n => n.trim()).filter(Boolean);
        const genreRecords = [];
        for (const name of names) {
          const [g] = await Genre.findOrCreate({
            where: { name },
            defaults: { name, slug: slugifyName(name), created_at: new Date() },
            transaction
          });
          genreRecords.push(g);
        }
        if (genreRecords.length) await movie.addGenres(genreRecords, { transaction });
      } else if (genres.length > 0) {
        const genreRecords = await Genre.findAll({
          where: { genre_id: genres },
          transaction
        });
        if (genreRecords.length) await movie.addGenres(genreRecords, { transaction });
      }
      // Добавление актёров
      if (actors.length > 0) {
        if (typeof actors[0] === 'object') {
          for (const a of actors) {
            let actor = null;
            if (a.actor_id) {
              actor = await Actor.findByPk(a.actor_id, { transaction });
            } else if (a.full_name) {
              const [found] = await Actor.findOrCreate({
                where: { full_name: a.full_name },
                defaults: { full_name: a.full_name },
                transaction
              });
              actor = found;
            }
            if (!actor) continue;
            await movie.addActor(actor, {
              through: {
                role_name: a.role_name || null,
                character_name: a.character_name || null,
                order: a.order || 0,
                created_at: new Date()
              },
              transaction
            });
          }
        } else {
          const actorRecords = await Actor.findAll({
            where: { actor_id: actors },
            transaction
          });
          await movie.addActors(actorRecords, { transaction });
        }
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
      updateData.updated_at = new Date();
      if (!updateData.director_id && updateData.director_name) {
        const [director] = await Director.findOrCreate({
          where: { full_name: updateData.director_name },
          defaults: { full_name: updateData.director_name },
          transaction
        });
        updateData.director_id = director.director_id;
      }
      await movie.update(updateData, { transaction });
      
      // Обновление жанров если переданы
      if (typeof updateData.genres_text === 'string' && updateData.genres_text.trim()) {
        const names = updateData.genres_text.split(',').map(n => n.trim()).filter(Boolean);
        const genreRecords = [];
        for (const name of names) {
          const [g] = await Genre.findOrCreate({
            where: { name },
            defaults: { name, slug: slugifyName(name), created_at: new Date() },
            transaction
          });
          genreRecords.push(g);
        }
        await movie.setGenres(genreRecords, { transaction });
      } else if (updateData.genres) {
        const genreRecords = await Genre.findAll({
          where: { genre_id: updateData.genres },
          transaction
        });
        await movie.setGenres(genreRecords, { transaction });
      }
      // Обновление актёров если переданы
      if (updateData.actors) {
        // Сбрасываем существующие связи
        await movie.setActors([], { transaction });
        const actors = updateData.actors;
        if (actors.length > 0) {
          if (typeof actors[0] === 'object') {
            for (const a of actors) {
              let actor = null;
              if (a.actor_id) {
                actor = await Actor.findByPk(a.actor_id, { transaction });
              } else if (a.full_name) {
                const [found] = await Actor.findOrCreate({
                  where: { full_name: a.full_name },
                  defaults: { full_name: a.full_name },
                  transaction
                });
                actor = found;
              }
              if (!actor) continue;
              await movie.addActor(actor, {
                through: {
                  role_name: a.role_name || null,
                  character_name: a.character_name || null,
                  order: a.order || 0,
                  created_at: new Date()
                },
                transaction
              });
            }
          } else {
            const actorRecords = await Actor.findAll({
              where: { actor_id: actors },
              transaction
            });
            await movie.addActors(actorRecords, { transaction });
          }
        }
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

  async uploadPoster(req, res, next) {
    try {
      const url = `/uploads/posters/${req.file.filename}`;
      res.json({ success: true, url });
    } catch (error) { next(error); }
  }
  async uploadBackdrop(req, res, next) {
    try {
      const url = `/uploads/backdrops/${req.file.filename}`;
      res.json({ success: true, url });
    } catch (error) { next(error); }
  }
  async uploadPersonPhoto(req, res, next) {
    try {
      const url = `/uploads/people/${req.file.filename}`;
      res.json({ success: true, url });
    } catch (error) { next(error); }
  }
}

module.exports = new AdminController();
