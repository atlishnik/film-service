-- ==============================
-- 1. Удаление существующей БД (если нужно)
-- ==============================
DROP DATABASE IF EXISTS `film-service`;

-- ==============================
-- 2. Создание БД с правильным именем
-- ==============================
CREATE DATABASE `film-service`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `film-service`;

-- ==============================
-- 3. Таблица пользователей
-- ==============================
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    about TEXT DEFAULT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    role ENUM('USER', 'MODERATOR', 'ADMIN') DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_users_username_length CHECK (CHAR_LENGTH(username) >= 3),
    CONSTRAINT chk_users_username_valid CHECK (username REGEXP '^[a-zA-Z0-9_]+$'),
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- ==============================
-- 4. Таблица жанров
-- ==============================
CREATE TABLE genres (
    genre_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(60) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_genre_slug (slug)
) ENGINE=InnoDB;

-- ==============================
-- 5. Таблица режиссёров
-- ==============================
CREATE TABLE directors (
    director_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE DEFAULT NULL,
    death_date DATE DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    biography TEXT DEFAULT NULL,
    photo_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_director_name (full_name),
    INDEX idx_director_country (country)
) ENGINE=InnoDB;

-- ==============================
-- 6. Таблица актёров
-- ==============================
CREATE TABLE actors (
    actor_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE DEFAULT NULL,
    death_date DATE DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    biography TEXT DEFAULT NULL,
    photo_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_actor_name (full_name),
    INDEX idx_actor_country (country)
) ENGINE=InnoDB;

-- ==============================
-- 7. Таблица фильмов (ИСПРАВЛЕНО: avg_rating DECIMAL(4,2))
-- ==============================
CREATE TABLE movies (
    movie_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    original_title VARCHAR(150) DEFAULT NULL,
    slug VARCHAR(170) NOT NULL UNIQUE,
    poster_url VARCHAR(500) DEFAULT NULL,
    backdrop_url VARCHAR(500) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    release_date DATE DEFAULT NULL,
    release_year YEAR(4) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    duration SMALLINT UNSIGNED DEFAULT NULL, -- в минутах
    budget DECIMAL(15,2) DEFAULT NULL,
    revenue DECIMAL(15,2) DEFAULT NULL,
    director_id BIGINT UNSIGNED DEFAULT NULL,
    avg_rating DECIMAL(4,2) DEFAULT 0.00, -- ИЗМЕНЕНО с DECIMAL(3,2) на DECIMAL(4,2)
    rating_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (director_id) REFERENCES directors(director_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_movies_duration_positive CHECK (duration IS NULL OR duration > 0),
    CONSTRAINT chk_movies_avg_rating_range CHECK (avg_rating >= 0 AND avg_rating <= 10),
    INDEX idx_movie_title (title),
    INDEX idx_movie_slug (slug),
    INDEX idx_movie_release_year (release_year),
    INDEX idx_movie_avg_rating (avg_rating),
    INDEX idx_movie_director (director_id)
) ENGINE=InnoDB;

-- ==============================
-- 8. Таблица связи "фильм ↔ жанры"
-- ==============================
CREATE TABLE movie_genres (
    movie_id BIGINT UNSIGNED NOT NULL,
    genre_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_movie_genre (genre_id, movie_id)
) ENGINE=InnoDB;

-- ==============================
-- 9. Таблица связи "фильм ↔ актёры"
-- ==============================
CREATE TABLE movie_actors (
    movie_id BIGINT UNSIGNED NOT NULL,
    actor_id BIGINT UNSIGNED NOT NULL,
    role_name VARCHAR(150) DEFAULT NULL,
    character_name VARCHAR(150) DEFAULT NULL,
    `order` SMALLINT UNSIGNED DEFAULT 0, -- порядок в списке актёров
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, actor_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_movie_actor (actor_id, movie_id),
    INDEX idx_actor_order (movie_id, `order`)
) ENGINE=InnoDB;

-- ==============================
-- 10. Таблица отзывов и оценок
-- ==============================
CREATE TABLE reviews (
    review_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    title VARCHAR(200) DEFAULT NULL,
    review_text TEXT DEFAULT NULL,
    likes_count INT UNSIGNED DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uniq_user_movie_review (user_id, movie_id),
    CONSTRAINT chk_reviews_rating_range CHECK (rating BETWEEN 1 AND 10),
    INDEX idx_review_movie (movie_id),
    INDEX idx_review_user (user_id),
    INDEX idx_review_rating (rating),
    INDEX idx_review_created (created_at)
) ENGINE=InnoDB;

-- ==============================
-- 11. Таблица лайков отзывов
-- ==============================
CREATE TABLE review_likes (
    review_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id, user_id),
    FOREIGN KEY (review_id) REFERENCES reviews(review_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_like_user (user_id)
) ENGINE=InnoDB;

-- ==============================
-- 12. Таблица закладок пользователей
-- ==============================
CREATE TABLE bookmarks (
    bookmark_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    folder VARCHAR(50) DEFAULT 'default',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uniq_user_movie_bookmark (user_id, movie_id, folder),
    INDEX idx_bookmark_user (user_id),
    INDEX idx_bookmark_movie (movie_id)
) ENGINE=InnoDB;

-- ==============================
-- 13. Триггеры для обновления рейтинга (ИСПРАВЛЕНО: все DECIMAL(4,2))
-- ==============================
DELIMITER //

-- Триггер после вставки отзыва
CREATE TRIGGER trg_review_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating_val DECIMAL(4,2);
    DECLARE rating_count_val INT UNSIGNED;
    
    SELECT 
        IFNULL(ROUND(AVG(rating), 2), 0.00),
        COUNT(*)
    INTO 
        avg_rating_val,
        rating_count_val
    FROM reviews 
    WHERE movie_id = NEW.movie_id AND is_approved = TRUE;
    
    UPDATE movies 
    SET 
        avg_rating = avg_rating_val,
        rating_count = rating_count_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE movie_id = NEW.movie_id;
END //

-- Триггер после обновления отзыва
CREATE TRIGGER trg_review_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating_val DECIMAL(4,2);
    DECLARE rating_count_val INT UNSIGNED;
    
    -- Обновляем только если изменился рейтинг или статус одобрения
    IF NEW.rating != OLD.rating OR NEW.is_approved != OLD.is_approved THEN
        SELECT 
            IFNULL(ROUND(AVG(rating), 2), 0.00),
            COUNT(*)
        INTO 
            avg_rating_val,
            rating_count_val
        FROM reviews 
        WHERE movie_id = NEW.movie_id AND is_approved = TRUE;
        
        UPDATE movies 
        SET 
            avg_rating = avg_rating_val,
            rating_count = rating_count_val,
            updated_at = CURRENT_TIMESTAMP
        WHERE movie_id = NEW.movie_id;
    END IF;
END //

-- Триггер после удаления отзыва
CREATE TRIGGER trg_review_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    DECLARE avg_rating_val DECIMAL(4,2);
    DECLARE rating_count_val INT UNSIGNED;
    
    SELECT 
        IFNULL(ROUND(AVG(rating), 2), 0.00),
        COUNT(*)
    INTO 
        avg_rating_val,
        rating_count_val
    FROM reviews 
    WHERE movie_id = OLD.movie_id AND is_approved = TRUE;
    
    UPDATE movies 
    SET 
        avg_rating = avg_rating_val,
        rating_count = rating_count_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE movie_id = OLD.movie_id;
END //

-- Триггер для обновления количества лайков
CREATE TRIGGER trg_review_like_after_insert
AFTER INSERT ON review_likes
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET likes_count = likes_count + 1
    WHERE review_id = NEW.review_id;
END //

CREATE TRIGGER trg_review_like_after_delete
AFTER DELETE ON review_likes
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE review_id = OLD.review_id;
END //

DELIMITER ;

-- ==============================
-- 14. Заполнение тестовыми данными (упрощённая версия)
-- ==============================

-- Жанры
INSERT INTO genres (name, slug) VALUES 
('Драма', 'drama'),
('Комедия', 'comedy'),
('Боевик', 'action'),
('Фантастика', 'sci-fi'),
('Триллер', 'thriller');

-- Режиссёры
INSERT INTO directors (full_name, country, birth_date) VALUES
('Кристофер Нолан', 'Великобритания', '1970-07-30'),
('Квентин Тарантино', 'США', '1963-03-27');

-- Актёры
INSERT INTO actors (full_name, country, birth_date) VALUES
('Леонардо Ди Каприо', 'США', '1974-11-11'),
('Мэтт Дэймон', 'США', '1970-10-08'),
('Брэд Питт', 'США', '1963-12-18'),
('Том Хэнкс', 'США', '1956-07-09');

-- Фильмы
INSERT INTO movies (title, slug, release_year, country, duration, director_id, description) VALUES
('Начало', 'inception', 2010, 'США, Великобритания', 148, 1, 'Фильм о снах и реальности.'),
('Криминальное чтиво', 'pulp-fiction', 1994, 'США', 154, 2, 'Двое бандитов ведут философские беседы.'),
('Побег из Шоушенка', 'the-shawshank-redemption', 1994, 'США', 142, NULL, 'История надежды и дружбы в тюрьме.');

-- Связи фильмов с жанрами
INSERT INTO movie_genres (movie_id, genre_id) VALUES
(1, 4), (1, 1), 
(2, 1), (2, 3), 
(3, 1);

-- Связи фильмов с актёрами
INSERT INTO movie_actors (movie_id, actor_id, role_name) VALUES
(1, 1, 'Кобб'),
(2, 3, 'Винсент Вега'),
(3, 4, 'Энди Дюфрейн');

-- Пользователи
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@film-service.test', '$2a$10$hashed', 'ADMIN'),
('user1', 'user1@film-service.test', '$2a$10$hashed', 'USER'),
('user2', 'user2@film-service.test', '$2a$10$hashed', 'USER');

-- ==============================
-- Тестирование: добавляем отзывы по одному
-- ==============================

-- Проверяем текущие рейтинги фильмов
SELECT movie_id, title, avg_rating, rating_count FROM movies;

-- Отзыв 1: user1 ставит фильму 1 оценку 9
INSERT INTO reviews (user_id, movie_id, rating, title, review_text) VALUES 
(2, 1, 9, 'Отличный фильм', 'Очень понравилось');

-- Проверяем обновление рейтинга фильма 1
SELECT movie_id, title, avg_rating, rating_count FROM movies WHERE movie_id = 1;

-- Отзыв 2: user2 ставит фильму 1 оценку 10
INSERT INTO reviews (user_id, movie_id, rating, title, review_text) VALUES 
(3, 1, 10, 'Шедевр', 'Лучший фильм года');

-- Проверяем обновление рейтинга фильма 1 (должно быть 9.5)
SELECT movie_id, title, avg_rating, rating_count FROM movies WHERE movie_id = 1;

-- Отзыв 3: user1 ставит фильму 2 оценку 8
INSERT INTO reviews (user_id, movie_id, rating, title, review_text) VALUES 
(2, 2, 8, 'Хороший фильм', 'Интересный сюжет');

-- Отзыв 4: user2 ставит фильму 3 оценку 10
INSERT INTO reviews (user_id, movie_id, rating, title, review_text) VALUES 
(3, 3, 10, 'Великолепно', 'Фильм изменил мою жизнь');

-- Проверяем все рейтинги
SELECT movie_id, title, avg_rating, rating_count FROM movies ORDER BY avg_rating DESC;

-- ==============================
-- 15. Создание представлений
-- ==============================

-- Представление для популярных фильмов
CREATE OR REPLACE VIEW popular_movies AS
SELECT 
    m.movie_id,
    m.title,
    m.slug,
    m.poster_url,
    m.release_year,
    m.avg_rating,
    m.rating_count,
    d.full_name AS director_name,
    GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres
FROM movies m
LEFT JOIN directors d ON m.director_id = d.director_id
LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.genre_id
WHERE m.rating_count >= 1
GROUP BY m.movie_id
ORDER BY m.avg_rating DESC, m.rating_count DESC;

-- Представление для статистики пользователей
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.user_id,
    u.username,
    u.registration_date,
    COUNT(DISTINCT r.review_id) AS reviews_count,
    COUNT(DISTINCT b.bookmark_id) AS bookmarks_count,
    IFNULL(AVG(r.rating), 0) AS avg_user_rating,
    MAX(r.created_at) AS last_review_date
FROM users u
LEFT JOIN reviews r ON u.user_id = r.user_id AND r.is_approved = TRUE
LEFT JOIN bookmarks b ON u.user_id = b.user_id
GROUP BY u.user_id;

-- ==============================
-- 16. Тестирование представлений
-- ==============================

-- Просмотр популярных фильмов
SELECT * FROM popular_movies;

-- Просмотр статистики пользователей
SELECT * FROM user_statistics;

-- ==============================
-- 17. Дополнительные индексы
-- ==============================
CREATE INDEX idx_movies_release_date ON movies(release_date);
CREATE INDEX idx_reviews_movie_user ON reviews(movie_id, user_id);
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at);

-- ==============================
-- 19. Тестирование лайков
-- ==============================

-- Таблица лайков фильмов
CREATE TABLE IF NOT EXISTS movie_likes (
    movie_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, user_id),
    KEY idx_movie_likes_movie (movie_id),
    KEY idx_movie_likes_user (user_id)
);

-- Пример данных для лайков фильмов
INSERT IGNORE INTO movie_likes (movie_id, user_id) VALUES
(1, 2),
(1, 3);

-- Закладки для тестирования
INSERT INTO bookmarks (user_id, movie_id, folder, notes) VALUES
(2, 1, 'favorites', 'Пересмотреть'),
(2, 2, 'watch_later', 'С друзьями'),
(3, 1, 'classics', 'Обязательно показать'),
(3, 3, 'favorites', 'Лучший фильм');

-- ==============================
-- 19. Тестирование лайков
-- ==============================
INSERT INTO review_likes (review_id, user_id) VALUES
(1, 3), -- user2 лайкает отзыв user1
(2, 2); -- user1 лайкает отзыв user2

-- Проверяем количество лайков
SELECT r.review_id, r.title, r.likes_count, u.username 
FROM reviews r
JOIN users u ON r.user_id = u.user_id;

-- ==============================
-- 20. Финальная проверка
-- ==============================

-- Все фильмы с рейтингами
SELECT 
    m.movie_id,
    m.title,
    m.avg_rating,
    m.rating_count,
    d.full_name AS director,
    COUNT(DISTINCT r.review_id) AS total_reviews
FROM movies m
LEFT JOIN directors d ON m.director_id = d.director_id
LEFT JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id
ORDER BY m.avg_rating DESC;

-- Все отзывы
SELECT 
    r.review_id,
    u.username,
    m.title,
    r.rating,
    r.title AS review_title,
    r.created_at
FROM reviews r
JOIN users u ON r.user_id = u.user_id
JOIN movies m ON r.movie_id = m.movie_id
ORDER BY r.created_at DESC;

-- Проверка таблиц
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'film-service'
ORDER BY TABLE_NAME;
