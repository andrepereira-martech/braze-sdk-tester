import express from 'express';
import cors from 'cors';
import { MinioClient } from 'minio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize MinIO client
const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = process.env.CURRENTS_BUCKET_NAME || 'braze-currents';
const REGION = process.env.CURRENTS_REGION || 'us-east-1';

// Ensure bucket exists
async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, REGION);
      console.log(`✓ Created bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`✓ Bucket exists: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    res.json({
      status: 'ok',
      minio: {
        endpoint: `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
        bucket: BUCKET_NAME,
        bucketExists: exists
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get MinIO connection info for Braze configuration
app.get('/api/config', (req, res) => {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const protocol = useSSL ? 'https' : 'http';
  
  res.json({
    endpoint: `${endpoint}:${port}`,
    endpointUrl: `${protocol}://${endpoint}:${port}`,
    bucket: BUCKET_NAME,
    region: REGION,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    // Note: Secret key should not be exposed, but shown here for testing purposes
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    brazeConfig: {
      s3Endpoint: `${protocol}://${endpoint}:${port}`,
      s3Bucket: BUCKET_NAME,
      s3Region: REGION,
      s3AccessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      s3SecretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    }
  });
});

// List all objects in the bucket
app.get('/api/objects', async (req, res) => {
  try {
    const objects = [];
    const stream = minioClient.listObjects(BUCKET_NAME, '', true);
    
    for await (const obj of stream) {
      objects.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag
      });
    }
    
    // Sort by last modified (newest first)
    objects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    res.json({
      bucket: BUCKET_NAME,
      count: objects.length,
      objects
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get object content
app.get('/api/objects/:objectName(*)', async (req, res) => {
  try {
    const objectName = req.params.objectName;
    const dataStream = await minioClient.getObject(BUCKET_NAME, objectName);
    
    let data = '';
    dataStream.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    dataStream.on('end', () => {
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(data);
        res.json({
          objectName,
          type: 'json',
          data: jsonData
        });
      } catch (e) {
        // If not JSON, return as text
        res.json({
          objectName,
          type: 'text',
          data: data
        });
      }
    });
    
    dataStream.on('error', (error) => {
      res.status(500).json({
        error: error.message
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Delete object
app.delete('/api/objects/:objectName(*)', async (req, res) => {
  try {
    const objectName = req.params.objectName;
    await minioClient.removeObject(BUCKET_NAME, objectName);
    res.json({
      success: true,
      message: `Deleted ${objectName}`
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get bucket statistics
app.get('/api/stats', async (req, res) => {
  try {
    const objects = [];
    let totalSize = 0;
    const stream = minioClient.listObjects(BUCKET_NAME, '', true);
    
    for await (const obj of stream) {
      objects.push(obj);
      totalSize += obj.size || 0;
    }
    
    // Group by event type (if JSON files)
    const eventTypes = {};
    for (const obj of objects) {
      if (obj.name.endsWith('.json')) {
        try {
          const dataStream = await minioClient.getObject(BUCKET_NAME, obj.name);
          let data = '';
          dataStream.on('data', (chunk) => { data += chunk.toString(); });
          await new Promise((resolve) => {
            dataStream.on('end', resolve);
          });
          
          const jsonData = JSON.parse(data);
          const eventType = jsonData.type || jsonData.event_type || 'unknown';
          eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
        } catch (e) {
          // Skip if not JSON or can't parse
        }
      }
    }
    
    res.json({
      bucket: BUCKET_NAME,
      totalObjects: objects.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      eventTypes,
      lastUpdated: objects.length > 0 
        ? objects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0].lastModified
        : null
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Start server
async function startServer() {
  try {
    await ensureBucket();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Braze Currents Test Server running on http://localhost:${PORT}`);
      console.log(`📦 MinIO Bucket: ${BUCKET_NAME}`);
      console.log(`🔗 MinIO Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
      console.log(`\nOpen http://localhost:${PORT} in your browser\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('\nMake sure MinIO is running!');
    console.error('Run: docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"');
    process.exit(1);
  }
}

startServer();
