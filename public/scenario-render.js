/**
 * Scenario rendering helpers
 */

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPersonaList(personas) {
  return `
    <div class="persona-grid">
      ${personas.map(p => `
        <div class="persona-card">
          <span class="persona-badge ${p.badge || ''}">${p.badge || 'user'}</span>
          <div>${escHtml(p.label)}</div>
          <small>${(p.events || []).length} event(s)${(p.purchases || []).length ? ', ' + p.purchases.length + ' purchase(s)' : ''}</small>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderResultsList(success, errors) {
  const items = [
    ...success.map(u => `
      <li class="scenario-result-item success">
        <span class="result-icon">✓</span>
        <span class="result-label">${escHtml(u.label)}</span>
        <span class="result-id">${escHtml(u.id)}</span>
      </li>
    `),
    ...errors.map(u => `
      <li class="scenario-result-item error">
        <span class="result-icon">✗</span>
        <span class="result-label">${escHtml(u.label)}</span>
        <span class="result-id">${escHtml(u.detail)}</span>
      </li>
    `)
  ];
  return `<ul class="scenario-result-list">${items.join('')}</ul>`;
}

export function renderSnowflakeSQL(prefix, traceId, firedAt) {
  const externalId = prefix + 'connectivity_test_user';
  return `
    <div class="sql-block">
      <h4>Find this event in Snowflake (Braze Currents)</h4>
      <p class="help-text" style="margin-bottom:8px;">Allow 5–30 minutes for Currents to deliver, then run:</p>
      <pre>-- Custom Events table (Braze Currents)
SELECT
  external_user_id,
  name AS event_name,
  PARSE_JSON(properties):trace_id::string AS trace_id,
  TO_TIMESTAMP(time) AS event_time
FROM BRAZE_CLOUD_PRODUCTION.CURRENTS.USERS_BEHAVIORS_CUSTOMEVENT
WHERE PARSE_JSON(properties):trace_id::string = '${escHtml(traceId)}'
  AND name = 'braze_connectivity_ping'
ORDER BY event_time DESC;</pre>
      <button type="button" class="btn-small" style="margin-bottom:16px;" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy SQL',2000)})">Copy SQL</button>

      <h4>Find in S3 (raw Currents files)</h4>
      <pre>aws s3 cp s3://YOUR-CURRENTS-BUCKET/ /tmp/currents/ \\
  --recursive --include "*.json"

grep -r '${escHtml(traceId)}' /tmp/currents/</pre>
      <button type="button" class="btn-small" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy CLI',2000)})">Copy CLI</button>

      <p class="help-text" style="margin-top:12px;">
        Event fired at: <strong>${escHtml(firedAt)}</strong><br>
        External ID: <code>${escHtml(externalId)}</code><br>
        trace_id: <code>${escHtml(traceId)}</code>
      </p>
    </div>
  `;
}

export function renderAnalyticsDemoInstructions(prefix, successCount, totalCount) {
  return `
    <div class="instructions-block status-info" style="display:block; margin-top:16px;">
      <h4>Next Steps: Build Analytics Reports in Braze</h4>
      <p class="help-text" style="margin-bottom:10px;">
        ${escHtml(String(successCount))} of ${escHtml(String(totalCount))} users seeded with prefix <code>${escHtml(prefix)}</code>.
        Allow 1–5 minutes for profiles to propagate before building segments or reports.
      </p>

      <h5 style="margin:14px 0 6px;">1. Create a Segment to Isolate These Users</h5>
      <ol>
        <li>Go to <strong>Audience → Segments → Create Segment</strong>.</li>
        <li>Name it <em>"Analytics Demo Users"</em>.</li>
        <li>Add filter: <strong>Custom Attribute</strong> → <code>demo_scenario</code> → <em>equals</em> → <code>analytics-demo</code>.</li>
        <li>Save. This segment is used as the entry audience for the Canvas below and as a filter in all reports.</li>
      </ol>
      <p class="help-text" style="margin-bottom:4px;">Optional sub-segments for per-tier or per-role demos:</p>
      <ul style="margin:0 0 10px 18px; font-size:13px;">
        <li><code>demo_cohort</code> = <code>high</code> / <code>medium</code> / <code>low</code> — engagement tiers</li>
        <li><code>role</code> = <code>Admin</code> or <code>Course Creator</code> — role-based targeting</li>
      </ul>

      <h5 style="margin:14px 0 6px;">2. Build &amp; Launch a Canvas</h5>
      <p class="help-text" style="margin-bottom:4px;"><em>The Funnel Report, Retention Report, Email Performance, and Heatmap are all accessed from within a Canvas or Campaign's analytics page — launch this first.</em></p>
      <ol>
        <li>Go to <strong>Messaging → Canvas → Create Canvas</strong>. Name it <em>"Analytics Demo — Onboarding Journey"</em>.</li>
        <li>Set <strong>Entry Audience</strong> to the <em>Analytics Demo Users</em> segment. Set entry to <strong>Once</strong>.</li>
        <li>Add a <strong>Message step</strong> → select <strong>Email</strong>. Build a simple email with at least one clickable link (use the Articulate template if available).</li>
        <li>Before launching, send a test email to these addresses via <strong>Send Test</strong> or an Internal Group:
          <ul>
            <li><code>andre.pereira+delivered@telusdigital.com</code> — receive, <em>do not open</em></li>
            <li><code>andre.pereira+open@telusdigital.com</code> — receive, <em>open but do not click</em></li>
            <li><code>andre.pereira+click@telusdigital.com</code> — receive, <em>open and click a link</em></li>
          </ul>
        </li>
        <li>Launch the Canvas. Wait <strong>30–60 minutes</strong> for engagement data to process before viewing reports.</li>
      </ol>
      <p class="help-text" style="margin-top:6px; margin-bottom:10px; padding:8px; background:rgba(245,158,11,0.1); border-left:3px solid #f59e0b; border-radius:3px;">
        <strong>Note:</strong> Email opens, clicks, heatmap, and deliverability data are generated by Braze's sending pipeline only — they cannot be seeded via <code>/users/track</code>. A real send is required.
      </p>

      <h5 style="margin:14px 0 6px;">3. Funnel Report — Full Authoring Journey</h5>
      <p class="help-text" style="margin-bottom:4px;"><em>Accessed from within the Canvas analytics page.</em></p>
      <ol>
        <li>Go to <strong>Messaging → Canvas → [your canvas] → Analytics</strong>.</li>
        <li>Click the <strong>Funnel Report</strong> tab.</li>
        <li>Add the following steps in order:
          <ol type="a">
            <li><strong>Custom Event</strong>: <code>account_created</code></li>
            <li><strong>Custom Event</strong>: <code>started_trial</code></li>
            <li><strong>Custom Event</strong>: <code>onboarding_completed</code></li>
            <li><strong>Custom Event</strong>: <code>created_course</code></li>
            <li><strong>Custom Event</strong>: <code>created_lesson</code></li>
            <li><strong>Custom Event</strong>: <code>created_block</code></li>
            <li><strong>Custom Event</strong>: <code>subscription_purchased</code></li>
          </ol>
        </li>
        <li>Set the date range and conversion window to <strong>90 days</strong>. Click <strong>Run</strong>.</li>
      </ol>
      <p class="help-text" style="margin-bottom:10px;">
        <strong>What to expect:</strong> All 17 high engagers complete all 7 steps. Medium engagers drop before <code>subscription_purchased</code>. Low engagers fall off after <code>created_course</code>.
      </p>

      <h5 style="margin:14px 0 6px;">4. Retention Report</h5>
      <p class="help-text" style="margin-bottom:4px;"><em>Accessed from within the Canvas analytics page.</em></p>
      <ol>
        <li>Stay on <strong>[your canvas] → Analytics</strong> and click the <strong>Retention Report</strong> tab.</li>
        <li>Set <strong>Retention Event</strong> to <strong>Custom Event</strong> → <code>app_session_started</code>.</li>
        <li>Set the date range to the past <strong>90 days</strong>. Click <strong>Run</strong>.</li>
      </ol>
      <p class="help-text" style="margin-bottom:10px;">
        <strong>What to expect:</strong> High engagers fire <code>app_session_started</code> across ~9 distinct days over 85 days → strong Day 7 / Day 14 / Day 30 retention. Medium engagers show a mid-curve drop-off. Low engagers retain only at Day 1–2.
      </p>

      <h5 style="margin:14px 0 6px;">5. Email Performance &amp; Heatmap</h5>
      <ol>
        <li>On <strong>[your canvas] → Analytics</strong>, click the <strong>Email Performance</strong> tab — shows deliveries, unique opens, unique clicks, and unsubscribes across the 3 test addresses.</li>
        <li>Click the <strong>Email Heatmap</strong> tab — shows which links in the email were clicked. Requires at least one click from <code>andre.pereira+click@telusdigital.com</code>.</li>
      </ol>

      <h5 style="margin:14px 0 6px;">6. Report Builder</h5>
      <p class="help-text" style="margin-bottom:4px;"><em>Builds custom cross-channel views combining canvas metrics with custom event data.</em></p>
      <ol>
        <li>Go to <strong>Analytics → Report Builder → Create New Report</strong>.</li>
        <li>Click <strong>Add Canvas/Campaign</strong> and select your canvas.</li>
        <li>Add metric columns:
          <ul>
            <li><em>Email Sends, Unique Opens, Unique Clicks, Unsubscribes</em></li>
            <li><strong>Custom Events</strong>: <code>created_course</code>, <code>created_lesson</code>, <code>created_block</code>, <code>subscription_purchased</code></li>
          </ul>
        </li>
        <li>Set date range to past <strong>90 days</strong>. Click <strong>Save &amp; Build Report</strong>.</li>
        <li>Optionally pin this report to a dashboard: <strong>Analytics → Dashboard Builder</strong>.</li>
      </ol>

      <h5 style="margin:14px 0 6px;">7. Additional Reports (no Canvas needed)</h5>
      <ul style="margin:0 0 10px 18px; font-size:13px; line-height:1.7;">
        <li><strong>Analytics → Overview</strong> — MAU/DAU and new users from the seeded historical session data</li>
        <li><strong>Analytics → Custom Events</strong> — select <code>started_trial</code>, <code>created_course</code>, <code>created_lesson</code>, or <code>created_block</code> to view event frequency over time; apply a <code>role = Admin</code> or <code>Course Creator</code> segment filter to compare behaviour by role</li>
        <li><strong>Analytics → Revenue</strong> — purchase data from high engagers ($49/mo or $199/yr) and medium engagers ($19/mo) will appear here automatically</li>
      </ul>
    </div>
  `;
}

export function renderInternalGroupInstructions(prefix, userIds) {
  const idList = userIds.map(id => escHtml(id)).join(', ');
  return `
    <div class="instructions-block status-info" style="display:block;">
      <h4>Next Steps: Add Users to a Braze Internal Group</h4>
      <ol>
        <li>In Braze Dashboard, go to <strong>Settings → Internal Groups</strong></li>
        <li>Create a new group (e.g. "API Tester QA") or open an existing one</li>
        <li>Click <strong>Add Users</strong> and paste these external_ids:</li>
      </ol>
      <div class="id-copy-block">${idList}</div>
      <button type="button" class="btn-small" style="margin-bottom:12px;" onclick="navigator.clipboard.writeText('${userIds.map(id => id.replace(/'/g, "\\'" )).join(', ')}').then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy IDs',2000)})">Copy IDs</button>
      <ol start="4">
        <li>Save the group, then send a test campaign/canvas to these users</li>
        <li>Go to <strong>Message Activity Log</strong> and filter by external_id to see per-message delivery logs</li>
      </ol>
      <p class="help-text" style="margin-top:8px;">
        All users have <code>is_test_user: true</code> — useful for building a segment that permanently excludes or targets test accounts.
      </p>
    </div>
  `;
}
