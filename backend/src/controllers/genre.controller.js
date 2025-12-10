const { Genre } = require('../models');

class GenreController {
  async createGenre(req, res, next) {
    try {
      const { name, slug, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Название жанра обязательно' });
      }
      if (slug) {
        const exists = await Genre.findOne({ where: { slug } });
        if (exists) return res.status(400).json({ success: false, error: 'Жанр со slug уже существует' });
      }
      const genre = await Genre.create({ name, slug, description });
      res.status(201).json({ success: true, data: genre });
    } catch (error) {
      next(error);
    }
  }

  async updateGenre(req, res, next) {
    try {
      const { id } = req.params;
      const update = req.body;
      const genre = await Genre.findByPk(id);
      if (!genre) {
        return res.status(404).json({ success: false, error: 'Жанр не найден' });
      }
      if (update.slug) {
        const exists = await Genre.findOne({ where: { slug: update.slug } });
        if (exists && exists.genre_id != id) {
          return res.status(400).json({ success: false, error: 'Жанр со slug уже существует' });
        }
      }
      await genre.update(update);
      res.json({ success: true, data: genre });
    } catch (error) {
      next(error);
    }
  }

  async deleteGenre(req, res, next) {
    try {
      const { id } = req.params;
      const genre = await Genre.findByPk(id);
      if (!genre) {
        return res.status(404).json({ success: false, error: 'Жанр не найден' });
      }
      await genre.destroy();
      res.json({ success: true, message: 'Жанр удален' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GenreController();
