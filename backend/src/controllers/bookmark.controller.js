const { Bookmark, Movie, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class BookmarkController {
  async getUserBookmarks(req, res, next) {
    try {
      const user_id = req.user.user_id;
      const { folder } = req.query;
      
      const where = { user_id };
      if (folder) {
        where.folder = folder;
      }
      
      const bookmarks = await Bookmark.findAll({
        where,
        include: [{
          model: Movie,
          attributes: ['movie_id', 'title', 'slug', 'poster_url', 'release_year', 'avg_rating']
        }],
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        success: true,
        data: bookmarks
      });
    } catch (error) {
      next(error);
    }
  }
  
  async addBookmark(req, res, next) {
    try {
      const { movie_id, folder = 'default', notes } = req.body;
      const user_id = req.user.user_id;
      
      // Проверка существования фильма
      const movie = await Movie.findByPk(movie_id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Фильм не найден'
        });
      }
      
      // Проверка, не добавлен ли уже фильм в закладки
      const existingBookmark = await Bookmark.findOne({
        where: { user_id, movie_id, folder }
      });
      
      if (existingBookmark) {
        return res.status(400).json({
          success: false,
          error: 'Фильм уже добавлен в закладки'
        });
      }
      
      // Создание закладки
      const bookmark = await Bookmark.create({
        user_id,
        movie_id,
        folder,
        notes,
        created_at: new Date()
      });
      
      res.status(201).json({
        success: true,
        data: bookmark
      });
    } catch (error) {
      next(error);
    }
  }
  
  async removeBookmark(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const bookmark = await Bookmark.findOne({
        where: { bookmark_id: id, user_id }
      });
      
      if (!bookmark) {
        return res.status(404).json({
          success: false,
          error: 'Закладка не найдена'
        });
      }
      
      await bookmark.destroy();
      
      res.json({
        success: true,
        message: 'Закладка удалена'
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateBookmark(req, res, next) {
    try {
      const { id } = req.params;
      const { folder, notes } = req.body;
      const user_id = req.user.user_id;
      
      const bookmark = await Bookmark.findOne({
        where: { bookmark_id: id, user_id }
      });
      
      if (!bookmark) {
        return res.status(404).json({
          success: false,
          error: 'Закладка не найдена'
        });
      }
      
      const updateData = {};
      if (folder !== undefined) updateData.folder = folder;
      if (notes !== undefined) updateData.notes = notes;
      
      await bookmark.update(updateData);
      
      res.json({
        success: true,
        data: bookmark
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getUserFolders(req, res, next) {
    try {
      const user_id = req.user.user_id;
      
      const folders = await Bookmark.findAll({
        attributes: [
          'folder',
          [sequelize.fn('COUNT', sequelize.col('bookmark_id')), 'count']
        ],
        where: { user_id },
        group: ['folder'],
        order: [['folder', 'ASC']]
      });
      
      res.json({
        success: true,
        data: folders
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookmarkController();
