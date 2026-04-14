# MongoDB Bulk Edit UI

A full-stack React application for loading, displaying, and bulk-editing MongoDB records in a table format.

## Features

- ✓ Load records from MongoDB
- ✓ Display in responsive table
- ✓ Select and bulk edit multiple rows
- ✓ Efficient batch updates via API
- ✓ Real-time UI updates

## Prerequisites

- **Node.js** (v16+)
- **MongoDB** running locally or accessible via connection string
- **Docker** (for local Elasticsearch + Kibana)
- **npm** or **yarn**

## Quick Start

### 1. Open the project in VS Code

```bash
code ~/mongo-bulk-edit-ui
```

### 2. Install dependencies

```bash
npm run install-all
```

This installs packages for root, client, and server.

### 3. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Copy `.env.example` to `.env` in the `server` folder
4. Update `MONGO_URI` with your Atlas connection string

### 4. (Optional) Seed sample data

Before starting, populate MongoDB with sample records. In a new terminal:

```bash
mongosh  # Open MongoDB shell
use bulk_edit_db
db.records.insertMany([
  { name: "John Doe", email: "john@example.com", status: "active", department: "Engineering" },
  { name: "Jane Smith", email: "jane@example.com", status: "inactive", department: "Sales" },
  { name: "Bob Johnson", email: "bob@example.com", status: "active", department: "Marketing" },
  { name: "Alice Brown", email: "alice@example.com", status: "active", department: "HR" }
])
```

### 5. (Optional) Start local Elasticsearch + Kibana

This project includes a local observability stack in `docker-compose.observability.yml`.

```bash
# Start Elasticsearch + Kibana
docker compose -f docker-compose.observability.yml up -d

# Check container status
docker compose -f docker-compose.observability.yml ps

# Stop stack
docker compose -f docker-compose.observability.yml down
```

Service URLs:
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

### 6. Start the app

```bash
npm run dev
```

Both client and server start concurrently:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## How to Use

1. **View Records**: The table loads all records from the MongoDB collection
2. **Select Rows**: Click checkboxes to select one or more records
3. **Bulk Edit**:
   - Click "Bulk Edit" button (appears when rows selected)
   - Enter new values for fields you want to update
   - Click "Apply Updates" to commit changes
   - Table refreshes automatically
4. **Refresh**: Use "↻ Refresh" to manually reload data

## Project Structure

```
mongo-bulk-edit-ui/
├── docker-compose.observability.yml  # Local Elasticsearch + Kibana stack
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx        # Main component with table & bulk edit
│   │   ├── App.css        # Styling
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── index.js           # API routes & MongoDB connection
│   ├── utils/
│   │   └── smartLogger.js # Console capture + Elasticsearch log shipping
│   ├── .env.example       # Environment template
│   └── package.json
├── package.json           # Root scripts (dev, install-all)
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/records` | Get all records |
| GET | `/api/records/:id` | Get single record |
| POST | `/api/records` | Create record |
| PUT | `/api/records/:id` | Update single record |
| POST | `/api/records/bulk/update` | **Bulk update multiple records** |
| DELETE | `/api/records/:id` | Delete record |
| GET | `/api/health` | Health check |

## Example: Bulk Update

```bash
curl -X POST http://localhost:5000/api/records/bulk/update \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "updates": { "status": "inactive", "department": "Operations" }
  }'
```

## Environment Variables

**Server** (`.env`):
```
MONGO_URI=mongodb://localhost:27017
# OR for MongoDB Atlas:
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/

# Smart logger to Elasticsearch (view in Kibana)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=app-logs
ELASTICSEARCH_API_KEY=
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Logger tuning
LOG_SERVICE_NAME=mongo-bulk-edit-ui-server
LOG_CAPTURE_CONSOLE=true
LOG_HTTP_REQUESTS=true
LOG_FLUSH_INTERVAL_MS=2000
LOG_BATCH_SIZE=50
LOG_MAX_QUEUE_SIZE=1000
LOG_REQUEST_TIMEOUT_MS=4000
```

If `ELASTICSEARCH_URL` is set, the backend smart logger captures console logs and HTTP request logs, then sends them to Elasticsearch using the bulk API. In Kibana, create a data view for `app-logs*` (or your configured index).

## Troubleshooting

**"Cannot GET /api/records"**
- Ensure server is running on port 5000
- Check MongoDB connection in terminal

**"No records found"**
- Insert sample data into MongoDB (see step 4 above)
- Check the database and collection names match

**Port already in use**
- Client: Change port in `client/vite.config.js`
- Server: Change `PORT` in `server/index.js`

**CORS errors**
- Ensure `cors` middleware is enabled in server (it is by default)

**Kibana or Elasticsearch not reachable**
- Ensure Docker is running
- Run `docker compose -f docker-compose.observability.yml ps` and verify both containers are healthy
- Check `ELASTICSEARCH_URL` in `server/.env` points to `http://localhost:9200`

## Development Commands

```bash
# Start both client and server
npm run dev

# Start only client
npm run client

# Start only server  
npm run server

# Install all dependencies
npm run install-all
```

## Next Steps

- Add filtering and sorting
- Implement pagination for large datasets
- Add row-level edit modal
- Deploy to production (Vercel + MongoDB Atlas)
- Add authentication
