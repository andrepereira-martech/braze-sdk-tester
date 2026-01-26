# Braze Currents Test Tool

A local testing tool for Braze Currents using MinIO S3-compatible object storage. This tool allows you to test Braze Currents data export locally without needing AWS S3 or other cloud storage services.

## Features

- 🪣 **MinIO Integration**: Local S3-compatible storage for testing
- 📊 **Event Monitoring**: Real-time monitoring of Braze Currents events
- 📥 **Event Viewer**: View and download event JSON files
- 🔧 **Configuration Helper**: Get ready-to-use configuration for Braze dashboard
- 📈 **Statistics**: Track event counts, sizes, and types
- 🗑️ **Event Management**: Delete individual events for testing

## Prerequisites

- Node.js 18+ installed
- Docker (for running MinIO) OR MinIO binary installed locally

## Quick Start

### 1. Install Dependencies

```bash
cd tools/braze-currents-test
npm install
```

### 2. Start MinIO

**Option A: Using Docker Compose (Recommended)**

```bash
docker-compose up -d
```

**Option B: Using Docker directly**

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

**Option C: Using MinIO Binary**

Download MinIO from [min.io/download](https://www.min.io/download) and run:

```bash
minio server ~/minio-data --console-address ":9001"
```

Access MinIO Console at: http://localhost:9001 (default credentials: minioadmin/minioadmin)

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults should work for local Docker setup):

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
CURRENTS_BUCKET_NAME=braze-currents
CURRENTS_REGION=us-east-1
SERVER_PORT=3001
```

### 4. Start the Test Server

```bash
npm start
```

The server will start on http://localhost:3001

## Configuring Braze Currents

1. Open your Braze dashboard
2. Navigate to **Partner Integrations → Currents**
3. Click **Add Partner** and select **Amazon S3**
4. Use the configuration values displayed in the tool's web interface:
   - **S3 Endpoint URL**: `http://localhost:9000` (or your MinIO endpoint)
   - **S3 Bucket Name**: `braze-currents` (or your configured bucket)
   - **S3 Region**: `us-east-1` (or your configured region)
   - **Access Key**: `minioadmin` (or your MinIO access key)
   - **Secret Key**: `minioadmin` (or your MinIO secret key)

**Important Notes:**
- For local testing, Braze needs to be able to reach your MinIO instance
- If Braze is hosted remotely, you'll need to expose MinIO via ngrok or similar tunneling service
- For production, use actual AWS S3 or a properly configured MinIO instance

## Using the Tool

### Web Interface

1. Open http://localhost:3001 in your browser
2. Check the **Connection Status** to ensure MinIO is connected
3. Copy the **Braze Currents Configuration** values to your Braze dashboard
4. Monitor incoming events in the **Currents Events** section
5. Click on any event to view its JSON content
6. Use the refresh buttons to update statistics and events list

### API Endpoints

The tool provides a REST API:

- `GET /api/health` - Check MinIO connection status
- `GET /api/config` - Get Braze Currents configuration
- `GET /api/stats` - Get bucket statistics
- `GET /api/objects` - List all events/objects
- `GET /api/objects/:name` - Get specific event content
- `DELETE /api/objects/:name` - Delete an event

## Event Types

Braze Currents exports various event types. Common ones include:

- **Customer Behavior Events**: User events, custom events, purchase events
- **Message Engagement Events**: Email opens, clicks, bounces, push notifications
- **Subscription Events**: Subscription group state changes

See [Braze Currents Event Glossary](https://www.braze.com/docs/user_guide/data/distribution/braze_currents/currents_event_glossary/) for complete list.

## Troubleshooting

### MinIO Connection Issues

- Ensure MinIO is running: `docker ps` (if using Docker)
- Check MinIO logs: `docker logs minio`
- Verify endpoint and port in `.env` file
- Test MinIO directly: http://localhost:9000

### No Events Appearing

- Verify Braze Currents is configured correctly
- Check that events are selected in Braze Currents configuration
- Ensure Braze can reach your MinIO endpoint (may need ngrok for remote Braze)
- Check MinIO bucket exists and has proper permissions

### Port Conflicts

- Change `SERVER_PORT` in `.env` if port 3001 is in use
- Change MinIO ports in Docker command if 9000/9001 are in use

## Development

### Running in Development Mode

```bash
npm run dev
```

This will watch for file changes and auto-restart the server.

### Project Structure

```
braze-currents-test/
├── server.js          # Express server and MinIO client
├── load-env.js        # Environment configuration loader
├── package.json       # Dependencies and scripts
├── .env.example       # Example environment variables
├── public/            # Web interface
│   ├── index.html     # Main HTML page
│   ├── app.js         # Frontend JavaScript
│   └── styles.css     # Styling
└── README.md          # This file
```

## References

- [Braze Currents Documentation](https://www.braze.com/docs/user_guide/data/distribution/braze_currents/setting_up_currents/)
- [MinIO Documentation](https://min.io/docs/)
- [Braze Currents Event Glossary](https://www.braze.com/docs/user_guide/data/distribution/braze_currents/currents_event_glossary/)

## License

MIT
