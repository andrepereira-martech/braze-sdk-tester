# Braze Web SDK Test Application

A simple website application to test Braze Web SDK integration by simulating user interactions and observing data flow into your Braze workspace.

## Features

- ✅ **SDK Configuration**: Easy setup with API key and endpoint
- ✅ **User Management**: Support for both anonymous and identified user tracking
- ✅ **Custom Events**: Trigger custom events with optional properties
- ✅ **Purchase Events**: Simulate purchase events with product data
- ✅ **User Attributes**: Set custom user attributes (string, number, boolean, array)
- ✅ **Event Logging**: Real-time event log display with timestamps
- ✅ **Environment Configuration**: Secure configuration via `.env` file

## Prerequisites

- Node.js 14+ and npm (for package installation)
- Modern web browser with ES6+ support:
  - Chrome 90+ (released April 2021)
  - Firefox 88+ (released April 2021)
  - Safari 14+ (released September 2020)
  - Edge 90+ (released April 2021)
- Braze account with API key and SDK endpoint

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the project root with your Braze credentials:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your actual values
   # BRAZE_API_KEY=your-actual-api-key-here
   # BRAZE_SDK_ENDPOINT=https://sdk.iad-03.braze.com
   ```
   
   Then generate the config file:
   ```bash
   npm run load-env
   ```
   
   **Note:** The `.env` file is gitignored for security. Never commit it to version control.

3. **Start a local development server:**
   
   The application uses ES6 modules which require an HTTP server (not `file://` protocol). You can use any of these options:
   
   ```bash
   # Option 1: Using npm start (recommended - automatically loads env)
   npm start
   
   # Option 2: Using npx serve directly
   npx serve .
   
   # Option 3: Using Python
   python -m http.server 8000
   
   # Option 4: Using Node.js http-server
   npx http-server
   ```

4. **Open the application:**
   - Navigate to `http://localhost:3000` (or the port shown by your server)
   - The application will load in your browser

## Getting Your Braze Credentials

1. Log in to your [Braze Dashboard](https://dashboard.braze.com)
2. Navigate to **Settings** > **App Settings**
3. Find your **API Key** (App Identifier API Key)
4. Find your **SDK Endpoint** URL (e.g., `https://sdk.iad-01.braze.com`)

## Usage

### 1. Configure the SDK

The SDK is automatically configured from your `.env` file when you run `npm start` or `npm run load-env`.

**If using environment variables (recommended):**
- Configuration is loaded from `.env` file automatically
- The configuration form fields will be read-only and display your configured values
- To update configuration, edit `.env` and run `npm run load-env`

**Fallback mode (if .env not configured):**
- You can manually enter credentials in the "Configuration" section
- Credentials are saved to browser localStorage as a fallback
- Click "Initialize SDK" and wait for the "Initialized" status message

### 2. Set User Identity

- **Anonymous User**: Leave the User ID field empty (default)
- **Identified User**: Enter a User ID and click "Set User ID"
- **Clear User**: Click "Clear User (Anonymous)" to reset to anonymous

### 3. Trigger Custom Events

1. Enter an event name (e.g., "button_clicked")
2. Optionally add event properties as JSON (e.g., `{"button_id": "submit", "page": "home"}`)
3. Click "Trigger Custom Event"
4. Check the Event Log to see the event was sent

### 4. Log Purchase Events

1. Fill in the purchase form:
   - **Product ID**: Unique identifier for the product
   - **Price**: Product price (decimal number)
   - **Currency**: Currency code (e.g., USD, EUR)
   - **Quantity**: Number of items (minimum 1)
   - **Properties**: Optional JSON properties
2. Click "Log Purchase Event"
3. Check the Event Log to verify

### 5. Set User Attributes

1. Enter an attribute key (e.g., "favorite_color")
2. Select the attribute type:
   - **String**: Text value
   - **Number**: Numeric value
   - **Boolean**: true/false value
   - **Array**: JSON array (e.g., `["item1", "item2"]`)
3. Enter the attribute value
4. Click "Set User Attribute"
5. Check the Event Log to verify

### 6. View Event Log

- All events are displayed in real-time in the Event Log section
- Each entry shows:
  - Timestamp (ISO format)
  - Event type
  - Event data (JSON formatted)
- Click "Clear Logs" to remove all entries
- Log is limited to 100 entries (oldest removed automatically)

## Verifying Events in Braze Dashboard

1. Log in to your [Braze Dashboard](https://dashboard.braze.com)
2. Navigate to **Audience** > **Search Users**
3. Search for your User ID (or check anonymous users)
4. Click on the user profile
5. Navigate to the **Events** tab
6. Verify that events appear within 30 seconds of triggering

**Note:** Events may take a few seconds to appear in the dashboard. If events don't appear:
- Check the browser console for errors
- Verify your API key and endpoint are correct
- Check the Network tab in browser DevTools for API calls to Braze

## Troubleshooting

### "Failed to load module" error

**Cause:** Opening HTML file directly (file:// protocol) doesn't support ES6 modules

**Solution:** Use a local development server:
```bash
npx serve .
```

### CORS errors in browser console

**Cause:** Braze SDK making cross-origin requests

**Solution:** 
- Ensure you're using the correct endpoint URL from Braze dashboard
- Check browser console for specific CORS error details
- Verify the endpoint URL includes `https://`

### Events not appearing in Braze dashboard

**Cause:** Invalid API key, wrong endpoint, or network issues

**Solution:**
- Verify API key and endpoint in Braze dashboard (Settings > App Settings)
- Check Network tab for failed requests
- Wait up to 30 seconds for events to appear
- Check browser console for error messages

### SDK initialization fails silently

**Cause:** Invalid credentials or network error

**Solution:**
- Check browser console for detailed error messages
- Verify API key format (should be a string)
- Ensure endpoint URL is correct (should include https://)
- Check Network tab for failed API calls

### localStorage not persisting

**Cause:** Browser privacy settings, incognito mode, or storage quota exceeded

**Solution:**
- Check browser settings
- Try different browser
- Clear storage and retry
- Disable incognito/private mode

### Module not found error

**Cause:** @braze/web-sdk not installed or incorrect import path

**Solution:**
- Run `npm install`
- Verify `node_modules/@braze/web-sdk` exists
- Check import statement matches package structure
- Clear browser cache and reload

## Project Structure

```
Website test/
├── package.json          # NPM dependencies (@braze/web-sdk)
├── index.html            # Single-page application entry
├── app.js                # Main application logic and Braze integration
├── styles.css             # Application styling
├── README.md              # This file
├── .gitignore            # Exclude node_modules, .env files
└── node_modules/         # Dependencies (created after npm install)
```

## Browser Compatibility

This application requires modern browsers with ES6 module support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Internet Explorer is **not supported**.

## Security Notes

⚠️ **Important Security Considerations:**

- **API keys and endpoints are stored in browser localStorage (client-side only)**
  - localStorage is vulnerable to XSS (Cross-Site Scripting) attacks
  - If your application is compromised by XSS, attackers could steal your API keys
  - **Never use production API keys in this test application**
  - Use test/development API keys only
  
- **Never commit API keys to version control**
  - The `.gitignore` file excludes `.env` files
  - Always verify no credentials are in committed files
  
- **Production applications should use server-side configuration**
  - This test app is for development/testing only
  - Production apps should proxy Braze requests through your backend
  - API keys should never be exposed to client-side code in production
  
- **CSRF Protection**
  - This is a client-side only application
  - For production use, implement proper CSRF protection if adding server-side components

## License

MIT

## Support

For Braze SDK documentation, visit: https://www.braze.com/docs/developer_guide/sdk_integration?sdktab=web

For issues with this test application, check the browser console and Network tab for detailed error messages.
>>>>>>> 22c9f3e (Initial commit: Braze Web SDK test application with push notifications, content cards, and predefined events)
