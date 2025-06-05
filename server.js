const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔐 Configuration Cloudinary
cloudinary.config({
  cloud_name: 'dpkztx3hj',
  api_key: '577825446418914',
  api_secret: 'Qx2ENIdZaYGpI1hHRlTVEMe4drI'
});

// 📁 Multer + stockage cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'perso_project', // Dossier sur Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});
const upload = multer({ storage });

// 📂 Base de données JSON
const DB_FILE = './photos.json';

function readPhotos() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE));
  }
  return [];
}

function savePhotos(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 📥 Upload via Cloudinary
app.post('/api/photos', upload.single('photo'), (req, res) => {
  const photos = readPhotos();

  const newPhoto = {
    IdP: photos.length + 1,
    PhotoURL: req.file.path, // ✅ URL Cloudinary
    PhotoDescription: req.body.description || req.file.originalname,
    PhotoDate: new Date(),
    likes: 0,
    comments: []
  };

  photos.push(newPhoto);
  savePhotos(photos);

  res.status(201).json(newPhoto);
});

// 📤 Récupérer toutes les photos
app.get('/api/photos', (req, res) => {
  const photos = readPhotos();
  res.json(photos);
});

// 🔁 PATCH pour likes/comments
app.patch('/api/photos/:id', (req, res) => {
  const photos = readPhotos();
  const id = parseInt(req.params.id.trim());
  const index = photos.findIndex(p => p.IdP === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Photo non trouvée' });
  }

  const { likes, comments } = req.body;
  if (likes !== undefined) photos[index].likes = likes;
  if (comments !== undefined) photos[index].comments = comments;

  savePhotos(photos);
  res.json(photos[index]);
});

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur port ${PORT}`);
});
