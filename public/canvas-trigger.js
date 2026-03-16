/**
 * Canvas Trigger — fetch canvas list, render picker, trigger sends
 */
import { escHtml } from './scenario-render.js';

const API_BASE = '/api';
const BATCH_SIZE = 50;

async function proxyCall(method, endpoint, body, apiKey, restEndpoint) {
  const res = await fetch(`${API_BASE}/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, endpoint, body, apiKey, restEndpoint }),
  });
  return res.json();
}

export async function fetchCanvasList(apiKey, restEndpoint) {
  const canvases = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await proxyCall(
      'GET',
      `/canvas/list?page=${page}&include_archived=false&sort_direction=desc`,
      null, apiKey, restEndpoint,
    );
    if (data.status !== 200 || !data.data?.canvases) {
      if (canvases.length === 0) {
        throw new Error(data.data?.message || `Failed to fetch canvases (${data.status})`);
      }
      break;
    }
    canvases.push(...data.data.canvases);
    hasMore = data.data.canvases.length === 100;
    page++;
  }

  return canvases;
}

export async function fetchCanvasDetails(canvasId, apiKey, restEndpoint) {
  const data = await proxyCall(
    'GET',
    `/canvas/details?canvas_id=${encodeURIComponent(canvasId)}`,
    null, apiKey, restEndpoint,
  );
  if (data.status !== 200) {
    throw new Error(data.data?.message || `Failed to fetch canvas details (${data.status})`);
  }
  return data.data;
}

export async function triggerCanvasSend(canvasId, externalIds, entryProperties, apiKey, restEndpoint, onProgress) {
  const results = { sent: 0, failed: 0, errors: [] };
  const batches = [];

  for (let i = 0; i < externalIds.length; i += BATCH_SIZE) {
    batches.push(externalIds.slice(i, i + BATCH_SIZE));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const recipients = batch.map(id => ({ external_user_id: id }));

    const body = { canvas_id: canvasId, recipients };
    if (entryProperties && Object.keys(entryProperties).length > 0) {
      body.canvas_entry_properties = entryProperties;
    }

    const data = await proxyCall('POST', '/canvas/trigger/send', body, apiKey, restEndpoint);

    if (data.status >= 200 && data.status < 300) {
      results.sent += batch.length;
    } else {
      results.failed += batch.length;
      results.errors.push({
        batch: bi + 1,
        status: data.status,
        message: data.data?.message || data.data?.errors?.join(', ') || data.statusText,
      });
    }

    if (onProgress) {
      onProgress(Math.min((bi + 1) * BATCH_SIZE, externalIds.length), externalIds.length);
    }
  }

  return results;
}

// ── Standalone panel ────────────────────────────────────────────────────────

export function initCanvasTriggerPanel(container, apiKeyInput, endpointSelect) {
  let canvases = [];
  let selectedCanvas = null;

  container.innerHTML = `
    <div class="canvas-trigger-layout">
      <div class="canvas-trigger-list">
        <div class="canvas-trigger-list-header">
          <input type="text" class="scenario-search ct-search" placeholder="Search canvases...">
          <button type="button" class="btn-small btn-primary ct-refresh">Refresh</button>
        </div>
        <div class="ct-list-items">
          <p class="help-text" style="padding:12px;">Click "Refresh" to load your canvases.</p>
        </div>
      </div>
      <div class="canvas-trigger-detail">
        <div style="padding:24px; text-align:center;">
          <p class="help-text">Select a canvas from the list to configure and trigger a send.</p>
          <p class="help-text" style="margin-top:12px;">Don't have a Canvas yet? <a href="/guide.html#build-canvas" target="_blank" rel="noopener" style="color:var(--primary-color);text-decoration:underline;">Follow the step-by-step guide</a> to build one from scratch.</p>
        </div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('.ct-search');
  const refreshBtn = container.querySelector('.ct-refresh');
  const listItemsEl = container.querySelector('.ct-list-items');
  const detailEl = container.querySelector('.canvas-trigger-detail');

  refreshBtn.addEventListener('click', loadCanvases);
  searchInput.addEventListener('input', () => renderList(searchInput.value));

  async function loadCanvases() {
    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;
    if (!apiKey) {
      listItemsEl.innerHTML = '<p class="help-text" style="padding:12px;color:var(--error-color);">Enter your REST API Key in the Configuration section first.</p>';
      return;
    }

    listItemsEl.innerHTML = '<p class="help-text" style="padding:12px;">Loading canvases...</p>';
    try {
      canvases = await fetchCanvasList(apiKey, restEndpoint);
      renderList(searchInput.value);
    } catch (err) {
      listItemsEl.innerHTML = `<p class="help-text" style="padding:12px;color:var(--error-color);">${escHtml(err.message)}</p>`;
    }
  }

  function renderList(filter = '') {
    const lower = filter.toLowerCase();
    const filtered = lower
      ? canvases.filter(c => c.name.toLowerCase().includes(lower) || (c.tags || []).some(t => t.toLowerCase().includes(lower)))
      : canvases;

    if (filtered.length === 0) {
      listItemsEl.innerHTML = '<p class="help-text" style="padding:12px;">No canvases found.</p>';
      return;
    }

    listItemsEl.innerHTML = filtered.map(c => {
      const active = selectedCanvas && selectedCanvas.id === c.id ? ' active' : '';
      const edited = c.last_edited ? new Date(c.last_edited).toLocaleDateString() : '';
      const tags = (c.tags || []).slice(0, 3).map(t => `<span class="ct-tag">${escHtml(t)}</span>`).join('');
      return `
        <div class="scenario-list-item ct-list-item${active}" data-id="${escHtml(c.id)}">
          <span class="scenario-list-name">${escHtml(c.name)}</span>
          <span class="scenario-list-meta">${edited} ${tags}</span>
        </div>
      `;
    }).join('');

    listItemsEl.querySelectorAll('.ct-list-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedCanvas = canvases.find(c => c.id === el.dataset.id);
        renderList(searchInput.value);
        renderDetail();
      });
    });
  }

  async function renderDetail() {
    if (!selectedCanvas) return;
    const c = selectedCanvas;
    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;

    detailEl.innerHTML = `
      <div class="ct-detail-content">
        <h3 style="color:var(--secondary-color);margin-bottom:4px;">${escHtml(c.name)}</h3>
        <p class="help-text" style="margin-bottom:12px;">
          ID: <code>${escHtml(c.id)}</code>
          ${c.last_edited ? ` | Edited: ${new Date(c.last_edited).toLocaleDateString()}` : ''}
          ${(c.tags || []).length ? ` | Tags: ${c.tags.join(', ')}` : ''}
        </p>
        <div class="ct-details-panel">
          <p class="help-text">Loading canvas details...</p>
        </div>
        <div class="ct-form" style="display:none;">
          <div class="form-group">
            <label>Recipients (one external_id per line) *</label>
            <textarea class="ct-recipients" rows="6" placeholder="sim_user_1&#10;sim_user_2&#10;sim_user_3"></textarea>
            <small class="help-text">Enter the external_ids of users who should enter this Canvas.</small>
          </div>
          <div class="form-group">
            <label>Canvas Entry Properties (JSON, optional)</label>
            <textarea class="ct-entry-props" rows="3" spellcheck="false" placeholder='{"source": "api-tester"}'>{}</textarea>
          </div>
          <div class="button-group">
            <button type="button" class="btn-primary ct-trigger-btn">Trigger Canvas Send</button>
          </div>
          <div class="ct-progress" style="display:none;">
            <div class="scenario-progress-bar"><div class="ct-progress-fill scenario-progress-fill"></div></div>
            <p class="ct-progress-label help-text" style="margin-top:6px;"></p>
          </div>
          <div class="ct-result" style="display:none;"></div>
        </div>
      </div>
    `;

    const detailsPanel = detailEl.querySelector('.ct-details-panel');
    const formEl = detailEl.querySelector('.ct-form');

    if (apiKey) {
      try {
        const details = await fetchCanvasDetails(c.id, apiKey, restEndpoint);
        detailsPanel.innerHTML = renderCanvasDetailsHtml(details);
      } catch (err) {
        detailsPanel.innerHTML = `<p class="help-text" style="color:var(--text-muted);font-style:italic;">Could not load details: ${escHtml(err.message)}</p>`;
      }
    } else {
      detailsPanel.innerHTML = `<p class="help-text" style="color:var(--text-muted);font-style:italic;">Enter an API key to load canvas details.</p>`;
    }

    formEl.style.display = '';
    detailEl.querySelector('.ct-trigger-btn').addEventListener('click', () => fireTrigger());
  }

  function renderCanvasDetailsHtml(d) {
    const created = d.created_at ? new Date(d.created_at).toLocaleDateString() : '—';
    const updated = d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '—';
    const firstEntry = d.first_entry ? new Date(d.first_entry).toLocaleDateString() : '—';
    const lastEntry = d.last_entry ? new Date(d.last_entry).toLocaleDateString() : '—';

    const schedule = d.schedule_type || d.entry_schedule || '—';
    const draft = d.draft === true;
    const archived = d.archived === true;

    let statusLabel = 'Active';
    let statusClass = 'badge-active';
    if (archived) { statusLabel = 'Archived'; statusClass = 'badge-archived'; }
    else if (draft) { statusLabel = 'Draft'; statusClass = 'badge-draft'; }

    const tags = (d.tags || []).map(t => `<span class="ct-tag">${escHtml(t)}</span>`).join(' ');

    const steps = d.steps || [];
    const stepCount = steps.length;
    const channels = [...new Set(steps.flatMap(s => {
      if (s.channels) return Object.keys(s.channels);
      if (s.type === 'message' && s.messages) return Object.keys(s.messages);
      return [];
    }))];

    const variants = d.variants || [];
    const variantCount = variants.length;

    let stepsHtml = '';
    if (steps.length > 0) {
      stepsHtml = `
        <div class="ct-details-steps">
          <strong>Steps (${stepCount})</strong>
          <ul>${steps.slice(0, 10).map(s => {
            const type = s.type || '—';
            const name = s.name || '';
            const chans = s.channels ? Object.keys(s.channels).join(', ') : (s.messages ? Object.keys(s.messages).join(', ') : '');
            return `<li><code>${escHtml(type)}</code>${name ? ' — ' + escHtml(name) : ''}${chans ? ' <span class="ct-tag">' + escHtml(chans) + '</span>' : ''}</li>`;
          }).join('')}${steps.length > 10 ? `<li class="help-text">...and ${steps.length - 10} more</li>` : ''}</ul>
        </div>`;
    }

    return `
      <div class="ct-details-grid">
        <div class="ct-details-row">
          <span class="ct-details-label">Status</span>
          <span class="ct-details-value"><span class="ct-status-badge ${statusClass}">${statusLabel}</span></span>
        </div>
        <div class="ct-details-row">
          <span class="ct-details-label">Entry Schedule</span>
          <span class="ct-details-value"><code>${escHtml(String(schedule))}</code></span>
        </div>
        <div class="ct-details-row">
          <span class="ct-details-label">Created</span>
          <span class="ct-details-value">${created}</span>
        </div>
        <div class="ct-details-row">
          <span class="ct-details-label">Last Updated</span>
          <span class="ct-details-value">${updated}</span>
        </div>
        <div class="ct-details-row">
          <span class="ct-details-label">First / Last Entry</span>
          <span class="ct-details-value">${firstEntry} / ${lastEntry}</span>
        </div>
        ${channels.length ? `<div class="ct-details-row">
          <span class="ct-details-label">Channels</span>
          <span class="ct-details-value">${channels.map(ch => `<span class="ct-tag">${escHtml(ch)}</span>`).join(' ')}</span>
        </div>` : ''}
        ${tags ? `<div class="ct-details-row">
          <span class="ct-details-label">Tags</span>
          <span class="ct-details-value">${tags}</span>
        </div>` : ''}
        ${variantCount > 1 ? `<div class="ct-details-row">
          <span class="ct-details-label">Variants</span>
          <span class="ct-details-value">${variantCount}</span>
        </div>` : ''}
        ${d.description ? `<div class="ct-details-row">
          <span class="ct-details-label">Description</span>
          <span class="ct-details-value">${escHtml(d.description)}</span>
        </div>` : ''}
      </div>
      ${stepsHtml}
    `;
  }

  async function fireTrigger() {
    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;
    if (!apiKey) { alert('Enter your REST API Key in the Configuration section.'); return; }

    const recipientsText = detailEl.querySelector('.ct-recipients').value.trim();
    const externalIds = recipientsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (externalIds.length === 0) { alert('Enter at least one external_id.'); return; }

    let entryProps = {};
    try {
      const raw = detailEl.querySelector('.ct-entry-props').value.trim();
      if (raw) entryProps = JSON.parse(raw);
    } catch (e) {
      alert('Invalid JSON in entry properties: ' + e.message);
      return;
    }

    const triggerBtn = detailEl.querySelector('.ct-trigger-btn');
    const progressWrap = detailEl.querySelector('.ct-progress');
    const progressFill = detailEl.querySelector('.ct-progress-fill');
    const progressLabel = detailEl.querySelector('.ct-progress-label');
    const resultEl = detailEl.querySelector('.ct-result');

    triggerBtn.disabled = true;
    progressFill.style.width = '0%';
    progressLabel.textContent = 'Sending...';
    progressWrap.style.display = 'block';
    resultEl.style.display = 'none';

    try {
      const results = await triggerCanvasSend(
        selectedCanvas.id, externalIds, entryProps, apiKey, restEndpoint,
        (current, total) => {
          const pct = Math.round((current / total) * 100);
          progressFill.style.width = pct + '%';
          progressLabel.textContent = `${current} of ${total} recipients processed...`;
        },
      );

      const hasErrors = results.errors.length > 0;
      const cls = hasErrors ? (results.sent > 0 ? 'status-warning' : 'status-error') : 'status-success';
      let html = `<p class="scenario-summary status-message ${cls}" style="display:block;margin-bottom:10px;">
        ${results.sent} recipient(s) triggered${hasErrors ? `, ${results.failed} failed` : ''}.
      </p>`;

      if (hasErrors) {
        html += '<ul class="scenario-result-list">';
        for (const err of results.errors) {
          html += `<li class="scenario-result-item error">
            <span class="result-icon">✗</span>
            <span class="result-label">Batch ${err.batch}: ${escHtml(err.message)}</span>
            <span class="result-id">${err.status}</span>
          </li>`;
        }
        html += '</ul>';
      }

      progressLabel.textContent = `Done — ${results.sent} of ${externalIds.length} triggered.`;
      resultEl.innerHTML = html;
      resultEl.style.display = 'block';
    } catch (err) {
      progressLabel.textContent = 'Error: ' + err.message;
    } finally {
      triggerBtn.disabled = false;
    }
  }
}

// ── Post-scenario trigger (embedded in results) ────────────────────────────

export function renderPostRunCanvasTrigger(container, externalIds, apiKeyInput, endpointSelect) {
  const section = document.createElement('div');
  section.className = 'canvas-post-run';
  section.innerHTML = `
    <details class="ct-post-run-details">
      <summary class="ct-post-run-summary">Trigger Canvas for these ${externalIds.length} users</summary>
      <div class="ct-post-run-body">
        <p class="help-text" style="margin-bottom:10px;">Select a Canvas to trigger for the users above. <a href="/guide.html#build-canvas" target="_blank" rel="noopener" style="color:var(--primary-color);text-decoration:underline;">Need to build a Canvas first?</a></p>
        <div class="ct-post-run-picker">
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
              <label>Canvas</label>
              <select class="ct-pr-canvas-select" style="width:100%;">
                <option value="">-- Click "Load" to fetch canvases --</option>
              </select>
            </div>
            <button type="button" class="btn-small btn-secondary ct-pr-load">Load Canvases</button>
          </div>
        </div>
        <div class="form-group" style="margin-top:10px;">
          <label>Canvas Entry Properties (JSON, optional)</label>
          <textarea class="ct-pr-entry-props" rows="2" spellcheck="false" placeholder='{"source": "api-tester"}'>{}</textarea>
        </div>
        <div class="button-group" style="margin-top:8px;">
          <button type="button" class="btn-primary btn-small ct-pr-trigger" disabled>Trigger Canvas</button>
        </div>
        <div class="ct-pr-progress" style="display:none;margin-top:10px;">
          <div class="scenario-progress-bar"><div class="ct-pr-progress-fill scenario-progress-fill"></div></div>
          <p class="ct-pr-progress-label help-text" style="margin-top:6px;"></p>
        </div>
        <div class="ct-pr-result" style="display:none;margin-top:10px;"></div>
      </div>
    </details>
  `;

  container.appendChild(section);

  const selectEl = section.querySelector('.ct-pr-canvas-select');
  const loadBtn = section.querySelector('.ct-pr-load');
  const triggerBtn = section.querySelector('.ct-pr-trigger');
  let canvases = [];

  loadBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;
    if (!apiKey) { alert('Enter your REST API Key first.'); return; }

    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';
    try {
      canvases = await fetchCanvasList(apiKey, restEndpoint);
      selectEl.innerHTML = '<option value="">-- Select a Canvas --</option>' +
        canvases.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}</option>`).join('');
      triggerBtn.disabled = true;
    } catch (err) {
      selectEl.innerHTML = `<option value="">Error: ${escHtml(err.message)}</option>`;
    } finally {
      loadBtn.disabled = false;
      loadBtn.textContent = 'Load Canvases';
    }
  });

  selectEl.addEventListener('change', () => {
    triggerBtn.disabled = !selectEl.value;
  });

  triggerBtn.addEventListener('click', async () => {
    const canvasId = selectEl.value;
    if (!canvasId) return;

    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;

    let entryProps = {};
    try {
      const raw = section.querySelector('.ct-pr-entry-props').value.trim();
      if (raw) entryProps = JSON.parse(raw);
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
      return;
    }

    const progressWrap = section.querySelector('.ct-pr-progress');
    const progressFill = section.querySelector('.ct-pr-progress-fill');
    const progressLabel = section.querySelector('.ct-pr-progress-label');
    const resultEl = section.querySelector('.ct-pr-result');

    triggerBtn.disabled = true;
    progressFill.style.width = '0%';
    progressLabel.textContent = 'Sending...';
    progressWrap.style.display = 'block';
    resultEl.style.display = 'none';

    try {
      const results = await triggerCanvasSend(
        canvasId, externalIds, entryProps, apiKey, restEndpoint,
        (current, total) => {
          progressFill.style.width = Math.round((current / total) * 100) + '%';
          progressLabel.textContent = `${current} of ${total} recipients...`;
        },
      );

      const hasErrors = results.errors.length > 0;
      const cls = hasErrors ? (results.sent > 0 ? 'status-warning' : 'status-error') : 'status-success';
      let html = `<p class="scenario-summary status-message ${cls}" style="display:block;margin-bottom:6px;">
        ${results.sent} of ${externalIds.length} triggered${hasErrors ? ` (${results.failed} failed)` : ''}.
      </p>`;

      if (hasErrors) {
        for (const err of results.errors) {
          html += `<p class="help-text" style="color:var(--error-color);">Batch ${err.batch}: ${escHtml(err.message)} (${err.status})</p>`;
        }
      }

      progressLabel.textContent = `Done — ${results.sent} of ${externalIds.length} triggered.`;
      resultEl.innerHTML = html;
      resultEl.style.display = 'block';
    } catch (err) {
      progressLabel.textContent = 'Error: ' + err.message;
    } finally {
      triggerBtn.disabled = false;
    }
  });
}
