# Braze API Tester

A comprehensive REST API testing tool for Braze - enabling quick API testing and PoC building without SDK integration.

## Features

- ✅ **REST API Testing**: Test all Braze REST API endpoints
- ✅ **Pre-built Templates**: Phase 1 & 2 templates for common PoC scenarios
- ✅ **Request Builder**: Build custom requests with JSON editor
- ✅ **Response Viewer**: Formatted JSON response display with status codes
- ✅ **Request History**: Track and replay previous requests
- ✅ **Rate Limit Monitoring**: Real-time rate limit status display
- ✅ **Multi-Instance Support**: Works with all Braze instances (US, EU, AU, ID)
- ✅ **CORS-Free**: Express backend proxy eliminates CORS issues

## Supported Endpoints

The following endpoints are supported with pre-built templates:

### Phase 1 Endpoints (MVP)

1. **User Data**
   - `/users/track` - Track user events
   - `/users/export/ids` - Export users by external IDs

2. **Campaigns**
   - `/campaigns/trigger/send` - Trigger campaigns

3. **Canvases**
   - `/canvas/trigger/send` - Trigger Canvases

4. **Segments**
   - `/segments/list` - List all segments

### Phase 2 Endpoints

5. **Messages**
   - `/messages/send` - Send messages (email, push, SMS, etc.)

6. **User Data (Additional)**
   - `/users/identify` - Identify anonymous users
   - `/users/merge` - Merge two user profiles

7. **Campaigns (Additional)**
   - `/campaigns/list` - List all campaigns

8. **Canvases (Additional)**
   - `/canvas/list` - List all Canvases

## Prerequisites

- Node.js 14+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Braze account with REST API Key

## Setup

1. **Install dependencies:**
   ```bash
   cd tools/braze-api-tester
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the project root:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your actual values
   # BRAZE_REST_API_KEY=your-actual-rest-api-key-here
   # BRAZE_REST_ENDPOINT=https://rest.iad-03.braze.com
   ```
   
   Then generate the config file:
   ```bash
   npm run load-env
   ```
   
   **Note:** The `.env` file is gitignored for security. Never commit it to version control.

3. **Start the server:**
   ```bash
   npm start
   ```
   
   The server will start on `http://localhost:3000` (or the port specified in `.env`)

4. **Open the application:**
   - Navigate to `http://localhost:3000` in your browser
   - The application will load automatically

## Getting Your Braze Credentials

1. Log in to your [Braze Dashboard](https://dashboard.braze.com)
2. Navigate to **Settings** > **API Keys**
3. Find your **REST API Key** (not the SDK API Key)
4. Determine your **REST Endpoint** based on your Braze instance:
   - **US instances**: `https://rest.iad-01.braze.com` through `https://rest.iad-10.braze.com`
   - **EU instances**: `https://rest.fra-01.braze.com`, `https://rest.fra-02.braze.com`
   - **AU instance**: `https://rest.syd-01.braze.com`
   - **ID instance**: `https://rest.jak-01.braze.com`

## Usage

### 1. Configure API Credentials

The tool loads credentials from your `.env` file automatically. If not configured, you can:

- Enter your **REST API Key** in the Configuration section
- Select your **REST Endpoint** from the dropdown (or enter a custom endpoint)
- Click **Test Connection** to verify your credentials

### 2. Use Pre-built Templates

1. Select a template from the **Pre-built Templates** dropdown
2. The form will auto-fill with the endpoint, method, and sample request body
3. Modify the request body as needed for your use case
4. Click **Send Request** to execute

### 3. Build Custom Requests

1. Select the **HTTP Method** (GET, POST, PUT, PATCH, DELETE)
2. Enter the **Endpoint Path** (e.g., `/users/track`)
3. For POST/PUT/PATCH requests, enter the **Request Body** as JSON
4. Click **Format JSON** to validate and format your JSON
5. Click **Send Request** to execute

### 4. View Responses

- **Status Code**: Color-coded status (green for success, yellow for redirects, red for errors)
- **Response Time**: Time taken for the request in milliseconds
- **Response Body**: Formatted JSON response
- **Copy Response**: Click to copy the response to clipboard

### 5. Request History

- All requests are automatically logged in the **Request History** section
- Click **Replay** to re-execute a previous request
- Click **View** to see the full request/response details
- Click **Clear** to remove all history

### 6. Rate Limit Monitoring

- The **Rate Limit Status** section shows:
  - **Limit**: Maximum requests allowed per window
  - **Remaining**: Requests remaining in current window
  - **Reset**: Time when the rate limit resets
- Status updates automatically after each request

## Example Use Cases

### Track a User Event

1. Select template: **Track User Event (/users/track)**
2. Modify the `external_id` and `name` fields
3. Add custom properties as needed
4. Click **Send Request**

### Trigger a Campaign

1. Select template: **Trigger Campaign (/campaigns/trigger/send)**
2. Replace `your-campaign-id-here` with your actual campaign ID
3. Update `external_user_id` with the target user
4. Add trigger properties if needed
5. Click **Send Request**

### Export User Data

1. Select template: **Export Users by IDs (/users/export/ids)**
2. Update the `external_ids` array with your user IDs
3. Modify `fields_to_export` as needed
4. Click **Send Request**
5. Note: Export requests are asynchronous - check the response for export status

### Send a Message

1. Select template: **Send Messages (/messages/send)**
2. Update `external_user_ids` with target user IDs
3. Replace `your-app-id-here` with your Braze App ID
4. Customize the message content (subject, body, etc.)
5. Modify message type if needed (email, push, SMS, etc.)
6. Click **Send Request**

### Identify an Anonymous User

1. Select template: **Identify Users (/users/identify)**
2. Update `external_id` with the user's external ID
3. Set `alias_name` and `alias_label` to match your user alias configuration
4. Click **Send Request**

### Merge User Profiles

1. Select template: **Merge Users (/users/merge)**
2. Set `identifier_to_merge` - the user profile to merge FROM
3. Set `identifier_to_keep` - the user profile to merge TO (this one will be kept)
4. Click **Send Request**
5. **Warning**: This operation is irreversible. The merged profile will be deleted.

### List Campaigns

1. Select template: **List Campaigns (/campaigns/list)**
2. This is a GET request, so no body is needed
3. Optionally add query parameters to the endpoint (e.g., `?page=0&include_archived=true`)
4. Click **Send Request**

### List Canvases

1. Select template: **List Canvases (/canvas/list)**
2. This is a GET request, so no body is needed
3. Optionally add query parameters to the endpoint (e.g., `?page=0&include_archived=true`)
4. Click **Send Request**

## API Endpoints Reference

### User Data Endpoints

- **POST `/users/track`**: Track user events, purchases, and attributes
- **POST `/users/export/ids`**: Export user data by external IDs
- **POST `/users/identify`**: Identify anonymous users
- **POST `/users/merge`**: Merge two user profiles
- **POST `/users/delete`**: Delete user data

### Campaign Endpoints

- **POST `/campaigns/trigger/send`**: Trigger a campaign send
- **GET `/campaigns/list`**: List all campaigns
- **GET `/campaigns/details`**: Get campaign details

### Canvas Endpoints

- **POST `/canvas/trigger/send`**: Trigger a Canvas send
- **GET `/canvas/list`**: List all Canvases
- **GET `/canvas/details`**: Get Canvas details

### Segment Endpoints

- **GET `/segments/list`**: List all segments
- **GET `/segments/details`**: Get segment details

### Message Endpoints

- **POST `/messages/send`**: Send messages (email, push, SMS, in-app, webhook, etc.)

For complete API documentation, visit: [Braze REST API Documentation](https://www.braze.com/docs/api/endpoints/)

## Troubleshooting

### "Connection failed" error

**Cause:** Invalid API key, wrong endpoint, or network issues

**Solution:**
- Verify REST API Key in Braze Dashboard (Settings > API Keys)
- Ensure you're using the REST API Key (not SDK API Key)
- Check that the endpoint matches your Braze instance
- Verify network connectivity

### "CORS error" in browser console

**Cause:** This shouldn't happen as requests are proxied through the Express server

**Solution:**
- Ensure the Express server is running (`npm start`)
- Check that you're accessing the app via `http://localhost:3000` (not file://)
- Verify the server is proxying requests correctly

### Rate limit exceeded

**Cause:** Too many requests sent in a short time period

**Solution:**
- Check the Rate Limit Status section
- Wait for the reset time before sending more requests
- Reduce request frequency
- Consider using batch endpoints when possible

### Invalid JSON error

**Cause:** Malformed JSON in request body

**Solution:**
- Click **Format JSON** to validate and format
- Ensure all strings are properly quoted
- Check for trailing commas
- Verify JSON syntax matches the API requirements

### 401 Unauthorized

**Cause:** Invalid or missing REST API Key

**Solution:**
- Verify API key is correct in `.env` or Configuration section
- Ensure you're using the REST API Key (not SDK API Key)
- Check that the API key hasn't been revoked in Braze Dashboard

### 403 Forbidden

**Cause:** API key doesn't have required permissions

**Solution:**
- Check API key permissions in Braze Dashboard
- Ensure the key has access to the endpoint you're trying to use
- Contact your Braze administrator if needed

## Project Structure

```
tools/braze-api-tester/
├── package.json          # NPM dependencies and scripts
├── .env.example          # Example environment variables
├── .env                  # Your actual credentials (gitignored)
├── load-env.js           # Script to generate config.js from .env
├── server.js             # Express backend server (API proxy)
├── public/
│   ├── index.html        # Main UI
│   ├── app.js            # Frontend application logic
│   ├── styles.css        # Application styling
│   └── config.js         # Auto-generated config (from .env)
├── README.md             # This file
└── .gitignore           # Exclude node_modules, .env files
```

## Security Notes

⚠️ **Important Security Considerations:**

- **API keys are stored in `.env` file (server-side)**
  - The `.env` file is gitignored and should never be committed
  - API keys can also be entered in the UI (stored in browser memory only)
  
- **Never commit API keys to version control**
  - Always verify `.gitignore` includes `.env`
  - Check that no credentials are in committed files
  
- **Use test/development API keys only**
  - This tool is for development/testing purposes
  - Never use production API keys in testing tools
  
- **Rate limiting**
  - Be mindful of rate limits when testing
  - The tool displays rate limit status to help prevent exceeding limits

## Development

### Running in Development Mode

```bash
npm start
```

The server will:
- Load environment variables from `.env`
- Generate `public/config.js` automatically
- Start Express server on port 3000 (or PORT from .env)
- Serve static files from `public/` directory

### Adding New Templates

Edit `public/app.js` and add new templates to the `templates` object:

```javascript
const templates = {
    'my-new-template': {
        method: 'POST',
        endpoint: '/my/endpoint',
        body: {
            // Your template body
        }
    }
};
```

Then add the option to the template select dropdown in `index.html`.

## License

MIT

## Support

For Braze REST API documentation, visit: https://www.braze.com/docs/api/

For issues with this tool:
- Check the browser console for errors
- Verify server logs for backend errors
- Ensure all dependencies are installed (`npm install`)
- Check that `.env` file is properly configured
