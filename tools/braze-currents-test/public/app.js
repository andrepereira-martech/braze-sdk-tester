const API_BASE = window.location.origin;

let currentEventName = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkConnection();
    await loadConfig();
    await loadStats();
    await loadEvents();
    
    // Set up auto-refresh
    setInterval(loadStats, 30000); // Refresh stats every 30 seconds
    setInterval(loadEvents, 30000); // Refresh events every 30 seconds
    
    // Event listeners
    document.getElementById('refresh-stats-btn').addEventListener('click', loadStats);
    document.getElementById('refresh-events-btn').addEventListener('click', loadEvents);
});

// Check MinIO connection
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (data.status === 'ok' && data.minio.bucketExists) {
            indicator.className = 'status-indicator status-ok';
            text.textContent = `Connected to MinIO | Bucket: ${data.minio.bucket}`;
        } else {
            indicator.className = 'status-indicator status-error';
            text.textContent = 'Connection error - Check if MinIO is running';
        }
    } catch (error) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        indicator.className = 'status-indicator status-error';
        text.textContent = `Connection failed: ${error.message}`;
    }
}

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config`);
        const config = await response.json();
        
        document.getElementById('config-endpoint').textContent = config.brazeConfig.s3Endpoint;
        document.getElementById('config-bucket').textContent = config.brazeConfig.s3Bucket;
        document.getElementById('config-region').textContent = config.brazeConfig.s3Region;
        document.getElementById('config-access-key').textContent = config.brazeConfig.s3AccessKey;
        document.getElementById('config-secret-key').textContent = config.brazeConfig.s3SecretKey;
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const stats = await response.json();
        
        document.getElementById('stat-count').textContent = stats.totalObjects;
        document.getElementById('stat-size').textContent = `${stats.totalSizeMB} MB`;
        
        if (stats.lastUpdated) {
            const date = new Date(stats.lastUpdated);
            document.getElementById('stat-updated').textContent = date.toLocaleString();
        } else {
            document.getElementById('stat-updated').textContent = 'No events yet';
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load events
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/api/objects`);
        const data = await response.json();
        
        const container = document.getElementById('events-container');
        
        if (data.objects.length === 0) {
            container.innerHTML = '<div class="empty-state">No events received yet. Configure Braze Currents to start receiving events.</div>';
            return;
        }
        
        container.innerHTML = data.objects.map(obj => {
            const date = new Date(obj.lastModified);
            const sizeKB = (obj.size / 1024).toFixed(2);
            
            return `
                <div class="event-card" onclick="viewEvent('${obj.name}')">
                    <div class="event-header">
                        <span class="event-name">${obj.name}</span>
                        <span class="event-date">${date.toLocaleString()}</span>
                    </div>
                    <div class="event-meta">
                        <span class="event-size">${sizeKB} KB</span>
                        <button class="btn-icon" onclick="event.stopPropagation(); deleteEvent('${obj.name}')" title="Delete">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load events:', error);
        document.getElementById('events-container').innerHTML = 
            '<div class="error-state">Failed to load events. Check console for details.</div>';
    }
}

// View event details
async function viewEvent(objectName) {
    try {
        currentEventName = objectName;
        const response = await fetch(`${API_BASE}/api/objects/${encodeURIComponent(objectName)}`);
        const data = await response.json();
        
        document.getElementById('modal-title').textContent = objectName;
        document.getElementById('modal-content').textContent = JSON.stringify(data.data, null, 2);
        
        const modal = document.getElementById('event-modal');
        modal.style.display = 'block';
    } catch (error) {
        alert(`Failed to load event: ${error.message}`);
    }
}

// Delete event
async function deleteEvent(objectName) {
    if (!confirm(`Are you sure you want to delete "${objectName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/objects/${encodeURIComponent(objectName)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadEvents();
            await loadStats();
        } else {
            const error = await response.json();
            alert(`Failed to delete: ${error.error}`);
        }
    } catch (error) {
        alert(`Failed to delete: ${error.message}`);
    }
}

// Close modal
function closeModal() {
    document.getElementById('event-modal').style.display = 'none';
    currentEventName = null;
}

// Download event
function downloadEvent() {
    if (!currentEventName) return;
    
    const content = document.getElementById('modal-content').textContent;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentEventName;
    a.click();
    URL.revokeObjectURL(url);
}

// Copy to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('event-modal');
    if (event.target === modal) {
        closeModal();
    }
}
