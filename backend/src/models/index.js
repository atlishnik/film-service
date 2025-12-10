const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Модель пользователя
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  about: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  registration_date: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('USER', 'ADMIN'),
    defaultValue: 'USER'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: false,
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

// Модель фильма
const Movie = sequelize.define('Movie', {
  movie_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  original_title: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(170),
    allowNull: false,
    unique: true
  },
  poster_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  backdrop_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  release_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  duration: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  revenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  director_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  avg_rating: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00
  },
  rating_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'movies',
  timestamps: false,
  indexes: [
    { fields: ['title'] },
    { fields: ['slug'] },
    { fields: ['release_year'] },
    { fields: ['avg_rating'] },
    { fields: ['director_id'] }
  ]
});

// Модель жанра
const Genre = sequelize.define('Genre', {
  genre_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'genres',
  timestamps: false
});

// Модель режиссера
const Director = sequelize.define('Director', {
  director_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  death_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  biography: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'directors',
  timestamps: false,
  indexes: [
    { fields: ['full_name'] },
    { fields: ['country'] }
  ]
});

// Модель актера
const Actor = sequelize.define('Actor', {
  actor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  death_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  biography: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'actors',
  timestamps: false,
  indexes: [
    { fields: ['full_name'] },
    { fields: ['country'] }
  ]
});

// Модель отзыва
const Review = sequelize.define('Review', {
  review_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  movie_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  review_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  likes_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'reviews',
  timestamps: false,
  indexes: [
    { fields: ['movie_id'] },
    { fields: ['user_id'] },
    { fields: ['rating'] },
    { fields: ['created_at'] }
  ]
});

// Модель лайка отзыва
const ReviewLike = sequelize.define('ReviewLike', {
  review_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'review_likes',
  timestamps: false
});

// Модель лайка фильма
const MovieLike = sequelize.define('MovieLike', {
  movie_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'movie_likes',
  timestamps: false,
  indexes: [
    { fields: ['movie_id'] },
    { fields: ['user_id'] }
  ]
});

// Модель закладки
const Bookmark = sequelize.define('Bookmark', {
  bookmark_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  movie_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  folder: {
    type: DataTypes.STRING(50),
    defaultValue: 'default'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'bookmarks',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['movie_id'] }
  ]
});

// Промежуточные таблицы
const MovieGenre = sequelize.define('MovieGenre', {
  movie_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  genre_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'movie_genres',
  timestamps: false
});

const MovieActor = sequelize.define('MovieActor', {
  movie_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  actor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  role_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  character_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  order: {
    type: DataTypes.SMALLINT.UNSIGNED,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'movie_actors',
  timestamps: false
});

// ==================== СВЯЗИ ====================

// User ↔ Review
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Movie ↔ Review
Movie.hasMany(Review, { foreignKey: 'movie_id' });
Review.belongsTo(Movie, { foreignKey: 'movie_id' });

// Movie ↔ Director
Director.hasMany(Movie, { foreignKey: 'director_id' });
Movie.belongsTo(Director, { foreignKey: 'director_id' });

// Movie ↔ Genre (many-to-many)
Movie.belongsToMany(Genre, { 
  through: MovieGenre, 
  foreignKey: 'movie_id',
  otherKey: 'genre_id'
});
Genre.belongsToMany(Movie, { 
  through: MovieGenre, 
  foreignKey: 'genre_id',
  otherKey: 'movie_id'
});

// Movie ↔ Actor (many-to-many)
Movie.belongsToMany(Actor, { 
  through: MovieActor, 
  foreignKey: 'movie_id',
  otherKey: 'actor_id'
});
Actor.belongsToMany(Movie, { 
  through: MovieActor, 
  foreignKey: 'actor_id',
  otherKey: 'movie_id'
});

// User ↔ Bookmark
User.hasMany(Bookmark, { foreignKey: 'user_id' });
Bookmark.belongsTo(User, { foreignKey: 'user_id' });

// Movie ↔ Bookmark
Movie.hasMany(Bookmark, { foreignKey: 'movie_id' });
Bookmark.belongsTo(Movie, { foreignKey: 'movie_id' });

// Review ↔ ReviewLike
Review.hasMany(ReviewLike, { foreignKey: 'review_id' });
ReviewLike.belongsTo(Review, { foreignKey: 'review_id' });

// User ↔ ReviewLike
User.hasMany(ReviewLike, { foreignKey: 'user_id' });
ReviewLike.belongsTo(User, { foreignKey: 'user_id' });

// Movie ↔ MovieLike
Movie.hasMany(MovieLike, { foreignKey: 'movie_id' });
MovieLike.belongsTo(Movie, { foreignKey: 'movie_id' });

// User ↔ MovieLike
User.hasMany(MovieLike, { foreignKey: 'user_id' });
MovieLike.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Movie,
  Genre,
  Director,
  Actor,
  Review,
  ReviewLike,
  MovieLike,
  Bookmark,
  MovieGenre,
  MovieActor
};
