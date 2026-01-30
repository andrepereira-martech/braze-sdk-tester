// Braze Web SDK Test Application
// Main application logic and Braze integration

import * as braze from "@braze/web-sdk";
import { BRAZE_API_KEY, BRAZE_SDK_ENDPOINT } from "./config.js";

// Global state
let isSDKReady = false;
let currentUserId = null;

// Check if valid config is available from environment
function hasValidEnvConfig() {
    return BRAZE_API_KEY && 
           BRAZE_API_KEY !== 'your-braze-api-key-here' &&
           BRAZE_SDK_ENDPOINT && 
           BRAZE_SDK_ENDPOINT.trim() !== '';
}

// DOM Elements (will be initialized on load)
let elements = {};

// Dashboard: show panel by id (config, user, events, etc.)
function showPanel(panelId) {
    const panel = document.getElementById('panel-' + panelId);
    const navLink = document.querySelector('.nav-link[data-panel="' + panelId + '"]');
    if (!panel || !navLink) return;
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
    panel.classList.add('active');
    navLink.classList.add('active');
    navLink.setAttribute('aria-current', 'page');
    document.querySelectorAll('.nav-link:not([data-panel="' + panelId + '"])').forEach((l) => l.removeAttribute('aria-current'));
    if (history.replaceState) {
        history.replaceState(null, '', '#' + panelId);
    }
}

// Initialize DOM element references
function initDOMElements() {
    elements = {
        // Configuration
        configForm: document.getElementById('config-form'),
        apiKeyInput: document.getElementById('api-key-input'),
        endpointInput: document.getElementById('endpoint-input'),
        initBtn: document.getElementById('init-btn'),
        initStatus: document.getElementById('init-status'),
        
        // User Management
        userIdInput: document.getElementById('user-id-input'),
        setUserBtn: document.getElementById('set-user-btn'),
        clearUserBtn: document.getElementById('clear-user-btn'),
        currentUserDisplay: document.getElementById('current-user-display'),
        
        // Custom Events
        eventNameInput: document.getElementById('event-name-input'),
        eventPropsInput: document.getElementById('event-props-input'),
        triggerEventBtn: document.getElementById('trigger-event-btn'),
        
        // Purchase Events
        purchaseForm: document.getElementById('purchase-form'),
        productIdInput: document.getElementById('product-id-input'),
        priceInput: document.getElementById('price-input'),
        currencyInput: document.getElementById('currency-input'),
        quantityInput: document.getElementById('quantity-input'),
        purchasePropsInput: document.getElementById('purchase-props-input'),
        
        // User Attributes
        attributeForm: document.getElementById('attribute-form'),
        attrKeyInput: document.getElementById('attr-key-input'),
        attrTypeSelect: document.getElementById('attr-type-select'),
        attrValueInput: document.getElementById('attr-value-input'),
        
        // Event Log
        eventLogContainer: document.getElementById('event-log-container'),
        clearLogsBtn: document.getElementById('clear-logs-btn'),
        
        // Push Notifications
        requestPushPermissionBtn: document.getElementById('request-push-permission-btn'),
        unregisterPushBtn: document.getElementById('unregister-push-btn'),
        testNotificationBtn: document.getElementById('test-notification-btn'),
        pushStatus: document.getElementById('push-status'),
        pushSupportInfo: document.getElementById('push-support-info'),
        
        // Content Cards
        contentCardsFeedContainer: document.getElementById('content-cards-feed-container'),
        showContentCardsBtn: document.getElementById('show-content-cards-btn'),
        hideContentCardsBtn: document.getElementById('hide-content-cards-btn'),
        toggleContentCardsBtn: document.getElementById('toggle-content-cards-btn'),
        refreshContentCardsBtn: document.getElementById('refresh-content-cards-btn'),
        contentCardsStatus: document.getElementById('content-cards-status'),
        
        // Standard Attributes Modal
        standardAttributesModal: document.getElementById('standard-attributes-modal'),
        setStandardAttributesBtn: document.getElementById('set-standard-attributes-btn'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        standardAttributesForm: document.getElementById('standard-attributes-form'),
        clearStandardAttributesBtn: document.getElementById('clear-standard-attributes-btn'),
        cancelStandardAttributesBtn: document.getElementById('cancel-standard-attributes-btn'),
        
        // Standard Attributes Inputs
        firstNameInput: document.getElementById('first-name-input'),
        lastNameInput: document.getElementById('last-name-input'),
        emailInput: document.getElementById('email-input'),
        countryInput: document.getElementById('country-input'),
        homeCityInput: document.getElementById('home-city-input'),
        dobYearInput: document.getElementById('dob-year-input'),
        dobMonthInput: document.getElementById('dob-month-input'),
        dobDayInput: document.getElementById('dob-day-input'),
        genderSelect: document.getElementById('gender-select'),
        languageInput: document.getElementById('language-input'),
        phoneInput: document.getElementById('phone-input'),

        // Feature Flags
        promoBanner: document.getElementById('promo-banner'),
        promoLink: document.getElementById('promo-link'),
        liveChatArea: document.getElementById('live-chat-area'),
        startLiveChatBtn: document.getElementById('start-live-chat-btn'),
        featureFlagsStatus: document.getElementById('feature-flags-status'),
        refreshFeatureFlagsBtn: document.getElementById('refresh-feature-flags-btn'),

        // Dashboard layout
        sidebarSdkStatus: document.getElementById('sidebar-sdk-status'),
        collapseLogBtn: document.getElementById('collapse-log-btn'),
        eventLogStrip: document.getElementById('event-log-strip')
    };
}

// Initialize Braze SDK
async function initializeBraze(apiKey, endpoint) {
    try {
        logToDisplay('system', { message: 'Initializing Braze SDK...' });
        updateInitStatus('Initializing...', 'info');
        setLoadingState(true);
        
        // Initialize the SDK
        const initialized = braze.initialize(apiKey, {
            baseUrl: endpoint,
            enableLogging: true,
            allowUserSuppliedJavascript: false,
            manageServiceWorkerExternally: true // Required for push notifications
        });
        
        if (!initialized) {
            throw new Error('SDK initialization returned false');
        }
        
        // Subscribe to in-app messages BEFORE openSession (required by Braze).
        // When a campaign is triggered (e.g. by a custom event), the message is displayed as a modal via showInAppMessage.
        subscribeToInAppMessages();

        // Subscribe to feature flag updates BEFORE openSession (required by Braze).
        subscribeToFeatureFlags();

        logToDisplay('system', { message: 'SDK initialized, opening session...' });
        
        // Open session immediately after initialization
        // Note: isSDKReady is still false here, but that's OK - we set it after session opens
        try {
            braze.openSession();
            logToDisplay('system', { message: 'Braze session opened successfully' });
            
            // Mark SDK as ready after successful session open
            isSDKReady = true;
            updateInitStatus('✓ Initialized and ready', 'success');
            setLoadingState(false);
            
            // Register service worker for push notifications
            registerServiceWorker();
            
            // Check push support and update UI
            checkPushSupport();
            
            // Subscribe to content cards updates (but don't request refresh yet if user is anonymous)
            // Content cards are typically only available for identified users
            subscribeToContentCards();

            // Apply initial feature flag state from cache
            applyFeatureFlagsState();
            
            // Flush initial data to ensure connection is working
            if (braze.requestImmediateDataFlush) {
                braze.requestImmediateDataFlush((success) => {
                    if (success) {
                        logToDisplay('system', { message: 'Initial data flush successful' });
                    } else {
                        logToDisplay('system', { message: 'Initial data flush queued (will retry)' });
                    }
                });
            }
            
            return true;
        } catch (sessionError) {
            // Session open failed, but SDK is initialized
            isSDKReady = true; // SDK is still usable even if session open had issues
            const errorMsg = `Session open warning: ${sessionError.message}`;
            logToDisplay('error', { message: errorMsg, error: sessionError });
            updateInitStatus('Initialized (session warning)', 'info');
            setLoadingState(false);
            console.warn('Session open warning:', sessionError);
            return true; // Still return true as SDK is initialized
        }
    } catch (error) {
        isSDKReady = false;
        setLoadingState(false);
        const errorMsg = `Failed to initialize Braze SDK: ${error.message}`;
        logToDisplay('error', { message: errorMsg, error });
        updateInitStatus(`✗ ${errorMsg}`, 'error');
        console.error('Braze initialization error:', error);
        return false;
    }
}

// Load configuration from localStorage
function loadConfigFromStorage() {
    try {
        const apiKey = localStorage.getItem('braze_api_key');
        const endpoint = localStorage.getItem('braze_endpoint');
        
        if (apiKey && endpoint) {
            return { apiKey, endpoint };
        }
        return null;
    } catch (error) {
        console.error('Error loading config from storage:', error);
        return null;
    }
}

// Save configuration to localStorage
function saveConfigToStorage(apiKey, endpoint) {
    try {
        if (apiKey && endpoint && typeof apiKey === 'string' && typeof endpoint === 'string') {
            localStorage.setItem('braze_api_key', apiKey);
            localStorage.setItem('braze_endpoint', endpoint);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving config to storage:', error);
        return false;
    }
}

// Validate configuration
function validateConfig(apiKey, endpoint) {
    // Input length limits
    const MAX_API_KEY_LENGTH = 200;
    const MAX_ENDPOINT_LENGTH = 500;
    
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        return { valid: false, error: 'API key is required' };
    }
    
    if (apiKey.length > MAX_API_KEY_LENGTH) {
        return { valid: false, error: `API key must be less than ${MAX_API_KEY_LENGTH} characters` };
    }
    
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
        return { valid: false, error: 'Endpoint is required' };
    }
    
    if (endpoint.length > MAX_ENDPOINT_LENGTH) {
        return { valid: false, error: `Endpoint must be less than ${MAX_ENDPOINT_LENGTH} characters` };
    }
    
    try {
        new URL(endpoint);
    } catch (error) {
        return { valid: false, error: 'Endpoint must be a valid URL' };
    }
    
    return { valid: true, error: null };
}

// Validate currency code (basic validation)
function validateCurrency(currency) {
    if (!currency || typeof currency !== 'string') {
        return { valid: false, error: 'Currency is required' };
    }
    
    const trimmed = currency.trim().toUpperCase();
    
    // Basic validation: 3 uppercase letters (ISO 4217 format)
    if (!/^[A-Z]{3}$/.test(trimmed)) {
        return { valid: false, error: 'Currency must be a 3-letter code (e.g., USD, EUR)' };
    }
    
    return { valid: true, error: null, value: trimmed };
}

// Update initialization status display
function updateInitStatus(message, type = 'info') {
    if (elements.initStatus) {
        elements.initStatus.textContent = message;
        elements.initStatus.className = `status-message status-${type}`;
        elements.initStatus.style.display = 'block';
        
        // Scroll status into view if it's an error or success
        if (type === 'error' || type === 'success') {
            setTimeout(() => {
                elements.initStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    updateSidebarStatus(message, type);
}

// Update sidebar SDK status (dashboard layout)
function updateSidebarStatus(message, type = 'info') {
    if (!elements.sidebarSdkStatus) return;
    const short = type === 'success' ? 'SDK: ready' : type === 'error' ? 'SDK: error' : message.includes('ready') ? 'SDK: ready' : message.includes('Initializ') ? 'SDK: initializing…' : 'SDK: not initialized';
    elements.sidebarSdkStatus.textContent = short;
    elements.sidebarSdkStatus.className = 'sidebar-status' + (type === 'success' || short === 'SDK: ready' ? ' ready' : type === 'error' ? ' error' : '');
}

// Set Braze user
function setBrazeUser(userId) {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return false;
    }
    
    try {
        if (userId && userId.trim() !== '') {
            braze.changeUser(userId.trim());
            currentUserId = userId.trim();
            logToDisplay('user', { action: 'set_user', userId: currentUserId });
            updateCurrentUserDisplay();
            
            // Request content cards refresh after user change
            // Content cards are typically sent to identified users
            setTimeout(() => {
                logToDisplay('system', { 
                    message: 'User changed, refreshing content cards...',
                    userId: currentUserId
                });
                refreshContentCards();
            }, 500);
            
            return true;
        } else {
            // Anonymous user - Braze handles this automatically
            currentUserId = null;
            logToDisplay('user', { action: 'clear_user' });
            updateCurrentUserDisplay();
            
            // Note: Content cards may not be available for anonymous users
            logToDisplay('system', { 
                message: 'User set to anonymous',
                note: 'Content cards are typically only available for identified users'
            });
            
            return true;
        }
    } catch (error) {
        const errorMsg = `Failed to set user: ${error.message}`;
        logToDisplay('error', { message: errorMsg, error });
        showError(errorMsg);
        console.error('Set user error:', error);
        return false;
    }
}

// Update current user display
function updateCurrentUserDisplay() {
    if (elements.currentUserDisplay) {
        const displayText = currentUserId 
            ? `Current User: ${currentUserId}` 
            : 'Current User: Anonymous';
        elements.currentUserDisplay.textContent = displayText;
    }
}

// Trigger predefined event
function triggerPredefinedEvent(eventName, properties = {}) {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return { success: false, error: 'SDK not initialized' };
    }
    
    try {
        // Log the predefined event
        const result = triggerCustomEvent(eventName, properties);
        
        if (result.success) {
            logToDisplay('system', { 
                message: `Predefined event "${eventName}" triggered successfully`,
                properties: properties
            });
        }
        
        return result;
    } catch (error) {
        const errorMsg = `Failed to trigger predefined event "${eventName}": ${error.message}`;
        console.error('Predefined event error:', error);
        logToDisplay('error', { 
            message: errorMsg, 
            error: error.toString(), 
            stack: error.stack 
        });
        showError(errorMsg);
        return { success: false, error: errorMsg };
    }
}

// Trigger custom event
function triggerCustomEvent(eventName, properties) {
    console.log('triggerCustomEvent called', { eventName, properties, isSDKReady });
    
    if (!isSDKReady) {
        const error = 'SDK not initialized. Please configure and initialize first.';
        console.error('SDK not ready:', error);
        showError(error);
        return { success: false, error };
    }
    
    if (!eventName || typeof eventName !== 'string' || eventName.trim() === '') {
        const error = 'Event name is required';
        console.error('Validation error:', error);
        showError(error);
        return { success: false, error };
    }
    
    if (eventName.length > 100) {
        const error = 'Event name must be less than 100 characters';
        console.error('Validation error:', error);
        showError(error);
        return { success: false, error };
    }
    
    try {
        let eventProperties = {};
        
        if (properties) {
            if (typeof properties === 'string') {
                if (properties.trim() === '') {
                    eventProperties = {};
                } else {
                    try {
                        eventProperties = JSON.parse(properties);
                        if (typeof eventProperties !== 'object' || Array.isArray(eventProperties)) {
                            const error = 'Event properties must be a JSON object';
                            console.error('Validation error:', error);
                            showError(error);
                            return { success: false, error };
                        }
                    } catch (parseError) {
                        const error = 'Invalid JSON in event properties: ' + parseError.message;
                        console.error('JSON parse error:', parseError);
                        showError(error);
                        return { success: false, error };
                    }
                }
            } else if (typeof properties === 'object') {
                eventProperties = properties;
            }
        }
        
        console.log('Calling braze.logCustomEvent', { eventName: eventName.trim(), eventProperties });
        const logged = braze.logCustomEvent(eventName.trim(), eventProperties);
        console.log('braze.logCustomEvent returned:', logged);
        
        logToDisplay('event', { 
            type: 'custom_event', 
            eventName: eventName.trim(), 
            properties: eventProperties 
        });
        
        // Flush event immediately to Braze
        console.log('Checking for requestImmediateDataFlush:', typeof braze.requestImmediateDataFlush);
        if (braze.requestImmediateDataFlush) {
            console.log('Calling requestImmediateDataFlush');
            braze.requestImmediateDataFlush((success) => {
                console.log('Flush callback:', success);
                if (success) {
                    logToDisplay('system', { message: `✓ Event "${eventName.trim()}" flushed to Braze successfully` });
                } else {
                    logToDisplay('system', { message: `⚠ Event "${eventName.trim()}" queued (will retry automatically)` });
                }
            });
        } else {
            console.warn('requestImmediateDataFlush not available');
            logToDisplay('system', { message: `Event "${eventName.trim()}" logged (will flush automatically)` });
        }
        
        return { success: true };
    } catch (error) {
        const errorMsg = `Failed to log custom event: ${error.message}`;
        console.error('Custom event error:', error);
        logToDisplay('error', { message: errorMsg, error: error.toString(), stack: error.stack });
        showError(errorMsg);
        return { success: false, error: errorMsg };
    }
}

// Log purchase event
function logPurchaseEvent(productId, price, currency, quantity, properties) {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return { success: false, error: 'SDK not initialized' };
    }
    
    // Validation
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        showError('Product ID is required');
        return { success: false, error: 'Product ID is required' };
    }
    
    if (productId.length > 200) {
        showError('Product ID must be less than 200 characters');
        return { success: false, error: 'Product ID too long' };
    }
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
        showError('Price must be a positive number');
        return { success: false, error: 'Invalid price' };
    }
    
    const currencyValidation = validateCurrency(currency);
    if (!currencyValidation.valid) {
        showError(currencyValidation.error);
        return { success: false, error: currencyValidation.error };
    }
    
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
        showError('Quantity must be at least 1');
        return { success: false, error: 'Invalid quantity' };
    }
    
    try {
        let purchaseProperties = {};
        
        if (properties) {
            if (typeof properties === 'string') {
                if (properties.trim() === '') {
                    purchaseProperties = {};
                } else {
                    try {
                        purchaseProperties = JSON.parse(properties);
                        if (typeof purchaseProperties !== 'object' || Array.isArray(purchaseProperties)) {
                            showError('Purchase properties must be a JSON object');
                            return { success: false, error: 'Invalid properties format' };
                        }
                    } catch (parseError) {
                        showError('Invalid JSON in purchase properties: ' + parseError.message);
                        return { success: false, error: 'Invalid JSON' };
                    }
                }
            } else if (typeof properties === 'object') {
                purchaseProperties = properties;
            }
        }
        
        braze.logPurchase(productId.trim(), priceNum, currencyValidation.value, quantityNum, purchaseProperties);
        logToDisplay('event', { 
            type: 'purchase', 
            productId: productId.trim(), 
            price: priceNum, 
            currency: currencyValidation.value, 
            quantity: quantityNum,
            properties: purchaseProperties 
        });
        
        // Flush purchase event immediately to Braze
        if (braze.requestImmediateDataFlush) {
            braze.requestImmediateDataFlush((success) => {
                if (success) {
                    logToDisplay('system', { message: `Purchase event for "${productId.trim()}" flushed to Braze` });
                } else {
                    logToDisplay('system', { message: `Purchase event for "${productId.trim()}" queued (will retry)` });
                }
            });
        }
        
        return { success: true };
    } catch (error) {
        const errorMsg = `Failed to log purchase: ${error.message}`;
        logToDisplay('error', { message: errorMsg, error });
        showError(errorMsg);
        console.error('Purchase event error:', error);
        return { success: false, error: errorMsg };
    }
}

// Set user attribute
function setUserAttribute(key, value, type) {
    console.log('setUserAttribute called', { key, value, type, isSDKReady });
    
    if (!isSDKReady) {
        const error = 'SDK not initialized. Please configure and initialize first.';
        console.error('SDK not ready:', error);
        showError(error);
        return false;
    }
    
    if (!key || typeof key !== 'string' || key.trim() === '') {
        const error = 'Attribute key is required';
        console.error('Validation error:', error);
        showError(error);
        return false;
    }
    
    try {
        let convertedValue;
        
        switch (type) {
            case 'number':
                convertedValue = parseFloat(value);
                if (isNaN(convertedValue)) {
                    const error = 'Invalid number value';
                    console.error('Validation error:', error);
                    showError(error);
                    return false;
                }
                break;
            case 'boolean':
                const lowerValue = String(value).toLowerCase();
                convertedValue = lowerValue === 'true' || lowerValue === '1';
                break;
            case 'array':
                try {
                    convertedValue = JSON.parse(value);
                    if (!Array.isArray(convertedValue)) {
                        const error = 'Value must be a valid JSON array';
                        console.error('Validation error:', error);
                        showError(error);
                        return false;
                    }
                } catch (parseError) {
                    const error = 'Invalid JSON array format';
                    console.error('JSON parse error:', parseError);
                    showError(error);
                    return false;
                }
                break;
            case 'string':
            default:
                convertedValue = String(value);
                break;
        }
        
        const user = braze.getUser();
        if (!user) {
            const error = 'Unable to get user object from Braze SDK';
            console.error('Error:', error);
            showError(error);
            return false;
        }
        
        console.log('Calling user.setCustomUserAttribute', { key: key.trim(), value: convertedValue });
        const result = user.setCustomUserAttribute(key.trim(), convertedValue);
        console.log('user.setCustomUserAttribute completed, result:', result);
        
        if (!result) {
            const error = 'Failed to set custom user attribute (returned false)';
            console.error('Error:', error);
            showError(error);
            return false;
        }
        
        logToDisplay('attribute', { 
            key: key.trim(), 
            value: convertedValue, 
            type 
        });
        
        // Flush attribute update immediately to Braze
        console.log('Checking for requestImmediateDataFlush:', typeof braze.requestImmediateDataFlush);
        if (braze.requestImmediateDataFlush) {
            console.log('Calling requestImmediateDataFlush for attribute');
            braze.requestImmediateDataFlush((success) => {
                console.log('Attribute flush callback:', success);
                if (success) {
                    logToDisplay('system', { message: `✓ Attribute "${key.trim()}" flushed to Braze successfully` });
                } else {
                    logToDisplay('system', { message: `⚠ Attribute "${key.trim()}" queued (will retry automatically)` });
                }
            });
        } else {
            console.warn('requestImmediateDataFlush not available');
            logToDisplay('system', { message: `Attribute "${key.trim()}" logged (will flush automatically)` });
        }
        
        return true;
    } catch (error) {
        const errorMsg = `Failed to set user attribute: ${error.message}`;
        console.error('Set attribute error:', error);
        logToDisplay('error', { message: errorMsg, error: error.toString(), stack: error.stack });
        showError(errorMsg);
        return false;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate email format
function validateEmail(email) {
    if (!email || email.trim() === '') return { valid: true, value: null }; // Empty is valid (will clear attribute)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        valid: emailRegex.test(email.trim()),
        value: email.trim(),
        error: emailRegex.test(email.trim()) ? null : 'Invalid email format'
    };
}

// Validate phone number (E.164 format: +[country code][number])
function validatePhone(phone) {
    if (!phone || phone.trim() === '') return { valid: true, value: null }; // Empty is valid
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return {
        valid: phoneRegex.test(phone.trim()),
        value: phone.trim(),
        error: phoneRegex.test(phone.trim()) ? null : 'Phone must be in E.164 format: +[country code][number] (e.g., +14155551234)'
    };
}

// Validate language code (ISO-639-1: 2 lowercase letters)
function validateLanguage(language) {
    if (!language || language.trim() === '') return { valid: true, value: null }; // Empty is valid
    const langRegex = /^[a-z]{2}$/;
    return {
        valid: langRegex.test(language.trim().toLowerCase()),
        value: language.trim().toLowerCase(),
        error: langRegex.test(language.trim().toLowerCase()) ? null : 'Language must be a 2-letter ISO-639-1 code (e.g., en, es, fr)'
    };
}

// Validate date of birth
function validateDateOfBirth(year, month, day) {
    // All empty is valid (will clear attribute)
    if ((!year || year === '') && (!month || month === '') && (!day || day === '')) {
        return { valid: true, year: null, month: null, day: null };
    }
    
    // If any is provided, all must be provided
    if (!year || year === '' || !month || month === '' || !day || day === '') {
        return { valid: false, error: 'All date fields (year, month, day) must be provided' };
    }
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return { valid: false, error: 'Year must be between 1900 and 2100' };
    }
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return { valid: false, error: 'Month must be between 1 and 12' };
    }
    
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        return { valid: false, error: 'Day must be between 1 and 31' };
    }
    
    // Check if date is valid (e.g., not Feb 30)
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getFullYear() !== yearNum || date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
        return { valid: false, error: 'Invalid date' };
    }
    
    return { valid: true, year: yearNum, month: monthNum, day: dayNum };
}

// Open standard attributes modal
function openStandardAttributesModal() {
    if (elements.standardAttributesModal) {
        elements.standardAttributesModal.classList.add('show');
        elements.standardAttributesModal.setAttribute('aria-hidden', 'false');
        // Focus first input
        if (elements.firstNameInput) {
            setTimeout(() => elements.firstNameInput.focus(), 100);
        }
    }
}

// Close standard attributes modal
function closeStandardAttributesModal() {
    if (elements.standardAttributesModal) {
        elements.standardAttributesModal.classList.remove('show');
        elements.standardAttributesModal.setAttribute('aria-hidden', 'true');
    }
}

// Subscribe to in-app messages from Braze (triggered by custom events / campaigns).
// Messages are displayed as modals via showInAppMessage. Must be called before openSession.
function subscribeToInAppMessages() {
    if (typeof braze.subscribeToInAppMessage !== 'function') {
        logToDisplay('system', { message: 'In-app messages: subscribeToInAppMessage not available in this SDK build' });
        return;
    }
    const subscriptionId = braze.subscribeToInAppMessage((inAppMessage) => {
        const messageType = inAppMessage?.constructor?.name || 'InAppMessage';
        const header = (inAppMessage && 'header' in inAppMessage) ? inAppMessage.header : '';
        const message = (inAppMessage && 'message' in inAppMessage) ? inAppMessage.message : '';
        logToDisplay('system', {
            message: 'In-app message received from Braze',
            details: {
                type: messageType,
                header: header || '(no header)',
                body: message ? message.substring(0, 80) + (message.length > 80 ? '…' : '') : '(no body)',
                triggerId: inAppMessage?.triggerId
            }
        });
        if (typeof braze.showInAppMessage === 'function') {
            const shown = braze.showInAppMessage(inAppMessage, null, () => {
                logToDisplay('system', { message: 'In-app message displayed (modal)' });
            });
            if (!shown) {
                logToDisplay('error', { message: 'In-app message could not be displayed' });
            }
        } else {
            logToDisplay('error', { message: 'showInAppMessage not available in this SDK build' });
        }
    });
    if (subscriptionId) {
        logToDisplay('system', { message: 'In-app messages: subscribed (modal display on custom event / campaign)' });
    }
}

// Feature flag IDs used in this app (must match Braze dashboard)
const FEATURE_FLAG_IDS = {
    NAVIGATION_PROMO_LINK: 'navigation_promo_link',
    ENABLE_LIVE_CHAT: 'enable_live_chat'
};

// Subscribe to feature flag updates. Must be called before openSession.
function subscribeToFeatureFlags() {
    if (typeof braze.subscribeToFeatureFlagsUpdates !== 'function') {
        logToDisplay('system', { message: 'Feature flags: subscribeToFeatureFlagsUpdates not available in this SDK build' });
        return;
    }
    const subscriptionId = braze.subscribeToFeatureFlagsUpdates(() => {
        applyFeatureFlagsState();
    });
    if (subscriptionId) {
        logToDisplay('system', { message: 'Feature flags: subscribed to updates' });
    }
}

// Read feature flags from Braze and update the UI (promo link, live chat).
function applyFeatureFlagsState() {
    if (!isSDKReady || typeof braze.getFeatureFlag !== 'function') {
        return;
    }

    const statusParts = [];

    // 1. Navigation promo link (remotely control link text and URL)
    const promoFlag = braze.getFeatureFlag(FEATURE_FLAG_IDS.NAVIGATION_PROMO_LINK);
    if (elements.promoBanner && elements.promoLink) {
        const promoEnabled = promoFlag && promoFlag.enabled;
        const promoText = promoFlag ? (promoFlag.getStringProperty('text') || 'Promo') : '';
        const promoUrl = promoFlag ? (promoFlag.getStringProperty('link') || '#') : '#';

        if (promoEnabled && promoText && promoUrl) {
            elements.promoLink.textContent = promoText;
            elements.promoLink.href = promoUrl;
            elements.promoBanner.style.display = '';
            statusParts.push(`Promo: "${promoText}" → ${promoUrl}`);
            if (typeof braze.logFeatureFlagImpression === 'function') {
                braze.logFeatureFlagImpression(FEATURE_FLAG_IDS.NAVIGATION_PROMO_LINK);
            }
        } else {
            elements.promoBanner.style.display = 'none';
            if (!promoEnabled) statusParts.push('Promo: off');
            else statusParts.push('Promo: on but missing text/link');
        }
    }

    // 2. Live chat (on/off for gradual rollout)
    const liveChatFlag = braze.getFeatureFlag(FEATURE_FLAG_IDS.ENABLE_LIVE_CHAT);
    if (elements.liveChatArea) {
        const liveChatEnabled = liveChatFlag && liveChatFlag.enabled;
        if (liveChatEnabled) {
            elements.liveChatArea.style.display = '';
            statusParts.push('Live Chat: on');
            if (typeof braze.logFeatureFlagImpression === 'function') {
                braze.logFeatureFlagImpression(FEATURE_FLAG_IDS.ENABLE_LIVE_CHAT);
            }
        } else {
            elements.liveChatArea.style.display = 'none';
            statusParts.push('Live Chat: off');
        }
    }

    if (elements.featureFlagsStatus) {
        elements.featureFlagsStatus.textContent = statusParts.length
            ? statusParts.join(' | ')
            : 'No feature flags received yet. Create flags in Braze and refresh.';
    }

    logToDisplay('system', {
        message: 'Feature flags applied',
        navigation_promo_link: promoFlag ? { enabled: promoFlag.enabled, text: promoFlag.getStringProperty?.('text'), link: promoFlag.getStringProperty?.('link') } : null,
        enable_live_chat: liveChatFlag ? { enabled: liveChatFlag.enabled } : null
    });
}

// Request feature flags refresh from Braze (e.g. after changing flags in dashboard).
function refreshFeatureFlags() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    if (typeof braze.refreshFeatureFlags !== 'function') {
        logToDisplay('system', { message: 'refreshFeatureFlags not available in this SDK build' });
        return;
    }
    logToDisplay('system', { message: 'Refreshing feature flags from Braze...' });
    braze.refreshFeatureFlags(
        () => {
            try {
                applyFeatureFlagsState();
                logToDisplay('system', { message: 'Feature flags refreshed successfully' });
            } catch (err) {
                console.error('Feature flags apply error:', err);
                logToDisplay('error', {
                    message: 'Feature flags apply failed after refresh',
                    error: err && err.message ? err.message : String(err)
                });
            }
        },
        (err) => {
            // Braze may call this on rate limit, network failure, or when feature flags aren't enabled for the workspace.
            // Still apply cached state so the UI reflects what we have.
            applyFeatureFlagsState();
            const detail = err && (err.message || err.reason || err.code) ? String(err.message || err.reason || err.code) : '';
            logToDisplay('system', {
                message: 'Feature flags server refresh failed; showing cached values.',
                hint: 'This can happen if refresh is rate-limited, the request failed, or feature flags are not enabled for your Braze workspace.',
                detail: detail || undefined
            });
        }
    );
}

// Handle content cards updates (for status/logging only, Braze UI handles rendering)
function handleContentCardsUpdate(contentCards) {
    console.log('Content cards update received:', {
        hasContentCards: !!contentCards,
        cardsCount: contentCards?.cards?.length || 0,
        lastUpdated: contentCards?.lastUpdated,
        allCards: contentCards?.cards
    });
    
    // Check if lastUpdated is the epoch date (indicates empty/initialized state)
    const isEpochDate = contentCards?.lastUpdated && 
        contentCards.lastUpdated.getTime() === new Date(0).getTime();
    
    if (!contentCards || !contentCards.cards || contentCards.cards.length === 0 || isEpochDate) {
        const user = braze.getUser();
        const userId = user ? user.getUserId() : null;
        
        logToDisplay('system', { 
            message: 'Content cards update received: 0 card(s)',
            details: {
                lastUpdated: contentCards?.lastUpdated ? contentCards.lastUpdated.toISOString() : null,
                userId: userId || 'anonymous',
                note: userId ? 'User is identified but no cards available' : 'User is anonymous - cards may not be available'
            }
        });
        
        updateContentCardsStatus(
            userId 
                ? 'No cards available for this user' 
                : 'No cards available (user is anonymous)',
            'info'
        );
        return;
    }
    
    // Filter out control cards for count
    const displayableCards = contentCards.cards.filter(card => !card.isControl);
    
    // Update status
    const unviewedCount = contentCards.getUnviewedCardCount ? contentCards.getUnviewedCardCount() : 0;
    updateContentCardsStatus(
        `${displayableCards.length} card(s) available${unviewedCount > 0 ? `, ${unviewedCount} unviewed` : ''}`,
        'success'
    );
    
    logToDisplay('system', { 
        message: `Content cards update: ${displayableCards.length} displayable card(s) available`,
        lastUpdated: contentCards.lastUpdated ? contentCards.lastUpdated.toISOString() : null,
        cardIds: displayableCards.map(c => c.id)
    });
}

// Show content cards feed using Braze's built-in UI
function showContentCardsFeed() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    
    try {
        const container = elements.contentCardsFeedContainer;
        if (container) {
            braze.showContentCards(container);
            logToDisplay('system', { message: 'Content cards feed shown in container' });
            updateContentCardsStatus('Cards feed displayed', 'success');
        } else {
            // No container specified - will show as fixed sidebar
            braze.showContentCards();
            logToDisplay('system', { message: 'Content cards feed shown as fixed sidebar' });
            updateContentCardsStatus('Cards feed displayed (fixed sidebar)', 'success');
        }
    } catch (error) {
        console.error('Error showing content cards:', error);
        logToDisplay('error', { message: `Failed to show content cards: ${error.message}`, error });
        updateContentCardsStatus('Failed to show feed', 'error');
    }
}

// Hide content cards feed
function hideContentCardsFeed() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    
    try {
        braze.hideContentCards();
        logToDisplay('system', { message: 'Content cards feed hidden' });
        updateContentCardsStatus('Cards feed hidden', 'info');
    } catch (error) {
        console.error('Error hiding content cards:', error);
        logToDisplay('error', { message: `Failed to hide content cards: ${error.message}`, error });
    }
}

// Toggle content cards feed
function toggleContentCardsFeed() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    
    try {
        const container = elements.contentCardsFeedContainer;
        if (container) {
            braze.toggleContentCards(container);
            logToDisplay('system', { message: 'Content cards feed toggled in container' });
        } else {
            braze.toggleContentCards();
            logToDisplay('system', { message: 'Content cards feed toggled (fixed sidebar)' });
        }
    } catch (error) {
        console.error('Error toggling content cards:', error);
        logToDisplay('error', { message: `Failed to toggle content cards: ${error.message}`, error });
    }
}

// Update content cards status message
function updateContentCardsStatus(message, type = 'info') {
    if (elements.contentCardsStatus) {
        elements.contentCardsStatus.textContent = message;
        elements.contentCardsStatus.className = `status-message status-${type}`;
    }
}

// Register service worker for push notifications
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js', {
                scope: './'
            });
            
            console.log('[Push Debug] Service Worker registered:', {
                scope: registration.scope,
                active: !!registration.active,
                installing: !!registration.installing,
                waiting: !!registration.waiting
            });
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('[Push Debug] Service worker is ready');
            
            // Check if service worker is actually active
            if (registration.active) {
                console.log('[Push Debug] Service worker is active:', {
                    scriptURL: registration.active.scriptURL,
                    state: registration.active.state
                });
            }
            
            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
                console.log('[Push Debug] Service worker update found');
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        console.log('[Push Debug] New service worker state:', newWorker.state);
                    });
                }
            });
            
            logToDisplay('system', { 
                message: 'Service worker registered successfully',
                scope: registration.scope,
                active: !!registration.active
            });
            return registration;
        } catch (error) {
            console.error('[Push Debug] Service Worker registration failed:', error);
            logToDisplay('error', { 
                message: `Service worker registration failed: ${error.message}`,
                error: error.toString(),
                stack: error.stack
            });
            updatePushStatus('Service worker registration failed', 'error');
            return null;
        }
    } else {
        console.warn('[Push Debug] Service Workers are not supported in this browser');
        logToDisplay('system', { message: 'Service Workers not supported - push notifications unavailable' });
        updatePushStatus('Service Workers not supported', 'warning');
        return null;
    }
}

// Check if push notifications are supported
async function checkPushSupport() {
    if (!isSDKReady) {
        return;
    }
    
    try {
        const isSupported = braze.isPushSupported();
        const isPermissionGranted = braze.isPushPermissionGranted();
        
        // Check browser Notification API permission directly
        let browserPermission = 'unknown';
        let serviceWorkerReady = false;
        let serviceWorkerRegistration = null;
        
        if ('Notification' in window) {
            browserPermission = Notification.permission;
        }
        
        // Check service worker registration
        if ('serviceWorker' in navigator) {
            try {
                serviceWorkerRegistration = await navigator.serviceWorker.ready;
                serviceWorkerReady = !!serviceWorkerRegistration;
            } catch (swError) {
                console.warn('Service worker not ready:', swError);
            }
        }
        
        const supportInfo = {
            isSupported: isSupported,
            isPermissionGranted: isPermissionGranted,
            browserPermission: browserPermission,
            serviceWorkerReady: serviceWorkerReady,
            serviceWorkerActive: !!serviceWorkerRegistration?.active,
            timestamp: new Date().toISOString()
        };
        
        console.log('[Push Debug] Push support check:', supportInfo);
        logToDisplay('system', { 
            message: 'Push support status checked',
            details: supportInfo
        });
        
        if (elements.pushSupportInfo) {
            let statusHtml = '';
            
            if (isSupported === false) {
                statusHtml = `
                    <span style="color: #dc3545;">⚠️ Push notifications are not supported in this browser.</span>
                `;
            } else if (isSupported === true) {
                if (isPermissionGranted === true) {
                    statusHtml = `
                        <span style="color: #28a745;">✓ Push notifications are supported and permission is granted.</span><br>
                        <small style="color: #666;">Browser permission: ${browserPermission} | Service Worker: ${serviceWorkerReady ? 'Ready' : 'Not Ready'}</small>
                    `;
                    updatePushStatus('Push permission granted', 'success');
                } else if (isPermissionGranted === false) {
                    statusHtml = `
                        <span style="color: #ffc107;">⚠️ Push notifications are supported but permission is not granted.</span><br>
                        <small style="color: #666;">Browser permission: ${browserPermission}</small>
                    `;
                    updatePushStatus('Push permission not granted', 'warning');
                } else {
                    statusHtml = `
                        <span style="color: #0066cc;">ℹ️ Push notifications are supported. Click "Request Push Permission" to enable.</span><br>
                        <small style="color: #666;">Browser permission: ${browserPermission} | Service Worker: ${serviceWorkerReady ? 'Ready' : 'Not Ready'}</small>
                    `;
                    updatePushStatus('Ready to request push permission', 'info');
                }
            } else {
                statusHtml = `
                    <span style="color: #666;">Checking push support...</span>
                `;
            }
            
            elements.pushSupportInfo.innerHTML = statusHtml;
        }
        
        // Update button states
        if (elements.requestPushPermissionBtn) {
            elements.requestPushPermissionBtn.disabled = !isSDKReady || isSupported === false || isPermissionGranted === true;
        }
        if (elements.unregisterPushBtn) {
            elements.unregisterPushBtn.disabled = !isSDKReady || isSupported === false || isPermissionGranted !== true;
        }
        if (elements.testNotificationBtn) {
            elements.testNotificationBtn.disabled = !isSDKReady || !serviceWorkerReady || browserPermission !== 'granted';
        }
    } catch (error) {
        console.error('[Push Debug] Error checking push support:', error);
        logToDisplay('error', { 
            message: `Failed to check push support: ${error.message}`, 
            error: error.toString(),
            stack: error.stack
        });
    }
}

// Update push status message
function updatePushStatus(message, type = 'info') {
    if (elements.pushStatus) {
        elements.pushStatus.textContent = message;
        elements.pushStatus.className = `status-message status-${type}`;
    }
}

// Request push permission
function requestPushPermission() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    
    const isSupported = braze.isPushSupported();
    if (isSupported === false) {
        showError('Push notifications are not supported in this browser.');
        return;
    }
    
    if (isSupported === true && braze.isPushPermissionGranted() === true) {
        showError('Push permission is already granted.');
        return;
    }
    
    updatePushStatus('Requesting push permission...', 'info');
    logToDisplay('system', { message: 'Requesting push notification permission...' });
    
    try {
        braze.requestPushPermission(
            (endpoint, publicKey, userAuth) => {
                // Success callback
                console.log('Push permission granted:', { endpoint, publicKey, userAuth });
                logToDisplay('system', { 
                    message: 'Push notification permission granted successfully',
                    details: {
                        endpoint: endpoint.substring(0, 50) + '...',
                        publicKey: publicKey.substring(0, 20) + '...'
                    }
                });
                updatePushStatus('✓ Push permission granted', 'success');
                checkPushSupport(); // Refresh UI
                
                // Flush the registration
                if (braze.requestImmediateDataFlush) {
                    braze.requestImmediateDataFlush((success) => {
                        if (success) {
                            logToDisplay('system', { message: 'Push registration flushed to Braze' });
                        }
                    });
                }
            },
            (temporaryDenial) => {
                // Denied callback
                const denialType = temporaryDenial ? 'temporarily dismissed' : 'permanently denied';
                console.log('Push permission denied:', denialType);
                logToDisplay('system', { 
                    message: `Push notification permission ${denialType}`,
                    note: temporaryDenial 
                        ? 'User can be prompted again later' 
                        : 'User has permanently denied permission'
                });
                updatePushStatus(
                    temporaryDenial 
                        ? 'Permission temporarily dismissed' 
                        : 'Permission permanently denied',
                    temporaryDenial ? 'warning' : 'error'
                );
                checkPushSupport(); // Refresh UI
            }
        );
    } catch (error) {
        console.error('Error requesting push permission:', error);
        logToDisplay('error', { 
            message: `Failed to request push permission: ${error.message}`,
            error: error.toString(),
            stack: error.stack
        });
        updatePushStatus('Failed to request permission', 'error');
    }
}

// Unregister push notifications
function unregisterPush() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    
    const isSupported = braze.isPushSupported();
    if (isSupported === false) {
        showError('Push notifications are not supported in this browser.');
        return;
    }
    
    if (braze.isPushPermissionGranted() !== true) {
        showError('Push permission is not granted.');
        return;
    }
    
    if (!confirm('Are you sure you want to unregister from push notifications? This will stop all push notifications for this browser.')) {
        return;
    }
    
    updatePushStatus('Unregistering push...', 'info');
    logToDisplay('system', { message: 'Unregistering push notifications...' });
    
    try {
        braze.unregisterPush(
            () => {
                // Success callback
                console.log('Push unregistered successfully');
                logToDisplay('system', { message: 'Push notifications unregistered successfully' });
                updatePushStatus('Push notifications unregistered', 'info');
                checkPushSupport(); // Refresh UI
            },
            () => {
                // Error callback
                console.error('Failed to unregister push');
                logToDisplay('error', { message: 'Failed to unregister push notifications' });
                updatePushStatus('Failed to unregister', 'error');
            }
        );
    } catch (error) {
        console.error('Error unregistering push:', error);
        logToDisplay('error', { 
            message: `Failed to unregister push: ${error.message}`,
            error: error.toString()
        });
        updatePushStatus('Failed to unregister', 'error');
    }
}

// Test notification display (bypasses Braze, tests service worker directly)
async function testNotification() {
    console.log('[Push Debug] Testing notification display...');
    
    if (!('serviceWorker' in navigator)) {
        showError('Service Workers are not supported in this browser.');
        return;
    }
    
    if (!('Notification' in window)) {
        showError('Notifications are not supported in this browser.');
        return;
    }
    
    const permission = Notification.permission;
    console.log('[Push Debug] Notification permission:', permission);
    
    if (permission !== 'granted') {
        showError(`Notification permission is "${permission}". Please grant permission first.`);
        return;
    }
    
    try {
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push Debug] Service worker ready:', {
            active: !!registration.active,
            scope: registration.scope,
            state: registration.active?.state
        });
        
        if (!registration.active) {
            showError('Service worker is not active. Please refresh the page.');
            return;
        }
        
        // Check if service worker can actually show notifications
        console.log('[Push Debug] Checking if service worker can show notifications...');
        
        updatePushStatus('Displaying test notification...', 'info');
        logToDisplay('system', { 
            message: 'Testing notification display via service worker',
            details: {
                permission: permission,
                serviceWorkerActive: !!registration.active,
                serviceWorkerState: registration.active?.state,
                timestamp: new Date().toISOString()
            }
        });
        
        const notificationOptions = {
            body: 'This is a test notification from the service worker. If you see this, notifications are working!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'test-notification-' + Date.now(), // Unique tag to avoid suppression
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200],
            data: {
                url: window.location.href,
                timestamp: Date.now(),
                test: true
            },
            actions: [
                {
                    action: 'view',
                    title: 'View'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };
        
        console.log('[Push Debug] Calling showNotification with options:', notificationOptions);
        
        // Show notification and wait for it
        await registration.showNotification('Test Notification', notificationOptions);
        
        console.log('[Push Debug] Notification shown successfully - check your browser notifications');
        logToDisplay('system', { 
            message: 'Test notification displayed successfully - check browser notification area',
            details: {
                title: 'Test Notification',
                timestamp: new Date().toISOString(),
                note: 'If you don\'t see the notification, check browser notification settings (Do Not Disturb, Focus mode, etc.)'
            }
        });
        updatePushStatus('✓ Test notification sent - check browser notifications', 'success');
        
        // Check if notification was actually displayed after a short delay
        setTimeout(() => {
            console.log('[Push Debug] Notification should be visible now. If not, check:');
            console.log('[Push Debug] 1. Browser notification settings');
            console.log('[Push Debug] 2. Do Not Disturb / Focus mode');
            console.log('[Push Debug] 3. Browser notification center');
            console.log('[Push Debug] 4. System notification settings');
        }, 1000);
        
    } catch (error) {
        console.error('[Push Debug] Failed to show test notification:', error);
        console.error('[Push Debug] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            permission: Notification.permission
        });
        
        logToDisplay('error', { 
            message: `Failed to display test notification: ${error.message}`,
            error: error.toString(),
            stack: error.stack,
            details: {
                name: error.name,
                permission: Notification.permission,
                serviceWorkerReady: 'serviceWorker' in navigator
            }
        });
        updatePushStatus('Failed to display test notification', 'error');
        
        // Provide helpful error messages
        if (error.name === 'TypeError' && error.message.includes('showNotification')) {
            showError('Service worker cannot display notifications. Check browser notification settings and ensure permission is granted.');
        } else if (error.name === 'NotAllowedError') {
            showError('Notification permission denied. Please grant notification permission in browser settings.');
        } else {
            showError(`Error: ${error.message}`);
        }
    }
}

// Subscribe to content card updates
function subscribeToContentCards() {
    if (!isSDKReady) {
        console.warn('Cannot subscribe to content cards: SDK not ready');
        return;
    }
    
    try {
        console.log('Setting up content cards subscription...');
        const subscriptionId = braze.subscribeToContentCardsUpdates((contentCards) => {
            console.log('Content cards subscription callback triggered:', {
                subscriptionId,
                hasContentCards: !!contentCards,
                cardsCount: contentCards?.cards?.length || 0,
                lastUpdated: contentCards?.lastUpdated,
                cards: contentCards?.cards
            });
            
            // Handle the update (for logging/status only - Braze UI handles rendering)
            handleContentCardsUpdate(contentCards);
        });
        
        console.log('Content cards subscription ID:', subscriptionId);
        logToDisplay('system', { 
            message: `Subscribed to content cards updates (ID: ${subscriptionId || 'none'})` 
        });
        
        // Check if user is identified before requesting cards
        const user = braze.getUser();
        const userId = user ? user.getUserId() : null;
        
        // Load cached cards immediately
        const cachedCards = braze.getCachedContentCards();
        console.log('Cached content cards:', {
            exists: !!cachedCards,
            cardsCount: cachedCards?.cards?.length || 0,
            lastUpdated: cachedCards?.lastUpdated,
            isEpoch: cachedCards?.lastUpdated?.getTime() === new Date(0).getTime(),
            cards: cachedCards?.cards,
            userId: userId || 'anonymous'
        });
        
        // Check if we have valid cached cards (not empty/epoch date)
        const hasValidCachedCards = cachedCards && 
            cachedCards.cards && 
            cachedCards.cards.length > 0 &&
            cachedCards.lastUpdated &&
            cachedCards.lastUpdated.getTime() !== new Date(0).getTime();
        
        if (hasValidCachedCards) {
            console.log('Loading cached content cards:', cachedCards);
            logToDisplay('system', { 
                message: `Found ${cachedCards.cards.length} cached card(s)`,
                lastUpdated: cachedCards.lastUpdated ? cachedCards.lastUpdated.toISOString() : null
            });
            handleContentCardsUpdate(cachedCards);
        } else {
            if (!userId) {
                updateContentCardsStatus('No cached cards. Set a User ID to receive cards.', 'info');
                logToDisplay('system', { 
                    message: 'No cached cards found',
                    note: 'User is anonymous. Content cards are typically only sent to identified users. Set a User ID first.'
                });
            } else {
                updateContentCardsStatus('No cached cards, requesting refresh...', 'info');
                logToDisplay('system', { 
                    message: `No cached cards found for user: ${userId}, requesting refresh from Braze...`
                });
                
                // Request refresh if user is identified
                braze.requestContentCardsRefresh(
                    () => {
                        // Success callback
                        console.log('Content cards refresh request sent successfully');
                        logToDisplay('system', { 
                            message: 'Content cards refresh request sent to Braze',
                            note: 'Cards will arrive via subscription callback when available'
                        });
                        updateContentCardsStatus('Refresh requested, waiting for cards...', 'info');
                    },
                    () => {
                        // Error callback
                        console.error('Content cards refresh request failed');
                        logToDisplay('error', { 
                            message: 'Content cards refresh request failed',
                            details: 'Check network connection and Braze dashboard configuration'
                        });
                        updateContentCardsStatus('Failed to request refresh', 'error');
                    }
                );
            }
        }
    } catch (error) {
        console.error('Error subscribing to content cards:', error);
        logToDisplay('error', { 
            message: `Failed to subscribe to content cards: ${error.message}`,
            error: error.toString(),
            stack: error.stack
        });
    }
}

// Request content cards refresh
function refreshContentCards() {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return;
    }
    
    // Check current user
    const user = braze.getUser();
    const userId = user ? user.getUserId() : null;
    console.log('Refreshing content cards for user:', userId || 'anonymous');
    
    if (!userId) {
        logToDisplay('system', { 
            message: 'Warning: User is anonymous',
            note: 'Content cards are typically only sent to identified users. Set a User ID first.'
        });
        updateContentCardsStatus('User is anonymous - cards may not be available', 'warning');
    } else {
        logToDisplay('system', { 
            message: `Requesting content cards refresh for user: ${userId}`,
            note: 'User is identified - cards should be available if targeted correctly'
        });
    }
    
    updateContentCardsStatus('Refreshing content cards...', 'info');
    
    try {
        braze.requestContentCardsRefresh(
            () => {
                // Success callback - refresh request was sent successfully
                console.log('Content cards refresh request sent successfully');
                logToDisplay('system', { 
                    message: 'Content cards refresh request sent successfully',
                    note: 'Waiting for response from Braze...'
                });
                updateContentCardsStatus('Refresh request sent, waiting for cards...', 'info');
                
                // Check multiple times with increasing delays
                const checkIntervals = [500, 1500, 3000, 5000];
                let checkCount = 0;
                
                const checkForCards = () => {
                    const cachedCards = braze.getCachedContentCards();
                    console.log(`Checking for cards (attempt ${checkCount + 1}):`, {
                        exists: !!cachedCards,
                        cardsCount: cachedCards?.cards?.length || 0,
                        lastUpdated: cachedCards?.lastUpdated
                    });
                    
                    if (cachedCards && cachedCards.cards && cachedCards.cards.length > 0) {
                        console.log('Cards found!', cachedCards);
                        handleContentCardsUpdate(cachedCards);
                        updateContentCardsStatus(`Received ${cachedCards.cards.length} card(s)`, 'success');
                        return; // Stop checking
                    }
                    
                    checkCount++;
                    if (checkCount < checkIntervals.length) {
                        setTimeout(checkForCards, checkIntervals[checkCount] - checkIntervals[checkCount - 1]);
                    } else {
                        // Final check
                        console.log('No cards received after all checks');
                        logToDisplay('system', { 
                            message: 'No content cards received from Braze',
                            details: {
                                userId: userId || 'anonymous',
                                suggestion: userId ? 'Check Braze dashboard for card delivery status' : 'Try identifying a user first'
                            }
                        });
                        updateContentCardsStatus('No cards received', 'info');
                    }
                };
                
                // Start checking after first interval
                setTimeout(checkForCards, checkIntervals[0]);
            },
            () => {
                // Error callback - refresh request failed
                console.error('Content cards refresh request failed');
                logToDisplay('error', { 
                    message: 'Content cards refresh request failed',
                    details: {
                        userId: userId || 'anonymous',
                        suggestion: 'Check network connection, SDK initialization, and Braze dashboard configuration'
                    }
                });
                updateContentCardsStatus('Refresh request failed', 'error');
                
                // Try to show cached cards info if available
                const cachedCards = braze.getCachedContentCards();
                if (cachedCards && cachedCards.cards && cachedCards.cards.length > 0) {
                    console.log('Cached cards available', cachedCards);
                    logToDisplay('system', { message: 'Cached cards available - use Show Cards Feed to display' });
                    handleContentCardsUpdate(cachedCards);
                }
            }
        );
    } catch (error) {
        console.error('Error refreshing content cards:', error);
        logToDisplay('error', { 
            message: `Failed to refresh content cards: ${error.message}`,
            error: error.toString(),
            stack: error.stack
        });
        updateContentCardsStatus('Refresh error', 'error');
    }
}

// Set standard user attributes
function setStandardUserAttributes(formData) {
    if (!isSDKReady) {
        showError('SDK not initialized. Please configure and initialize first.');
        return false;
    }
    
    try {
        const user = braze.getUser();
        if (!user) {
            showError('Unable to get user object from Braze SDK');
            return false;
        }
        
        let attributesSet = [];
        let errors = [];
        
        // Set first name
        if (formData.firstName !== undefined) {
            const result = user.setFirstName(formData.firstName || null);
            if (result) {
                attributesSet.push('first_name');
                logToDisplay('attribute', { type: 'standard', key: 'first_name', value: formData.firstName || null });
            } else {
                errors.push('first_name');
            }
        }
        
        // Set last name
        if (formData.lastName !== undefined) {
            const result = user.setLastName(formData.lastName || null);
            if (result) {
                attributesSet.push('last_name');
                logToDisplay('attribute', { type: 'standard', key: 'last_name', value: formData.lastName || null });
            } else {
                errors.push('last_name');
            }
        }
        
        // Set email
        if (formData.email !== undefined) {
            const result = user.setEmail(formData.email || null);
            if (result) {
                attributesSet.push('email');
                logToDisplay('attribute', { type: 'standard', key: 'email', value: formData.email || null });
            } else {
                errors.push('email');
            }
        }
        
        // Set country
        if (formData.country !== undefined) {
            const result = user.setCountry(formData.country || null);
            if (result) {
                attributesSet.push('country');
                logToDisplay('attribute', { type: 'standard', key: 'country', value: formData.country || null });
            } else {
                errors.push('country');
            }
        }
        
        // Set home city
        if (formData.homeCity !== undefined) {
            const result = user.setHomeCity(formData.homeCity || null);
            if (result) {
                attributesSet.push('home_city');
                logToDisplay('attribute', { type: 'standard', key: 'home_city', value: formData.homeCity || null });
            } else {
                errors.push('home_city');
            }
        }
        
        // Set date of birth
        if (formData.dob !== undefined) {
            if (formData.dob.year && formData.dob.month && formData.dob.day) {
                const result = user.setDateOfBirth(formData.dob.year, formData.dob.month, formData.dob.day);
                if (result) {
                    attributesSet.push('dob');
                    logToDisplay('attribute', { type: 'standard', key: 'dob', value: `${formData.dob.year}-${formData.dob.month}-${formData.dob.day}` });
                } else {
                    errors.push('dob');
                }
            } else if (formData.dob.year === null) {
                // Clear date of birth
                const result = user.setDateOfBirth(null, null, null);
                if (result) {
                    attributesSet.push('dob (cleared)');
                    logToDisplay('attribute', { type: 'standard', key: 'dob', value: null });
                }
            }
        }
        
        // Set gender
        if (formData.gender !== undefined) {
            const result = user.setGender(formData.gender || null);
            if (result) {
                attributesSet.push('gender');
                logToDisplay('attribute', { type: 'standard', key: 'gender', value: formData.gender || null });
            } else {
                errors.push('gender');
            }
        }
        
        // Set language
        if (formData.language !== undefined) {
            const result = user.setLanguage(formData.language || null);
            if (result) {
                attributesSet.push('language');
                logToDisplay('attribute', { type: 'standard', key: 'language', value: formData.language || null });
            } else {
                errors.push('language');
            }
        }
        
        // Set phone number
        if (formData.phone !== undefined) {
            const result = user.setPhoneNumber(formData.phone || null);
            if (result) {
                attributesSet.push('phone');
                logToDisplay('attribute', { type: 'standard', key: 'phone', value: formData.phone || null });
            } else {
                errors.push('phone');
            }
        }
        
        // Flush all attributes immediately
        if (braze.requestImmediateDataFlush) {
            braze.requestImmediateDataFlush((success) => {
                if (success) {
                    logToDisplay('system', { message: `✓ ${attributesSet.length} standard attribute(s) flushed to Braze successfully` });
                } else {
                    logToDisplay('system', { message: `⚠ Standard attributes queued (will retry automatically)` });
                }
            });
        }
        
        if (errors.length > 0) {
            showError(`Some attributes failed to set: ${errors.join(', ')}`);
            return false;
        }
        
        if (attributesSet.length > 0) {
            updateInitStatus(`✓ ${attributesSet.length} standard attribute(s) set successfully`, 'success');
            return true;
        }
        
        return true;
    } catch (error) {
        const errorMsg = `Failed to set standard attributes: ${error.message}`;
        console.error('Set standard attributes error:', error);
        logToDisplay('error', { message: errorMsg, error: error.toString() });
        showError(errorMsg);
        return false;
    }
}

// Log to display
function logToDisplay(eventType, eventData) {
    if (!elements.eventLogContainer) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${eventType}`;
    
    // Use textContent for safety, then format with escaped JSON
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'log-timestamp';
    timestampSpan.textContent = `[${timestamp}]`;
    
    const typeSpan = document.createElement('span');
    typeSpan.className = 'log-type';
    typeSpan.textContent = `[${eventType.toUpperCase()}]`;
    
    const dataSpan = document.createElement('span');
    dataSpan.className = 'log-data';
    dataSpan.textContent = JSON.stringify(eventData, null, 2);
    
    logEntry.appendChild(timestampSpan);
    logEntry.appendChild(typeSpan);
    logEntry.appendChild(dataSpan);
    
    elements.eventLogContainer.appendChild(logEntry);
    
    // Limit to 100 entries
    const entries = elements.eventLogContainer.querySelectorAll('.log-entry');
    if (entries.length > 100) {
        entries[0].remove();
    }
    
    // Auto-scroll to bottom so new messages are visible (inner scroll is on #event-log-container)
    requestAnimationFrame(() => {
        const el = elements.eventLogContainer;
        if (el) el.scrollTop = el.scrollHeight;
    });
    
    // Also log to console
    console.log(`[${timestamp}] [${eventType.toUpperCase()}]`, eventData);
}

// Clear event log
function clearEventLog() {
    if (elements.eventLogContainer) {
        elements.eventLogContainer.innerHTML = '';
        console.log('Event log cleared');
        logToDisplay('system', { message: 'Event log cleared' });
    }
}

// Configuration for error message timeout (in milliseconds)
const ERROR_MESSAGE_TIMEOUT = 8000; // Increased from 5000ms for better UX

// Show error message
function showError(message) {
    updateInitStatus(message, 'error');
    setTimeout(() => {
        if (elements.initStatus && elements.initStatus.classList.contains('status-error')) {
            elements.initStatus.textContent = '';
            elements.initStatus.className = 'status-message';
        }
    }, ERROR_MESSAGE_TIMEOUT);
}

// Set loading state for UI elements
function setLoadingState(isLoading) {
    if (elements.initBtn) {
        elements.initBtn.disabled = isLoading;
        elements.initBtn.textContent = isLoading ? 'Initializing...' : 'Initialize SDK';
    }
    
    // Disable all form inputs during loading
    const allInputs = document.querySelectorAll('input, textarea, select, button');
    allInputs.forEach(input => {
        if (input.id !== 'init-btn') {
            input.disabled = isLoading;
        }
    });
}

// Enable/disable event buttons based on SDK readiness
function updateButtonStates() {
    const buttons = [
        elements.setUserBtn,
        elements.clearUserBtn,
        elements.triggerEventBtn,
        elements.purchaseForm?.querySelector('button[type="submit"]'),
        elements.attributeForm?.querySelector('button[type="submit"]'),
        elements.refreshFeatureFlagsBtn
    ].filter(Boolean);
    
    // Also update predefined event buttons
    const predefinedButtons = document.querySelectorAll('.predefined-event-btn');
    predefinedButtons.forEach(btn => {
        if (btn) {
            btn.disabled = !isSDKReady;
            if (!isSDKReady) {
                btn.title = 'SDK not initialized';
            } else {
                btn.title = '';
            }
        }
    });
    
    buttons.forEach(btn => {
        if (btn) {
            btn.disabled = !isSDKReady;
            if (!isSDKReady) {
                btn.title = 'SDK not initialized';
            } else {
                btn.title = '';
            }
        }
    });
}

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded - Starting initialization');
    console.log('SDK Ready:', isSDKReady);
    console.log('Braze SDK available:', typeof braze !== 'undefined');
    console.log('Config values:', { 
        apiKey: BRAZE_API_KEY ? BRAZE_API_KEY.substring(0, 10) + '...' : 'missing',
        endpoint: BRAZE_SDK_ENDPOINT 
    });
    
    initDOMElements();
    updateButtonStates();

    // Dashboard: sidebar navigation
    document.querySelectorAll('.nav-link[data-panel]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const panelId = link.getAttribute('data-panel');
            if (panelId) showPanel(panelId);
        });
    });
    // Initial panel from hash (e.g. #events)
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById('panel-' + hash)) {
        showPanel(hash);
    }

    // Dashboard: Event Log collapse/expand
    if (elements.collapseLogBtn && elements.eventLogStrip) {
        elements.collapseLogBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const collapsed = elements.eventLogStrip.classList.toggle('collapsed');
            elements.collapseLogBtn.setAttribute('aria-expanded', String(!collapsed));
            elements.collapseLogBtn.textContent = collapsed ? '▲ Expand' : '▼ Collapse';
        });
    }
    
    // Load config from environment variables (config.js)
    // Check if config values are set (not the default placeholder values)
    const usingEnvConfig = hasValidEnvConfig();
    console.log('Using env config:', usingEnvConfig);
    
    if (usingEnvConfig) {
        // Display config values in form (read-only)
        elements.apiKeyInput.value = BRAZE_API_KEY;
        elements.endpointInput.value = BRAZE_SDK_ENDPOINT;
        elements.apiKeyInput.readOnly = true;
        elements.endpointInput.readOnly = true;
        elements.apiKeyInput.style.backgroundColor = '#f5f5f5';
        elements.endpointInput.style.backgroundColor = '#f5f5f5';
        
        // Auto-initialize with config values
        const validation = validateConfig(BRAZE_API_KEY, BRAZE_SDK_ENDPOINT);
        console.log('Config validation:', validation);
        if (validation.valid) {
            console.log('Starting auto-initialization...');
            const success = await initializeBraze(BRAZE_API_KEY, BRAZE_SDK_ENDPOINT);
            console.log('Initialization result:', success);
            console.log('isSDKReady after init:', isSDKReady);
            updateButtonStates();
            
            // Show retry button if initialization failed
            const retryBtn = document.getElementById('retry-init-btn');
            if (retryBtn && !success) {
                retryBtn.style.display = 'block';
            }
        } else {
            console.error('Config validation failed:', validation.error);
            showError(validation.error);
        }
    } else {
        // Fallback: Load config from localStorage if env vars not set
        const savedConfig = loadConfigFromStorage();
        if (savedConfig) {
            elements.apiKeyInput.value = savedConfig.apiKey;
            elements.endpointInput.value = savedConfig.endpoint;
            
            // Auto-initialize
            const validation = validateConfig(savedConfig.apiKey, savedConfig.endpoint);
            if (validation.valid) {
                const success = await initializeBraze(savedConfig.apiKey, savedConfig.endpoint);
                updateButtonStates();
                
                // Show retry button if initialization failed
                const retryBtn = document.getElementById('retry-init-btn');
                if (retryBtn && !success) {
                    retryBtn.style.display = 'block';
                }
            }
        } else {
            // Show warning if no config is available
            showError('Please configure Braze API Key and SDK Endpoint in .env file and run: npm run load-env');
        }
    }
    
    // Configuration form handler
    elements.configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // If using env config, form is read-only - show message
        if (hasValidEnvConfig() && elements.apiKeyInput.readOnly) {
            showError('Configuration is loaded from .env file. To change it, edit .env and run: npm run load-env');
            return;
        }
        
        const apiKey = elements.apiKeyInput.value.trim();
        const endpoint = elements.endpointInput.value.trim();
        
        const validation = validateConfig(apiKey, endpoint);
        if (!validation.valid) {
            showError(validation.error);
            return;
        }
        
        // Save to localStorage (fallback when env vars not used)
        saveConfigToStorage(apiKey, endpoint);
        
        // Re-initialize SDK
        isSDKReady = false;
        updateInitStatus('Initializing...', 'info');
        updateButtonStates();
        
        const success = await initializeBraze(apiKey, endpoint);
        updateButtonStates();
        
        // Show/hide retry button based on success
        const retryBtn = document.getElementById('retry-init-btn');
        if (retryBtn) {
            retryBtn.style.display = success ? 'none' : 'block';
        }
        
        if (success) {
            // Log page view after successful initialization
            // Page name is configurable via data attribute or defaults to current path
            const pageName = document.body.dataset.pageName || window.location.pathname || 'home';
            try {
                braze.logCustomEvent('page_view', { page: pageName });
                logToDisplay('event', { type: 'page_view', page: pageName });
                
                // Flush page view event
                if (braze.requestImmediateDataFlush) {
                    braze.requestImmediateDataFlush();
                }
            } catch (error) {
                console.error('Page view error:', error);
            }
        }
    });
    
    // User management handlers
    elements.setUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const userId = elements.userIdInput.value.trim();
        setBrazeUser(userId || null);
    });
    
    elements.clearUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.userIdInput.value = '';
        setBrazeUser(null);
    });
    
    // Standard Attributes Modal handlers
    if (elements.setStandardAttributesBtn) {
        elements.setStandardAttributesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openStandardAttributesModal();
        });
    }
    
    if (elements.closeModalBtn) {
        elements.closeModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeStandardAttributesModal();
        });
    }
    
    if (elements.cancelStandardAttributesBtn) {
        elements.cancelStandardAttributesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeStandardAttributesModal();
        });
    }
    
    if (elements.clearStandardAttributesBtn) {
        elements.clearStandardAttributesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Clear all standard user attributes? This will set all fields to null in Braze.')) {
                const formData = {
                    firstName: null,
                    lastName: null,
                    email: null,
                    country: null,
                    homeCity: null,
                    dob: { year: null, month: null, day: null },
                    gender: null,
                    language: null,
                    phone: null
                };
                const success = setStandardUserAttributes(formData);
                if (success) {
                    // Clear form
                    if (elements.standardAttributesForm) {
                        elements.standardAttributesForm.reset();
                    }
                    closeStandardAttributesModal();
                }
            }
        });
    }
    
    // Close modal when clicking outside
    if (elements.standardAttributesModal) {
        elements.standardAttributesModal.addEventListener('click', (e) => {
            if (e.target === elements.standardAttributesModal) {
                closeStandardAttributesModal();
            }
        });
        
        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.standardAttributesModal.classList.contains('show')) {
                closeStandardAttributesModal();
            }
        });
    }
    
    // Standard Attributes Form handler
    if (elements.standardAttributesForm) {
        elements.standardAttributesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Collect form data
            const firstName = elements.firstNameInput ? elements.firstNameInput.value.trim() : '';
            const lastName = elements.lastNameInput ? elements.lastNameInput.value.trim() : '';
            const email = elements.emailInput ? elements.emailInput.value.trim() : '';
            const country = elements.countryInput ? elements.countryInput.value.trim() : '';
            const homeCity = elements.homeCityInput ? elements.homeCityInput.value.trim() : '';
            const dobYear = elements.dobYearInput ? elements.dobYearInput.value.trim() : '';
            const dobMonth = elements.dobMonthInput ? elements.dobMonthInput.value.trim() : '';
            const dobDay = elements.dobDayInput ? elements.dobDayInput.value.trim() : '';
            const gender = elements.genderSelect ? elements.genderSelect.value : '';
            const language = elements.languageInput ? elements.languageInput.value.trim() : '';
            const phone = elements.phoneInput ? elements.phoneInput.value.trim() : '';
            
            // Validate inputs
            const emailValidation = validateEmail(email);
            if (!emailValidation.valid) {
                showError(emailValidation.error);
                return;
            }
            
            const phoneValidation = validatePhone(phone);
            if (!phoneValidation.valid) {
                showError(phoneValidation.error);
                return;
            }
            
            const languageValidation = validateLanguage(language);
            if (!languageValidation.valid) {
                showError(languageValidation.error);
                return;
            }
            
            const dobValidation = validateDateOfBirth(dobYear, dobMonth, dobDay);
            if (!dobValidation.valid) {
                showError(dobValidation.error);
                return;
            }
            
            // Prepare form data
            const formData = {
                firstName: firstName || null,
                lastName: lastName || null,
                email: emailValidation.value,
                country: country || null,
                homeCity: homeCity || null,
                dob: dobValidation.year !== null ? {
                    year: dobValidation.year,
                    month: dobValidation.month,
                    day: dobValidation.day
                } : { year: null, month: null, day: null },
                gender: gender || null,
                language: languageValidation.value,
                phone: phoneValidation.value
            };
            
            // Set attributes
            const success = setStandardUserAttributes(formData);
            if (success) {
                closeStandardAttributesModal();
            }
        });
    }
    
    // Custom event form handler (now in a form for better accessibility)
    // Predefined event buttons
    const predefinedEventButtons = document.querySelectorAll('.predefined-event-btn');
    predefinedEventButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const eventName = button.getAttribute('data-event');
            const propsJson = button.getAttribute('data-props');
            
            if (!eventName) {
                console.error('Predefined event button missing data-event attribute');
                showError('Event name not found');
                return;
            }
            
            let properties = {};
            if (propsJson) {
                try {
                    properties = JSON.parse(propsJson);
                } catch (parseError) {
                    console.warn('Failed to parse predefined event properties:', parseError);
                    properties = {};
                }
            }
            
            console.log('Triggering predefined event:', { eventName, properties });
            triggerPredefinedEvent(eventName, properties);
        });
    });
    
    const customEventForm = document.getElementById('custom-event-form');
    if (customEventForm) {
        console.log('Attaching submit handler to custom-event-form');
        customEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Custom event form submitted');
            const eventName = elements.eventNameInput.value.trim();
            const properties = elements.eventPropsInput.value.trim();
            console.log('Form values:', { eventName, properties });
            const result = triggerCustomEvent(eventName, properties || null);
            console.log('triggerCustomEvent result:', result);
            
            // Clear form on successful submission
            if (result.success) {
                customEventForm.reset();
            }
        });
    } else {
        console.warn('custom-event-form not found, using button fallback');
        // Fallback for button click if form not found
        if (elements.triggerEventBtn) {
            elements.triggerEventBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Trigger event button clicked');
                const eventName = elements.eventNameInput.value.trim();
                const properties = elements.eventPropsInput.value.trim();
                const result = triggerCustomEvent(eventName, properties || null);
                
                // Clear form on successful submission
                if (result.success) {
                    elements.eventNameInput.value = '';
                    elements.eventPropsInput.value = '';
                }
            });
        }
    }
    
    // Purchase form handler
    elements.purchaseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productId = elements.productIdInput.value.trim();
        const price = elements.priceInput.value;
        const currency = elements.currencyInput.value.trim();
        const quantity = elements.quantityInput.value;
        const properties = elements.purchasePropsInput.value.trim();
        
        const result = logPurchaseEvent(productId, price, currency, quantity, properties || null);
        
        // Reset form on successful submission
        if (result.success) {
            elements.purchaseForm.reset();
            elements.currencyInput.value = 'USD'; // Reset to default
            elements.quantityInput.value = '1'; // Reset to default
        }
    });
    
    // Attribute form handler
    elements.attributeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Attribute form submitted');
        const key = elements.attrKeyInput.value.trim();
        const value = elements.attrValueInput.value.trim();
        const type = elements.attrTypeSelect.value;
        console.log('Form values:', { key, value, type });
        const success = setUserAttribute(key, value, type);
        console.log('setUserAttribute result:', success);
        
        // Reset form on successful submission
        if (success) {
            elements.attributeForm.reset();
            elements.attrTypeSelect.value = 'string'; // Reset to default
        }
    });
    
        // Clear logs button
    elements.clearLogsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearEventLog();
    });
    
    // Content Cards buttons
    if (elements.showContentCardsBtn) {
        elements.showContentCardsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContentCardsFeed();
        });
    }
    
    if (elements.hideContentCardsBtn) {
        elements.hideContentCardsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideContentCardsFeed();
        });
    }
    
    if (elements.toggleContentCardsBtn) {
        elements.toggleContentCardsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleContentCardsFeed();
        });
    }
    
    if (elements.refreshContentCardsBtn) {
        elements.refreshContentCardsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            refreshContentCards();
        });
    }

    // Feature Flags: refresh from Braze
    if (elements.refreshFeatureFlagsBtn) {
        elements.refreshFeatureFlagsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            refreshFeatureFlags();
        });
    }

    // Feature Flags: Start Live Chat (demo - logs event when clicked)
    if (elements.startLiveChatBtn) {
        elements.startLiveChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSDKReady) {
                triggerCustomEvent('live_chat_started', { source: 'feature_flag_demo' });
                logToDisplay('system', { message: 'Live Chat clicked (demo). In production, open your chat widget here.' });
            }
        });
    }

    // Push Notification buttons
    if (elements.requestPushPermissionBtn) {
        elements.requestPushPermissionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            requestPushPermission();
        });
    }
    
    if (elements.unregisterPushBtn) {
        elements.unregisterPushBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            unregisterPush();
        });
    }
    
    if (elements.testNotificationBtn) {
        elements.testNotificationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            testNotification();
        });
    }
    
    // Retry initialization button
    const retryBtn = document.getElementById('retry-init-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Use env config if available, otherwise use form values
            const usingEnv = hasValidEnvConfig();
            const apiKey = usingEnv ? BRAZE_API_KEY : elements.apiKeyInput.value.trim();
            const endpoint = usingEnv ? BRAZE_SDK_ENDPOINT : elements.endpointInput.value.trim();
            
            const validation = validateConfig(apiKey, endpoint);
            if (validation.valid) {
                retryBtn.style.display = 'none';
                const success = await initializeBraze(apiKey, endpoint);
                updateButtonStates();
                if (!success) {
                    retryBtn.style.display = 'block';
                }
            } else {
                showError(validation.error);
            }
        });
    }
    
    logToDisplay('system', { message: 'Application loaded', isSDKReady, timestamp: new Date().toISOString() });
    console.log('Application initialization complete. SDK Ready:', isSDKReady);
    
    // Log SDK state for debugging
    if (typeof braze !== 'undefined') {
        console.log('Braze SDK methods available:', {
            initialize: typeof braze.initialize,
            logCustomEvent: typeof braze.logCustomEvent,
            requestImmediateDataFlush: typeof braze.requestImmediateDataFlush,
            openSession: typeof braze.openSession
        });
    }
});
