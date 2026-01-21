---
title: 'Braze Web SDK Test Application'
slug: 'braze-web-sdk-test-application'
created: '2026-01-20T19:30:00.000Z'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['HTML5', 'CSS3', 'ES6+ JavaScript', '@braze/web-sdk 4.0.0+']
files_to_modify: []
code_patterns: ['Vanilla JavaScript ES6+', 'Event-driven UI', 'localStorage for config', 'Modular function organization']
test_patterns: ['Manual browser testing', 'Console verification', 'Network tab verification', 'Braze dashboard verification']
---

# Tech-Spec: Braze Web SDK Test Application

**Created:** 2026-01-20T19:30:00.000Z

## Overview

### Problem Statement

Need a simple website application to test Braze Web SDK integration by simulating user interactions and observing data flow into the Braze workspace. The application should provide an easy way to trigger various event types and verify they are being sent to Braze correctly.

### Solution

Build a lightweight, single-page web application using vanilla HTML/CSS/JavaScript that integrates the Braze Web SDK. The app will include:
- Interactive UI elements to simulate common user actions (button clicks, form submissions, purchases)
- Event tracking dashboard showing what events are being sent
- Configuration interface for Braze API key and endpoint
- Support for both anonymous and identified user tracking
- Real-time visual feedback when events are logged

### Scope

**In Scope:**
- Single-page HTML application with embedded JavaScript
- Braze Web SDK integration via NPM package
- Event simulation UI (buttons, forms, purchase simulator)
- Event logging display/console output
- User identification (anonymous and custom user IDs)
- Custom event tracking
- Purchase event tracking
- User attribute setting
- Session management
- Basic styling for usability
- Configuration via environment variables or UI input

**Out of Scope:**
- Backend/server-side functionality
- User authentication system
- Database persistence
- Complex routing or multi-page navigation
- Production deployment setup (local testing focus)
- Advanced Braze features (Content Cards, In-App Messages UI)

## Context for Development

### Codebase Patterns

**Confirmed Clean Slate**: No existing codebase found. Project root is `/Users/andre.rodrigues/Documents/Website test/` with only BMAD configuration files present.

**Established Patterns:**
- **Vanilla JavaScript (ES6+)**: No framework dependencies, ES6 modules support via `type="module"` or bundler
- **Modular Function Organization**: Separate functions for Braze SDK operations (init, events, attributes, purchases)
- **Event-Driven UI**: DOM event listeners for button clicks, form submissions
- **localStorage Pattern**: Store Braze API key and endpoint in browser localStorage for persistence
- **Error Handling**: Try-catch blocks around all Braze SDK method calls
- **Console + UI Logging**: Dual logging to browser console and on-page display

**File Structure:**
```
Website test/
├── package.json          # NPM dependencies (@braze/web-sdk)
├── index.html            # Single-page application entry
├── app.js                # Main application logic and Braze integration
├── styles.css             # Application styling
├── README.md              # Setup and usage documentation
├── .gitignore            # Exclude node_modules, .env files
└── .env.example          # Template for Braze credentials (optional)
```

### Files to Reference

| File | Purpose | Location |
| ---- | ------- | -------- |
| Braze Web SDK Documentation | Official integration guide | https://www.braze.com/docs/developer_guide/sdk_integration?sdktab=web&redirected=3 |
| package.json | NPM dependencies and project metadata | `{project-root}/package.json` (NEW) |
| index.html | Main application entry point | `{project-root}/index.html` (NEW) |
| app.js | Application logic and Braze SDK integration | `{project-root}/app.js` (NEW) |
| styles.css | Application styling | `{project-root}/styles.css` (NEW) |
| README.md | Setup instructions and usage guide | `{project-root}/README.md` (NEW) |

### Technical Decisions

1. **Vanilla JavaScript over Framework**: Chosen for simplicity, no build step required, easier to understand and modify for testing purposes. ES6+ features supported by modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

2. **NPM Integration**: Use `@braze/web-sdk` package (v4.0.0+) for:
   - Better control and local storage (ad-blocker immunity)
   - Tree-shaking support for unused code elimination
   - TypeScript definitions included
   - Import syntax: `import * as braze from "@braze/web-sdk"`

3. **Single Page Application**: All functionality on one page for easy testing and observation. No routing needed.

4. **Configuration via UI + localStorage**: 
   - Allow users to input API key/endpoint via form for flexibility during testing
   - Persist configuration in localStorage to avoid re-entering credentials
   - No server-side storage needed

5. **Dual Logging Strategy**: 
   - Browser console for developer debugging
   - On-page event log display for visual verification
   - Timestamp all log entries using `new Date().toISOString()`
   - Limit event log to 100 entries max (remove oldest if exceeded)
   - Auto-scroll to bottom on new entry

6. **Braze SDK v4.0.0+ Requirements**:
   - Initialize: `braze.initialize(apiKey, { baseUrl, enableLogging, allowUserSuppliedJavascript })`
   - Session: Call `braze.openSession()` after initialization and user setup
   - User: Call `braze.changeUser(userId)` before `openSession()` if user is known
   - Events: `braze.logCustomEvent(eventName, properties)`
   - Purchases: `braze.logPurchase(productId, price, currency, quantity, properties)`
   - Attributes: `braze.setCustomUserAttribute(key, value)` - supports string, number, boolean, array
   - No Internet Explorer support (modern browsers only)

7. **ES6 Module Implementation**: 
   - HTML script tag must include `type="module"` attribute: `<script type="module" src="app.js"></script>`
   - All imports use ES6 module syntax
   - Browser must support ES6 modules (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

8. **localStorage Implementation Details**:
   - Keys: `braze_api_key` (string), `braze_endpoint` (string)
   - Data structure: Simple key-value pairs
   - Validation: Check on load, handle corrupted/missing data gracefully
   - Load on page load (DOMContentLoaded event)

9. **Initialization Order**:
   - On page load: Load config from localStorage (if exists)
   - Wait for DOMContentLoaded before initializing SDK
   - Check if SDK is ready before allowing event triggers (use flag: `isSDKReady`)
   - If user triggers event before SDK ready: Show error message
   - Handle race conditions: Disable event buttons until SDK initialized

10. **Re-initialization Strategy**:
   - If user changes API key/endpoint: Clear current session, re-initialize SDK
   - Reset `isSDKReady` flag during re-initialization
   - Show loading state during re-initialization
   - Handle errors gracefully: Show error message, allow retry

11. **No Build Step Required**: Application can run directly in browser with ES6 modules, or use simple bundler if needed for older browser support.

## Implementation Plan

### Tasks

1. **Project Setup**
   - File: `{project-root}/package.json` (NEW)
   - Action: Create package.json with name "braze-test-app", version "1.0.0", type "module", and dependency "@braze/web-sdk": "^4.0.0"
   - File: `{project-root}/.gitignore` (NEW)
   - Action: Create .gitignore excluding node_modules/, .env, *.log, .DS_Store
   - File: `{project-root}/index.html` (NEW)
   - Action: Create HTML5 document with semantic structure, include script tag with `type="module"` pointing to app.js
   - File: `{project-root}/app.js` (NEW)
   - Action: Create empty ES6 module file
   - File: `{project-root}/styles.css` (NEW)
   - Action: Create empty stylesheet file

2. **Braze SDK Integration**
   - File: `{project-root}/app.js`
   - Action: Import Braze SDK: `import * as braze from "@braze/web-sdk"`
   - Action: Create function `initializeBraze(apiKey, endpoint)` that:
     - Takes apiKey (string) and endpoint (string) as parameters
     - Returns Promise<void>
     - Calls `braze.initialize(apiKey, { baseUrl: endpoint, enableLogging: true, allowUserSuppliedJavascript: false })`
     - Wraps in try-catch, logs errors to console and UI
     - Sets global flag `isSDKReady = true` on success
   - Action: Create function `openBrazeSession()` that:
     - Checks if `isSDKReady === true`
     - Calls `braze.openSession()` wrapped in try-catch
     - Logs success/error to console and UI
   - Action: Create global variable `let isSDKReady = false` at top of file

3. **Configuration Interface & localStorage**
   - File: `{project-root}/index.html`
   - Action: Create form with id="config-form" containing:
     - Input field id="api-key-input" type="text" placeholder="Braze API Key" required
     - Input field id="endpoint-input" type="url" placeholder="SDK Endpoint URL" required
     - Button id="init-btn" type="submit" text="Initialize SDK"
   - Action: Add status div id="init-status" to show initialization state
   - File: `{project-root}/app.js`
   - Action: Create function `loadConfigFromStorage()` that:
     - Reads `localStorage.getItem('braze_api_key')` and `localStorage.getItem('braze_endpoint')`
     - Returns object `{ apiKey, endpoint }` or null if missing
     - Handles corrupted data: try-catch, return null on error
   - Action: Create function `saveConfigToStorage(apiKey, endpoint)` that:
     - Validates inputs are non-empty strings
     - Calls `localStorage.setItem('braze_api_key', apiKey)` and `localStorage.setItem('braze_endpoint', endpoint)`
   - Action: Create function `validateConfig(apiKey, endpoint)` that:
     - Checks apiKey is non-empty string
     - Checks endpoint is valid URL format (use URL constructor)
     - Returns `{ valid: boolean, error: string }`
   - Action: On DOMContentLoaded: Call `loadConfigFromStorage()`, if found, populate form fields and auto-initialize

4. **User Management**
   - File: `{project-root}/index.html`
   - Action: Create section with:
     - Input field id="user-id-input" type="text" placeholder="User ID (leave empty for anonymous)"
     - Button id="set-user-btn" text="Set User ID"
     - Button id="clear-user-btn" text="Clear User (Anonymous)"
     - Display div id="current-user-display" showing "Current User: [user-id or 'Anonymous']"
   - File: `{project-root}/app.js`
   - Action: Create function `setBrazeUser(userId)` that:
     - Takes userId (string or null for anonymous)
     - Checks `isSDKReady === true`, shows error if false
     - If userId is null/empty: Do nothing (Braze uses anonymous by default)
     - If userId provided: Call `braze.changeUser(userId)` wrapped in try-catch
     - Updates `current-user-display` element
     - Logs action to console and UI

5. **Event Tracking UI - Custom Events**
   - File: `{project-root}/index.html`
   - Action: Create section with:
     - Input field id="event-name-input" type="text" placeholder="Event Name" required
     - Textarea id="event-props-input" placeholder='Event Properties (JSON): {"key": "value"}'
     - Button id="trigger-event-btn" text="Trigger Custom Event"
   - File: `{project-root}/app.js`
   - Action: Create function `triggerCustomEvent(eventName, properties)` that:
     - Takes eventName (string) and properties (object, optional)
     - Checks `isSDKReady === true`, shows error if false
     - Validates eventName is non-empty string
     - Parses properties JSON if string provided, handles parse errors
     - Calls `braze.logCustomEvent(eventName, properties || {})` wrapped in try-catch
     - Logs to event log display and console

6. **Event Tracking UI - Purchase Events**
   - File: `{project-root}/index.html`
   - Action: Create section with form id="purchase-form" containing:
     - Input id="product-id-input" type="text" placeholder="Product ID" required
     - Input id="price-input" type="number" step="0.01" min="0" placeholder="Price" required
     - Input id="currency-input" type="text" placeholder="Currency (e.g., USD)" value="USD" required
     - Input id="quantity-input" type="number" min="1" value="1" placeholder="Quantity" required
     - Textarea id="purchase-props-input" placeholder='Purchase Properties (JSON, optional)'
     - Button type="submit" text="Log Purchase Event"
   - File: `{project-root}/app.js`
   - Action: Create function `logPurchaseEvent(productId, price, currency, quantity, properties)` that:
     - Takes productId (string), price (number), currency (string), quantity (number), properties (object, optional)
     - Validates: productId non-empty, price > 0, currency non-empty, quantity >= 1
     - Checks `isSDKReady === true`, shows error if false
     - Calls `braze.logPurchase(productId, price, currency, quantity, properties || {})` wrapped in try-catch
     - Logs to event log display and console

7. **User Attributes UI**
   - File: `{project-root}/index.html`
   - Action: Create section with form id="attribute-form" containing:
     - Input id="attr-key-input" type="text" placeholder="Attribute Key" required
     - Select id="attr-type-select" with options: "string", "number", "boolean", "array"
     - Input id="attr-value-input" type="text" placeholder="Attribute Value" required
     - Button type="submit" text="Set User Attribute"
   - File: `{project-root}/app.js`
   - Action: Create function `setUserAttribute(key, value, type)` that:
     - Takes key (string), value (varies by type), type (string: "string"|"number"|"boolean"|"array")
     - Validates key is non-empty string
     - Converts value based on type: parse number, parse boolean, parse JSON array
     - Checks `isSDKReady === true`, shows error if false
     - Calls `braze.setCustomUserAttribute(key, convertedValue)` wrapped in try-catch
     - Logs to event log display and console

8. **Event Logging Display**
   - File: `{project-root}/index.html`
   - Action: Create section with:
     - Div id="event-log-container" with max-height, overflow-y: auto
     - Button id="clear-logs-btn" text="Clear Logs"
   - File: `{project-root}/app.js`
   - Action: Create function `logToDisplay(eventType, eventData)` that:
     - Takes eventType (string) and eventData (object)
     - Creates log entry with timestamp: `new Date().toISOString()`
     - Formats as: `[timestamp] [eventType]: [JSON.stringify(eventData)]`
     - Appends to `event-log-container` as new div element
     - Limits to 100 entries max (remove oldest if exceeded)
     - Auto-scrolls to bottom on new entry
     - Also calls `console.log()` with same data
   - Action: Create function `clearEventLog()` that:
     - Clears innerHTML of `event-log-container`
     - Logs "Event log cleared" to console

9. **Page View Tracking**
   - File: `{project-root}/app.js`
   - Action: On DOMContentLoaded, after SDK initialization:
     - If `isSDKReady === true`: Call `braze.logCustomEvent('page_view', { page: 'home' })` wrapped in try-catch
     - Log to event display

10. **Styling**
    - File: `{project-root}/styles.css`
    - Action: Create modern, clean design with:
      - CSS variables for colors (primary, secondary, success, error)
      - Responsive layout using flexbox/grid
      - Form styling with focus states
      - Button hover/active states
      - Event log styling: monospace font, alternating row colors, scrollable container
      - Status indicators (success: green, error: red, loading: yellow)
      - Mobile-responsive breakpoints

11. **Error Handling & Validation**
    - File: `{project-root}/app.js`
    - Action: Wrap all Braze SDK calls in try-catch blocks
    - Action: Show user-friendly error messages in UI (not just console)
    - Action: Validate all form inputs before submission
    - Action: Handle network errors gracefully (show retry option)
    - Action: Handle invalid API key/endpoint: Show specific error message

12. **Documentation**
    - File: `{project-root}/README.md` (NEW)
    - Action: Include sections:
      - Setup instructions (npm install, open index.html)
      - How to get Braze API key and endpoint
      - How to use each feature (with screenshots if possible)
      - Braze dashboard verification steps:
        1. Log in to Braze dashboard
        2. Navigate to: Audience > Search Users
        3. Search for user ID (or check anonymous users)
        4. Click on user profile
        5. Navigate to "Events" tab
        6. Verify events appear within 30 seconds of triggering
      - Troubleshooting section (see below)

### Acceptance Criteria

**Happy Path:**
- [ ] AC1: Given the application is loaded, when the page renders, then the configuration form is displayed with API key and endpoint input fields
- [ ] AC2: Given valid API key and endpoint are entered, when user clicks "Initialize SDK", then SDK initializes successfully and status shows "Initialized"
- [ ] AC3: Given SDK is initialized, when user enters user ID and clicks "Set User ID", then user is identified in Braze and current user display updates
- [ ] AC4: Given SDK is initialized, when user triggers a custom event with name and optional properties, then event is logged to Braze dashboard within 30 seconds
- [ ] AC5: Given SDK is initialized, when user submits purchase form with product ID, price, currency, and quantity, then purchase event is logged to Braze dashboard within 30 seconds
- [ ] AC6: Given SDK is initialized, when user sets user attribute with key, value, and type (string/number/boolean/array), then attribute is set in Braze and visible in user profile
- [ ] AC7: Given any event is triggered, when event is logged, then it appears in on-page event log with timestamp, event type, and properties within 1 second
- [ ] AC8: Given any event is triggered, when event is logged, then it appears in browser console with timestamp and full event data
- [ ] AC9: Given configuration is saved, when page is reloaded, then API key and endpoint are automatically loaded from localStorage and form is pre-filled

**Error Handling:**
- [ ] AC10: Given invalid API key is entered, when user clicks "Initialize SDK", then error message is displayed: "Invalid API key or endpoint. Please check your credentials."
- [ ] AC11: Given network request fails, when SDK initialization is attempted, then error message is displayed: "Network error. Please check your connection and try again."
- [ ] AC12: Given SDK fails to load (e.g., module not found), when page loads, then error message is displayed: "Failed to load Braze SDK. Please check your installation."
- [ ] AC13: Given user tries to trigger event before SDK initialization, when event button is clicked, then error message is displayed: "SDK not initialized. Please configure and initialize first."
- [ ] AC14: Given empty API key or endpoint, when user clicks "Initialize SDK", then validation error is shown: "API key and endpoint are required."
- [ ] AC15: Given invalid URL format for endpoint, when user clicks "Initialize SDK", then validation error is shown: "Endpoint must be a valid URL."

**UI/UX:**
- [ ] AC16: Given application is loaded, when viewed on mobile device (width < 768px), then layout is responsive and all controls are accessible
- [ ] AC17: Given event log has 100+ entries, when new event is logged, then oldest entries are removed and log remains scrollable
- [ ] AC18: Given "Clear Logs" button is clicked, when clicked, then all event log entries are removed from display
- [ ] AC19: Given user changes API key/endpoint after initialization, when new values are saved and "Initialize SDK" is clicked, then SDK re-initializes with new credentials and previous session is cleared

**Verification:**
- [ ] AC20: Given events are triggered, when checking Braze dashboard (Audience > Search Users > [User] > Events tab), then all events appear within 30 seconds with correct event names and properties

## Additional Context

### Dependencies

- `@braze/web-sdk`: Latest version (4.0.0+)
- Modern web browser with ES6+ support:
  - Chrome 90+ (released April 2021)
  - Firefox 88+ (released April 2021)
  - Safari 14+ (released September 2020)
  - Edge 90+ (released April 2021)
- Node.js 14+ and npm (for package installation)
- Local development server (optional, can open HTML directly, but ES6 modules may require server for CORS)

### Testing Strategy

1. **Local Testing**: Open application in browser, configure Braze credentials
2. **Event Verification**: Trigger events and verify in Braze dashboard (User Search > Events)
3. **Console Verification**: Check browser console for SDK logs and errors
4. **Network Verification**: Use browser DevTools Network tab to verify API calls to Braze
5. **User Identification Testing**: Test both anonymous and identified user scenarios

### Notes

- API key and endpoint should be kept secure (not committed to version control)
- Consider adding a `.env.example` file for configuration template
- Application should work without a build step for simplicity
- All Braze SDK methods should be wrapped with try-catch for error handling
- Event log is limited to 100 entries to prevent performance issues
- ES6 modules require HTTP server (not file:// protocol) - use `npx serve .` or similar

### Troubleshooting

**Common Issues:**

1. **"Failed to load module" error:**
   - Cause: Opening HTML file directly (file:// protocol) doesn't support ES6 modules
   - Solution: Use local development server: `npx serve .` or `python -m http.server 8000`

2. **CORS errors in browser console:**
   - Cause: Braze SDK making cross-origin requests
   - Solution: Ensure you're using correct endpoint URL from Braze dashboard, check browser console for specific CORS error details

3. **Events not appearing in Braze dashboard:**
   - Cause: Invalid API key, wrong endpoint, or network issues
   - Solution: Verify API key and endpoint in Braze dashboard (Settings > App Settings), check Network tab for failed requests, wait up to 30 seconds for events to appear

4. **SDK initialization fails silently:**
   - Cause: Invalid credentials or network error
   - Solution: Check browser console for detailed error messages, verify API key format, ensure endpoint URL is correct (should include https://)

5. **localStorage not persisting:**
   - Cause: Browser privacy settings, incognito mode, or storage quota exceeded
   - Solution: Check browser settings, try different browser, clear storage and retry

6. **Module not found error:**
   - Cause: @braze/web-sdk not installed or incorrect import path
   - Solution: Run `npm install`, verify node_modules/@braze/web-sdk exists, check import statement matches package structure

## Review Notes

- **Adversarial review completed**: 2026-01-20
- **Findings**: 15 total (1 Critical, 3 High, 6 Medium, 5 Low)
- **Fixed**: 15 findings addressed via auto-fix
- **Resolution approach**: Auto-fix all real findings

### Key Fixes Applied:

1. **F1 (Critical)**: Fixed XSS vulnerability in `logToDisplay()` by using `textContent` instead of `innerHTML`
2. **F2 (High)**: Enhanced JSON.parse error handling with better error messages and validation
3. **F3 (High)**: Fixed race condition by ensuring `openBrazeSession()` completes before setting `isSDKReady`
4. **F4 (High)**: Added retry button for error recovery after failed initialization
5. **F5 (Medium)**: Added comprehensive accessibility attributes (aria-labels, aria-describedby, aria-live regions)
6. **F6 (Medium)**: Added security warnings in README about localStorage XSS vulnerabilities
7. **F7 (Medium)**: Added form reset after successful submissions
8. **F8 (Medium)**: Added loading states with `setLoadingState()` function
9. **F9 (Medium)**: Made error timeout configurable (increased to 8000ms)
10. **F10 (Medium)**: Added currency code validation (ISO 4217 format)
11. **F11 (Low)**: Standardized error handling to return consistent result objects
12. **F12 (Low)**: Fixed keyboard navigation by converting custom event section to proper form
13. **F13 (Low)**: Added input length limits via maxlength attributes
14. **F14 (Low)**: Made page name configurable via data attribute
15. **F15 (Low)**: Added comprehensive security documentation in README
