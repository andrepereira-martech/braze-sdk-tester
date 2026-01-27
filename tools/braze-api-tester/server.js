#!/usr/bin/env node

/**
 * Express server for Braze API Tester
 * Proxies requests to Braze REST API to avoid CORS issues
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Request history storage (in-memory, resets on server restart)
const requestHistory = [];

// Rate limit tracking
const rateLimitInfo = {
    limit: null,
    remaining: null,
    reset: null
};

/**
 * Proxy endpoint to forward requests to Braze REST API
 */
app.post('/api/proxy', async (req, res) => {
    try {
        const { method, endpoint, body, apiKey, restEndpoint } = req.body;

        // Validate required fields
        if (!endpoint || !method) {
            return res.status(400).json({
                error: 'Missing required fields: endpoint and method'
            });
        }

        // Use provided credentials or fall back to env vars
        const finalApiKey = apiKey || process.env.BRAZE_REST_API_KEY;
        const finalRestEndpoint = restEndpoint || process.env.BRAZE_REST_ENDPOINT;

        if (!finalApiKey) {
            return res.status(400).json({
                error: 'REST API Key is required. Set it in .env or provide in request.'
            });
        }

        if (!finalRestEndpoint) {
            return res.status(400).json({
                error: 'REST Endpoint is required. Set it in .env or provide in request.'
            });
        }

        // Build full URL
        const url = `${finalRestEndpoint.replace(/\/$/, '')}${endpoint}`;

        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${finalApiKey}`
        };

        // Make request to Braze API
        const startTime = Date.now();
        const fetchOptions = {
            method: method.toUpperCase(),
            headers
        };

        if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        const responseTime = Date.now() - startTime;

        // Extract rate limit info from headers
        if (response.headers.get('ratelimit-limit')) {
            rateLimitInfo.limit = parseInt(response.headers.get('ratelimit-limit'), 10);
            rateLimitInfo.remaining = parseInt(response.headers.get('ratelimit-remaining'), 10);
            rateLimitInfo.reset = parseInt(response.headers.get('ratelimit-reset'), 10);
        }

        // Read response body
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        // Log request to history
        const requestLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            method: method.toUpperCase(),
            endpoint,
            url,
            requestBody: body || null,
            status: response.status,
            responseTime,
            response: responseData,
            rateLimit: { ...rateLimitInfo }
        };

        requestHistory.push(requestLog);

        // Keep only last 100 requests
        if (requestHistory.length > 100) {
            requestHistory.shift();
        }

        // Return response
        res.status(response.status).json({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData,
            responseTime,
            rateLimit: { ...rateLimitInfo }
        });

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
});

/**
 * Get request history
 */
app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = requestHistory.slice(-limit).reverse();
    res.json(history);
});

/**
 * Get rate limit info
 */
app.get('/api/rate-limit', (req, res) => {
    res.json(rateLimitInfo);
});

/**
 * Clear request history
 */
app.delete('/api/history', (req, res) => {
    requestHistory.length = 0;
    res.json({ message: 'History cleared' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Braze API Tester server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser`);
    
    if (!process.env.BRAZE_REST_API_KEY) {
        console.warn('⚠️  Warning: BRAZE_REST_API_KEY not set in .env file');
        console.warn('   You can still use the tool by entering credentials in the UI');
    }
    
    if (!process.env.BRAZE_REST_ENDPOINT) {
        console.warn('⚠️  Warning: BRAZE_REST_ENDPOINT not set in .env file');
        console.warn('   Default endpoint will be used');
    }
});
