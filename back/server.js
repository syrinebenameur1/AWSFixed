// server.js
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 4000;

// Create necessary directories
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const FILES_DIR = path.join(process.cwd(), 'files');
const DB_FILE = path.join(process.cwd(), 'db.json');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, FILES_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Allow frontend access
// server.js
app.use(cors({
  origin: ['http://localhost:3000','http://localhost:8080','http://localhost:30280','http://localhost:30001'],
  methods: ['GET','POST','DELETE'],
  allowedHeaders: ['Content-Type','Accept']
}));


// Request logging middleware
app.use((req, res, next) => {
  console.log('\n=== New Request ===');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.method === 'POST') {
    console.log('Body:', req.body);
  }
  next();
});

// Helper function to read/write to our JSON "database"
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return [];
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing to database:', err);
    return false;
  }
};

// Check config
console.log('\n=== Server Configuration ===');
console.log("✅ Server running on port", port);
console.log("✅ Uploads directory:", UPLOADS_DIR);
console.log("✅ Files directory:", FILES_DIR);
console.log("✅ Database file:", DB_FILE);
console.log('===========================\n');

// Serve static files
app.use('/files', express.static(FILES_DIR));

// Add a route to view database content
app.get('/api/debug', (req, res) => {
  try {
    const db = readDB();
    const files = fs.readdirSync(FILES_DIR);
    res.json({
      database: db,
      files: files,
      uploadsDir: fs.readdirSync(UPLOADS_DIR),
      filesDir: fs.readdirSync(FILES_DIR)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log('\n=== Upload Request ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  if (!req.file) {
    console.error("❌ No file uploaded");
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    // Save metadata to our JSON "database"
    const db = readDB();
    const newItem = {
      id: uuidv4(),
      filename: req.file.originalname,
      path: req.file.filename,
      uploadedAt: new Date().toISOString(),
      email: req.body.email || '',
      username: req.body.username || '',
      age: req.body.age || ''
    };

    console.log('Saving new item to database:', newItem);
    db.push(newItem);
    
    if (!writeDB(db)) {
      throw new Error('Failed to write to database');
    }

    console.log('✅ Metadata saved to database. Current database:', db);
    
    // Send response with the new item
    res.status(200).json({ 
      message: "File uploaded successfully.",
      data: newItem
    });
  } catch (err) {
    console.error("❌ Error:", err);
    // If there was an error, try to clean up the uploaded file
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("Failed to clean up file:", cleanupErr);
      }
    }
    res.status(500).json({ error: "Failed to upload file.", details: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  console.log('\n=== Fetching Users ===');
  try {
    const db = readDB();
    console.log('✅ Users fetched:', db);
    res.json(db);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
});

// Get all files
app.get("/api/files", async (req, res) => {
  console.log('\n=== Fetching Files ===');
  try {
    const files = fs.readdirSync(FILES_DIR).map(filename => ({
      Key: filename,
      LastModified: fs.statSync(path.join(FILES_DIR, filename)).mtime
    }));
    console.log('✅ Files fetched:', files.length, 'files');
    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files", details: err.message });
  }
});

// Delete file
app.delete("/api/files/:key", async (req, res) => {
  console.log('\n=== Deleting File ===');
  console.log('Key:', req.params.key);
  try {
    const filePath = path.join(FILES_DIR, req.params.key);
    fs.unlinkSync(filePath);
    
    // Remove from database
    const db = readDB();
    const newDb = db.filter(item => item.path !== req.params.key);
    writeDB(newDb);
    
    console.log('✅ File deleted successfully');
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file", details: err.message });
  }
});

app.listen(port);
