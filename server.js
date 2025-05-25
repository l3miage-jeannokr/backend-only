const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

const DB_FILE = './photos.json';

function normalizePhoto(p) {
  return {
    ...p,
    likes: typeof p.likes === 'number' ? p.likes : 0,
    comments: Array.isArray(p.comments) ? p.comments : []
  };
}

function readPhotos() {
  if (fs.existsSync(DB_FILE)) {
    const raw = JSON.parse(fs.readFileSync(DB_FILE));
    const normalized = raw.map(normalizePhoto);
    savePhotos(normalized);
    return normalized;
  }
  return [];
}

function savePhotos(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  console.log('✅ photos.json mis à jour avec', data.length, 'photos');
}

// 📥 POST /api/photos
app.post('/api/photos', upload.single('photo'), (req, res) => {
  const photos = readPhotos();
  const baseURL = 'https://backend-only-iozr.onrender.com';

  const newPhoto = {
    IdP: photos.length + 1,
    PhotoURL: `${baseURL}/uploads/${req.file.filename}`,
    PhotoDescription: req.body.description || req.file.originalname,
    PhotoDate: new Date(),
    likes: 0,
    comments: []
  };

  photos.push(newPhoto);
  savePhotos(photos);
  res.status(201).json(newPhoto);
});

// 📤 GET /api/photos
app.get('/api/photos', (req, res) => {
  const photos = readPhotos();
  res.json(photos);
});

// 🔁 PATCH /api/photos/:id
app.patch('/api/photos/:id', (req, res) => {
  const photos = readPhotos();
  const id = parseInt(req.params.id.trim());
  const index = photos.findIndex(p => p.IdP === id);

  if (index === -1) {
    console.log(`❌ Photo ID ${id} non trouvée`);
    return res.status(404).json({ error: 'Photo non trouvée' });
  }

  const { likes, comments } = req.body;

  if (likes !== undefined) photos[index].likes = likes;
  if (comments !== undefined) photos[index].comments = comments;

  savePhotos(photos);
  res.json(photos[index]);
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
