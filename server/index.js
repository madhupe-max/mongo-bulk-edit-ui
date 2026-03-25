import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

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
