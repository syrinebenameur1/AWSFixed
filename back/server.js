// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
app.use(cors());
app.use(express.json());

// Load env
const isLocal = process.env.IS_LOCAL === 'true';
const TABLE = process.env.DYNAMODB_TABLE || 'Users';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads folder
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// DynamoDB Local / AWS config
const dynamoClient = new DynamoDBClient({
  region: isLocal ? 'local' : process.env.AWS_REGION,
  credentials: {
    accessKeyId: isLocal ? 'fakeMyKeyId' : process.env.AWS_ACCESS_KEY,
    secretAccessKey: isLocal ? 'fakeSecretAccessKey' : process.env.AWS_SECRET_KEY,
  },
  ...(isLocal && { endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000' }),
});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

// Multer: keep file in memory then write to disk
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/users
 *   - Saves uploaded file under /uploads
 *   - Creates an item in DynamoDB with file path
 */
app.post('/api/users', upload.single('file'), async (req, res) => {
  try {
    const { email, username, age } = req.body;
    const id = uuidv4();
    const filename = `${Date.now()}_${req.file.originalname}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Write file to disk
    fs.writeFileSync(filepath, req.file.buffer);

    // Store user + fileKey in DynamoDB
    await dynamo.send(new PutCommand({
      TableName: TABLE,
      Item: { id, email, username, age: parseInt(age), fileKey: filename }
    }));

    res.json({ id, email, username, age, fileKey: filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

/**
 * GET /api/users
 *   - Returns all users from DynamoDB
 */
app.get('/api/users', async (_, res) => {
  try {
    const data = await dynamo.send(new ScanCommand({ TableName: TABLE }));
    res.json(data.Items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

/**
 * GET /api/files
 *   - Lists all files in uploads folder
 */
app.get('/api/files', (_, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR).map(filename => {
      const stats = fs.statSync(path.join(UPLOADS_DIR, filename));
      return { filename, lastModified: stats.mtime };
    });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
  }
});

/**
 * DELETE /api/files/:filename
 *   - Deletes a file from uploads folder
 */
app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return res.json({ deleted: filename });
    } else {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
