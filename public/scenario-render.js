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
