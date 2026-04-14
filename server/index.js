import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { createSmartLogger } from './utils/smartLogger.js';

dotenv.config();

const logger = createSmartLogger({
  serviceName: process.env.LOG_SERVICE_NAME || 'mongo-bulk-edit-ui-server',
  environment: process.env.NODE_ENV || 'development',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || '',
  indexName: process.env.ELASTICSEARCH_INDEX || 'app-logs',
  apiKey: process.env.ELASTICSEARCH_API_KEY || '',
  username: process.env.ELASTICSEARCH_USERNAME || '',
  password: process.env.ELASTICSEARCH_PASSWORD || '',
  captureConsole: process.env.LOG_CAPTURE_CONSOLE || 'true',
  enableHttpLogging: process.env.LOG_HTTP_REQUESTS || 'true',
  flushIntervalMs: process.env.LOG_FLUSH_INTERVAL_MS || 2000,
  batchSize: process.env.LOG_BATCH_SIZE || 50,
  maxQueueSize: process.env.LOG_MAX_QUEUE_SIZE || 1000,
  requestTimeoutMs: process.env.LOG_REQUEST_TIMEOUT_MS || 4000
});

const app = express();
const PORT = Number(process.env.PORT || 5050);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'bulk_edit_db';
const COLLECTION_NAME = 'records';

let db;
let recordsCollection;

const connectDB = async () => {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    recordsCollection = db.collection(COLLECTION_NAME);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger.createHttpMiddleware());

// Get all records
app.get('/api/records', async (req, res) => {
  try {
    const records = await recordsCollection.find({}).toArray();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single record
app.get('/api/records/:id', async (req, res) => {
  try {
    const record = await recordsCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create record
app.post('/api/records', async (req, res) => {
  try {
    const result = await recordsCollection.insertOne(req.body);
    res.status(201).json({ _id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update single record
app.put('/api/records/:id', async (req, res) => {
  try {
    const result = await recordsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: result.modifiedCount > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk edit - update multiple records
app.post('/api/records/bulk/update', async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    if (!Array.isArray(ids) || !updates) {
      return res.status(400).json({ error: 'Missing ids or updates' });
    }

    const objectIds = ids.map(id => new ObjectId(id));
    const result = await recordsCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updates }
    );

    res.json({ 
      success: true,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete record
app.delete('/api/records/:id', async (req, res) => {
  try {
    const result = await recordsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: result.deletedCount > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });
});

process.on('SIGINT', async () => {
  await logger.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await logger.stop();
  process.exit(0);
});
