const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const movieRoutes = require('./routes/movie.routes');
const authRoutes = require('./routes/auth.routes');
const reviewRoutes = require('./routes/review.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const actorRoutes = require('./routes/actor.routes');
const directorRoutes = require('./routes/director.routes');
const genreRoutes = require('./routes/genre.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:3000'],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend')));

// Swagger документация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Film Service API',
      version: '1.0.0',
      description: 'API для сервиса оценки кинофильмов'
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Маршруты
app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/actors', actorRoutes);
app.use('/api/directors', directorRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Статические файлы фронтенда
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pages/index.html'));
});

// Алиас: /admin -> страница админ-панели
app.get('/admin', (req, res, next) => {
  const pageFile = path.join(__dirname, '../../frontend/pages/admin.html');
  res.sendFile(pageFile, err => { if (err) return next(); });
});

// Поддержка прямых ссылок вида /page.html -> /frontend/pages/page.html
app.get('/:page.html', (req, res, next) => {
  const aliases = {
    movies: 'movies-search',
    search: 'movies-search'
  };
  const pageName = aliases[req.params.page] || req.params.page;
  const pageFile = path.join(__dirname, '../../frontend/pages', `${pageName}.html`);
  res.sendFile(pageFile, err => {
    if (err) return next();
  });
});

// Обработка 404 ошибок
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
