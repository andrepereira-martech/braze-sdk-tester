/**
 * Braze API Tester - Frontend Application Logic
 */

// Import config (generated from .env)
import { BRAZE_REST_API_KEY, BRAZE_REST_ENDPOINT } from './config.js';

// API base URL
const API_BASE = '/api';

// DOM Elements
const configForm = document.getElementById('config-form');
const apiKeyInput = document.getElementById('api-key-input');
const endpointSelect = document.getElementById('endpoint-select');
const testConnectionBtn = document.getElementById('test-connection-btn');
const connectionStatus = document.getElementById('connection-status');

const templateSelect = document.getElementById('template-select');
const requestForm = document.getElementById('request-form');
const methodSelect = document.getElementById('method-select');
const endpointInput = document.getElementById('endpoint-input');
const requestBodyInput = document.getElementById('request-body-input');
const sendRequestBtn = document.getElementById('send-request-btn');
const clearRequestBtn = document.getElementById('clear-request-btn');
const formatJsonBtn = document.getElementById('format-json-btn');

const responseStatusCode = document.getElementById('response-status-code');
const responseStatusText = document.getElementById('response-status-text');
const responseTime = document.getElementById('response-time');
const responseBodyInput = document.getElementById('response-body-input');
const copyResponseBtn = document.getElementById('copy-response-btn');

const rateLimitLimit = document.getElementById('rate-limit-limit');
const rateLimitRemaining = document.getElementById('rate-limit-remaining');
const rateLimitReset = document.getElementById('rate-limit-reset');

const historyContainer = document.getElementById('history-container');
const refreshHistoryBtn = document.getElementById('refresh-history-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Pre-built templates for Phase 1 endpoints
const templates = {
    'users-track': {
        method: 'POST',
        endpoint: '/users/track',
        body: {
            events: [
                {
                    external_id: 'user123',
                    name: 'purchase',
                    time: new Date().toISOString(),
                    properties: {
                        product_id: 'prod_123',
                        price: 99.99,
                        currency: 'USD'
                    }
                }
            ]
        }
    },
    'users-export-ids': {
        method: 'POST',
        endpoint: '/users/export/ids',
        body: {
            external_ids: ['user123', 'user456'],
            fields_to_export: ['first_name', 'last_name', 'email', 'custom_attributes']
        }
    },
    'campaigns-trigger-send': {
        method: 'POST',
        endpoint: '/campaigns/trigger/send',
        body: {
            campaign_id: 'your-campaign-id-here',
            send_id: 'test-send-' + Date.now(),
            trigger_properties: {
                example_property: 'example_value'
            },
            recipients: [
                {
                    external_user_id: 'user123'
                }
            ]
        }
    },
    'canvas-trigger-send': {
        method: 'POST',
        endpoint: '/canvas/trigger/send',
        body: {
            canvas_id: 'your-canvas-id-here',
            canvas_entry_properties: {
                example_property: 'example_value'
            },
            recipients: [
                {
                    external_user_id: 'user123'
                }
            ],
            send_id: 'test-send-' + Date.now()
        }
    },
    'segments-list': {
        method: 'GET',
        endpoint: '/segments/list',
        body: null
    },
    // Phase 2 templates
    'messages-send': {
        method: 'POST',
        endpoint: '/messages/send',
        body: {
            external_user_ids: ['user123'],
            messages: {
                email: {
                    app_id: 'your-app-id-here',
                    subject: 'Test Email',
                    from: 'sender@example.com',
                    reply_to: 'reply@example.com',
                    body: 'This is a test email message.',
                    plaintext_body: 'This is a test email message.'
                }
            }
        }
    },
    'users-identify': {
        method: 'POST',
        endpoint: '/users/identify',
        body: {
            aliases_to_identify: [
                {
                    external_id: 'user123',
                    user_alias: {
                        alias_name: 'email',
                        alias_label: 'email_address'
                    }
                }
            ]
        }
    },
    'users-merge': {
        method: 'POST',
        endpoint: '/users/merge',
        body: {
            merge_updates: [
                {
                    identifier_to_merge: {
                        external_id: 'user123'
                    },
                    identifier_to_keep: {
                        external_id: 'user456'
                    }
                }
            ]
        }
    },
    'campaigns-list': {
        method: 'GET',
        endpoint: '/campaigns/list',
        body: null
    },
    'canvas-list': {
        method: 'GET',
        endpoint: '/canvas/list',
        body: null
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeConfig();
    setupEventListeners();
    loadRequestHistory();
    startRateLimitPolling();
});

// Initialize configuration from config.js
function initializeConfig() {
    if (BRAZE_REST_API_KEY && BRAZE_REST_API_KEY !== 'your-rest-api-key-here') {
        apiKeyInput.value = BRAZE_REST_API_KEY;
        apiKeyInput.setAttribute('readonly', 'readonly');
        apiKeyInput.style.backgroundColor = '#f0f0f0';
    }

    if (BRAZE_REST_ENDPOINT && BRAZE_REST_ENDPOINT !== 'https://rest.iad-03.braze.com') {
        endpointSelect.value = BRAZE_REST_ENDPOINT;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Template selection
    templateSelect.addEventListener('change', handleTemplateSelect);

    // Request form
    requestForm.addEventListener('submit', handleSendRequest);
    clearRequestBtn.addEventListener('click', clearRequest);
    formatJsonBtn.addEventListener('click', formatJson);

    // Connection test
    testConnectionBtn.addEventListener('click', testConnection);

    // Response copy
    copyResponseBtn.addEventListener('click', copyResponse);

    // History
    refreshHistoryBtn.addEventListener('click', loadRequestHistory);
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Method change - clear body for GET requests
    methodSelect.addEventListener('change', () => {
        if (methodSelect.value === 'GET') {
            requestBodyInput.value = '';
            requestBodyInput.disabled = true;
        } else {
            requestBodyInput.disabled = false;
        }
    });
}

// Handle template selection
function handleTemplateSelect(e) {
    const templateKey = e.target.value;
    if (!templateKey || !templates[templateKey]) {
        return;
    }

    const template = templates[templateKey];
    methodSelect.value = template.method;
    endpointInput.value = template.endpoint;
    
    if (template.body) {
        requestBodyInput.value = JSON.stringify(template.body, null, 2);
        requestBodyInput.disabled = false;
    } else {
        requestBodyInput.value = '';
        requestBodyInput.disabled = true;
    }

    // Update method select handler
    if (template.method === 'GET') {
        requestBodyInput.disabled = true;
    }
}

// Handle send request
async function handleSendRequest(e) {
    e.preventDefault();

    const method = methodSelect.value;
    const endpoint = endpointInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;
    
    let body = null;
    if (method !== 'GET' && requestBodyInput.value.trim()) {
        try {
            body = JSON.parse(requestBodyInput.value);
        } catch (error) {
            showError('Invalid JSON in request body: ' + error.message);
            return;
        }
    }

    if (!endpoint) {
        showError('Endpoint is required');
        return;
    }

    if (!apiKey) {
        showError('REST API Key is required');
        return;
    }

    // Disable send button
    sendRequestBtn.disabled = true;
    sendRequestBtn.textContent = 'Sending...';

    try {
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method,
                endpoint,
                body,
                apiKey,
                restEndpoint
            })
        });

        const data = await response.json();

        // Display response
        displayResponse(data);

        // Update rate limit
        if (data.rateLimit) {
            updateRateLimit(data.rateLimit);
        }

        // Reload history
        loadRequestHistory();

    } catch (error) {
        showError('Request failed: ' + error.message);
        displayResponse({
            status: 0,
            statusText: 'Error',
            data: { error: error.message },
            responseTime: 0
        });
    } finally {
        sendRequestBtn.disabled = false;
        sendRequestBtn.textContent = 'Send Request';
    }
}

// Display response
function displayResponse(data) {
    responseStatusCode.textContent = data.status || '-';
    responseStatusCode.className = 'status-code ' + getStatusClass(data.status);
    responseStatusText.textContent = data.statusText || '';
    responseTime.textContent = data.responseTime ? `${data.responseTime}ms` : '';

    // Format response body
    let responseText = '';
    if (data.data) {
        if (typeof data.data === 'string') {
            responseText = data.data;
        } else {
            responseText = JSON.stringify(data.data, null, 2);
        }
    }

    responseBodyInput.value = responseText;
}

// Get status code CSS class
function getStatusClass(status) {
    if (!status) return '';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-warning';
    if (status >= 400) return 'status-error';
    return '';
}

// Clear request form
function clearRequest() {
    templateSelect.value = '';
    methodSelect.value = 'POST';
    endpointInput.value = '';
    requestBodyInput.value = '';
    requestBodyInput.disabled = false;
}

// Format JSON
function formatJson() {
    const value = requestBodyInput.value.trim();
    if (!value) return;

    try {
        const parsed = JSON.parse(value);
        requestBodyInput.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
        showError('Invalid JSON: ' + error.message);
    }
}

// Test connection
async function testConnection() {
    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;

    if (!apiKey) {
        showConnectionStatus('Please enter REST API Key', 'error');
        return;
    }

    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = 'Testing...';
    showConnectionStatus('Testing connection...', 'info');

    try {
        // Test with a simple GET request (segments/list is a good test endpoint)
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'GET',
                endpoint: '/segments/list',
                apiKey,
                restEndpoint
            })
        });

        const data = await response.json();

        if (data.status === 200 || data.status === 401) {
            // 401 means credentials are being checked (auth is working)
            showConnectionStatus('✓ Connection successful! Credentials are valid.', 'success');
        } else if (data.status === 403) {
            showConnectionStatus('⚠ Connection successful but API key may not have required permissions', 'warning');
        } else {
            showConnectionStatus(`Connection failed: ${data.status} ${data.statusText}`, 'error');
        }

        // Update rate limit if available
        if (data.rateLimit) {
            updateRateLimit(data.rateLimit);
        }

    } catch (error) {
        showConnectionStatus('Connection failed: ' + error.message, 'error');
    } finally {
        testConnectionBtn.disabled = false;
        testConnectionBtn.textContent = 'Test Connection';
    }
}

// Show connection status
function showConnectionStatus(message, type) {
    connectionStatus.textContent = message;
    connectionStatus.className = 'status-message status-' + type;
    connectionStatus.style.display = 'block';
}

// Copy response
function copyResponse() {
    responseBodyInput.select();
    document.execCommand('copy');
    
    const originalText = copyResponseBtn.textContent;
    copyResponseBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyResponseBtn.textContent = originalText;
    }, 2000);
}

// Load request history
async function loadRequestHistory() {
    try {
        const response = await fetch(`${API_BASE}/history?limit=20`);
        const history = await response.json();

        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="help-text">No requests yet. Send a request to see history.</p>';
            return;
        }

        historyContainer.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-method ${item.method.toLowerCase()}">${item.method}</span>
                    <span class="history-endpoint">${item.endpoint}</span>
                    <span class="history-status status-code ${getStatusClass(item.status)}">${item.status}</span>
                    <span class="history-time">${item.responseTime}ms</span>
                    <span class="history-timestamp">${new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="history-actions">
                    <button class="btn-small" onclick="replayRequest('${item.id}')">Replay</button>
                    <button class="btn-small" onclick="viewRequestDetails('${item.id}')">View</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Replay request
window.replayRequest = async function(requestId) {
    try {
        const response = await fetch(`${API_BASE}/history`);
        const history = await response.json();
        const item = history.find(h => h.id === requestId);

        if (!item) {
            showError('Request not found');
            return;
        }

        // Fill form with request data
        methodSelect.value = item.method;
        endpointInput.value = item.endpoint;
        if (item.requestBody) {
            requestBodyInput.value = JSON.stringify(item.requestBody, null, 2);
            requestBodyInput.disabled = false;
        } else {
            requestBodyInput.value = '';
            requestBodyInput.disabled = item.method === 'GET';
        }

        // Scroll to request form
        requestForm.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showError('Failed to replay request: ' + error.message);
    }
};

// View request details
window.viewRequestDetails = async function(requestId) {
    try {
        const response = await fetch(`${API_BASE}/history`);
        const history = await response.json();
        const item = history.find(h => h.id === requestId);

        if (!item) {
            showError('Request not found');
            return;
        }

        // Display response
        displayResponse(item);
        
        // Scroll to response section
        document.querySelector('.section:has(#response-body-input)').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showError('Failed to load request details: ' + error.message);
    }
};

// Clear history
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all request history?')) {
        return;
    }

    try {
        await fetch(`${API_BASE}/history`, { method: 'DELETE' });
        loadRequestHistory();
    } catch (error) {
        showError('Failed to clear history: ' + error.message);
    }
}

// Update rate limit display
function updateRateLimit(rateLimit) {
    if (rateLimit.limit !== null) {
        rateLimitLimit.textContent = rateLimit.limit.toLocaleString();
    }
    if (rateLimit.remaining !== null) {
        rateLimitRemaining.textContent = rateLimit.remaining.toLocaleString();
        rateLimitRemaining.className = 'value ' + 
            (rateLimit.remaining < rateLimit.limit * 0.1 ? 'warning' : '');
    }
    if (rateLimit.reset) {
        const resetDate = new Date(rateLimit.reset * 1000);
        rateLimitReset.textContent = resetDate.toLocaleTimeString();
    }
}

// Start rate limit polling
function startRateLimitPolling() {
    setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/rate-limit`);
            const rateLimit = await response.json();
            updateRateLimit(rateLimit);
        } catch (error) {
            // Silently fail - rate limit may not be available yet
        }
    }, 5000); // Poll every 5 seconds
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
    console.error(message);
}
