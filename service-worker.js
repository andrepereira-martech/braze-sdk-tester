// Braze Service Worker for Push Notifications
// This service worker must be placed in the root directory of your website
// and must be served with Content-Type: application/javascript

// Enhanced logging for debugging push notifications
console.log('[Service Worker] Service worker script loading...', {
    timestamp: new Date().toISOString(),
    scope: self.registration?.scope || 'unknown'
});

// Import Braze's service worker library
// Using the version from node_modules - adjust path if needed
// For production, you may want to use Braze CDN: https://js.appboycdn.com/web-sdk-develop/4.10/service-worker.js
self.importScripts('https://js.appboycdn.com/web-sdk-develop/4.10/service-worker.js');

console.log('[Service Worker] Braze service worker library loaded');

// Listen for push events and add detailed logging
// We'll intercept Braze notifications and display them with our own format
self.addEventListener('push', (event) => {
    const pushData = {
        timestamp: new Date().toISOString(),
        hasData: !!event.data,
        dataType: event.data?.type || 'unknown'
    };
    
    let notificationData = null;
    
    // Try to get data text (but don't block if it fails)
    try {
        if (event.data) {
            pushData.dataText = event.data.text();
            // Try to parse as JSON
            try {
                pushData.dataJson = JSON.parse(pushData.dataText);
                notificationData = pushData.dataJson;
            } catch (e) {
                // Not JSON, that's okay
            }
        }
    } catch (e) {
        pushData.dataText = 'Error reading data: ' + e.message;
    }
    
    console.log('[Service Worker] Push event received:', pushData);
    
    // Check notification permission status before Braze processes
    console.log('[Service Worker] Notification permission status:', Notification.permission);
    console.log('[Service Worker] Service worker registration active:', !!self.registration?.active);
    
    // Intercept Braze notifications and display with our own format (same as test notification)
    if (notificationData && Notification.permission === 'granted') {
        console.log('[Service Worker] Intercepting Braze notification and displaying with custom format');
        
        // Extract notification details from Braze payload
        const title = notificationData.t || notificationData.title || 'Notification';
        const body = notificationData.a || notificationData.alert || notificationData.body || '';
        const imageUrl = notificationData.img || notificationData.image || notificationData.i || null;
        const url = notificationData.u || notificationData.url || null;
        const campaignId = notificationData.cid || null;
        
        // Create notification options matching the test notification format
        const notificationOptions = {
            body: body,
            icon: imageUrl || '/favicon.ico',
            badge: '/favicon.ico',
            tag: `braze-notification-${Date.now()}`, // Unique tag to avoid suppression
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200],
            data: {
                url: url,
                campaignId: campaignId,
                timestamp: Date.now(),
                source: 'braze',
                originalData: notificationData
            },
            actions: url ? [
                {
                    action: 'view',
                    title: 'View'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ] : [
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };
        
        console.log('[Service Worker] Displaying notification with options:', {
            title: title,
            body: body,
            imageUrl: imageUrl,
            url: url
        });
        
        // Display the notification using the same format as test notification
        event.waitUntil(
            self.registration.showNotification(title, notificationOptions)
                .then(() => {
                    console.log('[Service Worker] Custom notification displayed successfully');
                })
                .catch((error) => {
                    console.error('[Service Worker] Failed to display custom notification:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    });
                    // Fallback: let Braze handle it
                    console.log('[Service Worker] Falling back to Braze default notification handling');
                })
        );
    } else {
        // If we can't intercept, let Braze handle it normally
        console.log('[Service Worker] Letting Braze handle notification (no data or permission not granted)');
        
        // Wait a bit and check if notification was actually shown
        setTimeout(() => {
            if (Notification.permission === 'granted') {
                console.log('[Service Worker] Notification permission is GRANTED - notifications should display');
            } else {
                console.warn('[Service Worker] Notification permission is NOT granted:', Notification.permission);
            }
        }, 1000);
        
        // Log any errors that might occur during push processing
        event.waitUntil(
            Promise.resolve().catch((error) => {
                console.error('[Service Worker] Error during push event processing:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
            })
        );
    }
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', {
        timestamp: new Date().toISOString(),
        notification: event.notification?.title || 'unknown',
        notificationBody: event.notification?.body || 'unknown',
        notificationData: event.notification?.data || {},
        action: event.action || 'default'
    });
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    const url = notificationData.url || '/';
    const action = event.action || 'default';
    
    // Handle different actions
    if (action === 'close') {
        console.log('[Service Worker] Notification closed by user');
        return;
    }
    
    // Open or focus the app, and navigate to URL if provided
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            console.log('[Service Worker] Found clients:', clientList.length);
            
            // Try to find and focus an existing client
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    console.log('[Service Worker] Focusing existing client and navigating to:', url);
                    // Navigate to the URL if it's different
                    if (url && url !== '/' && client.url !== url) {
                        return client.navigate(url).then(() => client.focus());
                    }
                    return client.focus();
                }
            }
            
            // If no client found, open a new window
            if (clients.openWindow && url) {
                console.log('[Service Worker] Opening new window with URL:', url);
                return clients.openWindow(url);
            } else if (clients.openWindow) {
                console.log('[Service Worker] Opening new window');
                return clients.openWindow('/');
            }
        }).catch((error) => {
            console.error('[Service Worker] Error handling notification click:', error);
        })
    );
});

// Listen for notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', {
        timestamp: new Date().toISOString(),
        notification: event.notification?.title || 'unknown'
    });
});

// Log service worker activation
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Service worker activated:', {
        timestamp: new Date().toISOString(),
        scope: self.registration?.scope || 'unknown'
    });
    
    // Check notification permission
    if ('Notification' in self) {
        console.log('[Service Worker] Notification API available');
        console.log('[Service Worker] Notification permission:', Notification.permission);
        
        // Test if we can actually show a notification (this helps debug)
        if (Notification.permission === 'granted') {
            console.log('[Service Worker] Permission is granted - notifications should work');
        } else if (Notification.permission === 'denied') {
            console.warn('[Service Worker] Permission is DENIED - notifications will NOT display');
        } else {
            console.warn('[Service Worker] Permission is DEFAULT - user needs to grant permission');
        }
    } else {
        console.warn('[Service Worker] Notification API not available');
    }
    
    // Take control of all pages immediately
    event.waitUntil(clients.claim().then(() => {
        console.log('[Service Worker] Service worker now controlling all clients');
    }));
});

// Log service worker installation
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Service worker installing:', {
        timestamp: new Date().toISOString()
    });
});
