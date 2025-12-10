const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем директории для загрузок
const uploadDir = './uploads';
const avatarDir = './uploads/avatars';
const posterDir = './uploads/posters';
const backdropDir = './uploads/backdrops';
const personDir = './uploads/persons';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

if (!fs.existsSync(posterDir)) {
  fs.mkdirSync(posterDir, { recursive: true });
}
if (!fs.existsSync(backdropDir)) {
  fs.mkdirSync(backdropDir, { recursive: true });
}
if (!fs.existsSync(personDir)) {
  fs.mkdirSync(personDir, { recursive: true });
}

// Конфигурация для аватаров
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif)'));
  }
});

function makeUpload(storageDir, prefix) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, storageDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) return cb(null, true);
      cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif)'));
    }
  });
}

const posterUpload = makeUpload(posterDir, 'poster');
const backdropUpload = makeUpload(backdropDir, 'backdrop');
const personUpload = makeUpload(personDir, 'person');

module.exports = { avatarUpload, posterUpload, backdropUpload, personUpload };
