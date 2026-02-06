# Braze Web SDK Test Application

A simple website application to test Braze Web SDK integration by simulating user interactions and observing data flow into your Braze workspace.

## Features

- ✅ **SDK Configuration**: Easy setup with API key and endpoint
- ✅ **User Management**: Support for both anonymous and identified user tracking
- ✅ **In-App Messages (Modal)**: Display Braze in-app messages as modals, triggered by custom events and campaigns
- ✅ **Custom Events**: Trigger custom events with optional properties
- ✅ **Purchase Events**: Simulate purchase events with product data
- ✅ **User Attributes**: Set custom user attributes (string, number, boolean, array)
- ✅ **Feature Flags**: Remotely control promo link and live chat visibility (see [Feature Flags](#feature-flags) and [Braze setup](#braze-feature-flag-setup))
- ✅ **Event Logging**: Real-time event log display with timestamps (always visible, auto-scrolls)
- ✅ **Environment Configuration**: Secure configuration via `.env` file
- ✅ **Dashboard layout**: Sidebar navigation, single-screen panels, persistent Event Log strip

## Interface (Dashboard layout)

The app uses a **dashboard-style layout** so features stay visible in one screen:

- **Sidebar (left)**: Navigation to switch between Configuration, User, Events, Purchases, Attributes, Feature Flags, Push, Content Cards, and In-App. SDK status is shown at the bottom of the sidebar.
- **Main area**: One panel at a time; the URL hash updates (e.g. `#events`) so you can bookmark or refresh and stay on the same section.
- **Event Log (bottom)**: Always visible in a strip. Use **Clear** to clear logs and **▼ Collapse** / **▲ Expand** to show or hide the log body. The log automatically scrolls to show new messages as they appear.

On small screens, the sidebar wraps to a horizontal nav at the top.

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
   
   The application uses ES modules and the Braze SDK; use Vite so dependencies resolve correctly:
   
   ```bash
   # Recommended: Vite dev server (resolves @braze/web-sdk)
   npm run dev
   ```
   
   Then open http://localhost:5173 (or the URL Vite prints).
   
   For a production build (e.g. to deploy to Vercel):
   ```bash
   npm run build
   ```
   Output is in `dist/`. Use `npm run preview` to serve `dist/` locally.  
   **Vercel:** Set the project root to this folder; `vercel.json` configures build and output directory.

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

### 3. In-App Messages (Modal)

In-app messages from Braze are shown as modals when a campaign is triggered by a custom event:

1. In Braze Dashboard, create a **Campaign** or **Canvas** with an in-app message.
2. Set the **trigger** to **Custom Event** (e.g. `button_click`, `add_to_cart`).
3. Choose **Modal** as the message type and design your message.
4. In this app, trigger the same custom event (e.g. click "Button Click" under Custom Events).
5. The modal will appear when Braze delivers the message. Check the Event Log for "In-app message received".

The SDK subscribes to in-app messages before opening a session and displays them via `showInAppMessage`, so no extra code is required after initialization.

### 4. Trigger Custom Events

1. Enter an event name (e.g., "button_clicked")
2. Optionally add event properties as JSON (e.g., `{"button_id": "submit", "page": "home"}`)
3. Click "Trigger Custom Event"
4. Check the Event Log to see the event was sent

### 5. Log Purchase Events

1. Fill in the purchase form:
   - **Product ID**: Unique identifier for the product
   - **Price**: Product price (decimal number)
   - **Currency**: Currency code (e.g., USD, EUR)
   - **Quantity**: Number of items (minimum 1)
   - **Properties**: Optional JSON properties
2. Click "Log Purchase Event"
3. Check the Event Log to verify

### 6. Set User Attributes

1. Enter an attribute key (e.g., "favorite_color")
2. Select the attribute type:
   - **String**: Text value
   - **Number**: Numeric value
   - **Boolean**: true/false value
   - **Array**: JSON array (e.g., `["item1", "item2"]`)
3. Enter the attribute value
4. Click "Set User Attribute"
5. Check the Event Log to verify

### 7. Feature Flags

Two feature flags are wired in this app so you can test [Braze feature flags](https://www.braze.com/docs/developer_guide/feature_flags/#remotely-control-app-variables) without redeploying:

1. **Navigation promo link** (`navigation_promo_link`) – Remotely control a promo link’s text and URL (e.g. “Black Friday” → `/sales`). When the flag is enabled and has `text` and `link` properties, the app shows the link in the Feature Flags section.
2. **Live chat** (`enable_live_chat`) – Simple on/off for a “Start Live Chat” button. Use it to test gradual rollouts (e.g. 10% of users).

After creating the flags in Braze (see [Braze Feature Flag Setup](#braze-feature-flag-setup)), initialize the SDK, optionally set a User ID, then click **Refresh Feature Flags**. The promo link and/or live chat button appear when the flags are enabled for the current user.

### 8. View Event Log

- The Event Log is **always visible** at the bottom of the screen (dashboard layout).
- All events are displayed in real-time; the log **auto-scrolls** to show new messages as they appear.
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

## Braze Feature Flag Setup

To use the Feature Flags section in this app, create the following feature flags in your Braze workspace. Feature flags require **Web SDK 4.6.0+** and are available in Braze under **Feature Flags** (or **Engagement** → **Feature Flags** depending on your Braze version).

### 1. Navigation promo link (remotely control link text and URL)

| Field | Value |
|-------|--------|
| **Name** | Navigation Promo Link (or any name) |
| **Feature Flag ID** | `navigation_promo_link` **(must match exactly)** |
| **Rollout** | Set to a percentage (e.g. 100% for all users, or 10% for testing) |

**Initial properties** (add in the feature flag’s property list):

| Property key | Type | Example value |
|-------------|------|----------------|
| `text` | String | `Black Friday Deals` |
| `link` | String | `https://yoursite.com/sales` or `/sales` |

- When **enabled** and both `text` and `link` are set, the app shows a promo link in the Feature Flags section.
- Change `text` and `link` in the Braze dashboard anytime; after you click **Refresh Feature Flags** in the app (or on next session), the new values appear.

### 2. Live chat (on/off for gradual rollout)

| Field | Value |
|-------|--------|
| **Name** | Enable Live Chat (or any name) |
| **Feature Flag ID** | `enable_live_chat` **(must match exactly)** |
| **Rollout** | Set to a percentage (e.g. 100% or 10% for a gradual rollout) |

- No properties are required. When the flag is **enabled**, the app shows a “Start Live Chat” button; when **disabled**, the button is hidden.
- Use Braze segments or rollout % to control who sees the button.

### Quick checklist

1. In Braze: **Feature Flags** (or **Engagement** → **Feature Flags**) → **Create Feature Flag**.
2. Create **navigation_promo_link**: add properties `text` (string) and `link` (string), set rollout %.
3. Create **enable_live_chat**: no properties, set rollout %.
4. In the test app: initialize the SDK, optionally set a User ID, then click **Refresh Feature Flags**.
5. Confirm the status line under the Feature Flags section shows “Promo: …” and/or “Live Chat: on/off”.

Feature flag limits depend on your Braze plan (e.g. free tier: 10 active feature flags per workspace). See [Braze Feature Flags](https://www.braze.com/docs/developer_guide/feature_flags/#remotely-control-app-variables) for details.

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
