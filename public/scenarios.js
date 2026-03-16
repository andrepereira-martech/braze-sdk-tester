/**
 * Scenario Simulator — orchestrator
 * Wires the scenario list, detail panel, editor, and engine together.
 */
import { buildPersonaPayload, runScenario } from './scenario-engine.js';
import { escHtml, renderPersonaList, renderResultsList, renderSnowflakeSQL, renderInternalGroupInstructions, renderAnalyticsDemoInstructions } from './scenario-render.js';
import * as api from './scenario-api.js';
import { ScenarioBuilder } from './scenario-builder.js';
import { renderPostRunCanvasTrigger } from './canvas-trigger.js';

export function initScenarioSimulator(apiKeyInput, endpointSelect) {
  const section = document.getElementById('scenario-simulator');
  if (!section) return;

  const listEl = section.querySelector('.scenario-list');
  const detailEl = section.querySelector('.scenario-detail');
  const searchInput = section.querySelector('.scenario-search');
  const newBtn = section.querySelector('.scenario-new-btn');
  const importBtn = section.querySelector('.scenario-import-btn');
  const importFileInput = section.querySelector('.scenario-import-file');
  const prefixInput = document.getElementById('scenario-prefix');
  const delayInput = document.getElementById('scenario-delay');

  let scenarios = [];
  let selectedId = null;

  const editor = new ScenarioBuilder(detailEl, {
    onSave: async (data, isNew) => {
      try {
        if (isNew) {
          await api.createScenario(data);
        } else {
          await api.updateScenario(data.id, data);
        }
        await loadList();
        selectedId = data.id;
        await showDetail(data.id);
      } catch (err) {
        alert('Save failed: ' + err.message);
      }
    },
    onCancel: () => {
      if (selectedId) {
        showDetail(selectedId);
      } else {
        detailEl.innerHTML = '<p class="help-text">Select a scenario from the list.</p>';
      }
    }
  });

  // Load scenario list
  async function loadList() {
    try {
      scenarios = await api.fetchScenarios();
    } catch {
      scenarios = [];
    }
    renderList();
  }

  function renderList(filter = '') {
    const lowerFilter = filter.toLowerCase();
    const filtered = lowerFilter
      ? scenarios.filter(s => s.name.toLowerCase().includes(lowerFilter) || (s.category || '').toLowerCase().includes(lowerFilter))
      : scenarios;

    // Group by category
    const groups = {};
    for (const s of filtered) {
      const cat = s.category || 'Custom';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }

    let html = '';
    for (const [cat, items] of Object.entries(groups)) {
      html += `<div class="scenario-list-category">${escHtml(cat)}</div>`;
      for (const s of items) {
        const active = s.id === selectedId ? ' active' : '';
        const badge = s.isTemplate ? '<span class="template-badge">T</span>' : '';
        html += `
          <div class="scenario-list-item${active}" data-id="${escHtml(s.id)}">
            <span class="scenario-list-name">${escHtml(s.name)}</span>
            <span class="scenario-list-meta">(${s.personaCount}) ${badge}</span>
          </div>
        `;
      }
    }

    if (!html) {
      html = '<p class="help-text" style="padding:8px;">No scenarios found.</p>';
    }

    listEl.querySelector('.scenario-list-items').innerHTML = html;

    // Bind click events
    listEl.querySelectorAll('.scenario-list-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedId = el.dataset.id;
        renderList(searchInput.value);
        showDetail(selectedId);
      });
    });
  }

  async function showDetail(id) {
    let scenario;
    try {
      scenario = await api.fetchScenario(id);
    } catch {
      detailEl.innerHTML = '<p class="help-text">Failed to load scenario.</p>';
      return;
    }

    const isTemplate = scenario.isTemplate;
    const actionButtons = isTemplate
      ? `<button type="button" class="btn-primary btn-small detail-open-builder">Open in Builder</button>
         <button type="button" class="btn-secondary btn-small detail-export">Export</button>`
      : `<button type="button" class="btn-primary btn-small detail-edit">Edit in Builder</button>
         <button type="button" class="btn-secondary btn-small detail-clone">Clone</button>
         <button type="button" class="btn-secondary btn-small detail-export">Export</button>
         <button type="button" class="btn-small btn-danger detail-delete">Delete</button>`;

    detailEl.innerHTML = `
      <div class="scenario-detail-content">
        <h3>${escHtml(scenario.name)} ${isTemplate ? '<span class="template-badge">Template</span>' : ''}</h3>
        <p class="help-text">${escHtml(scenario.description || '')}</p>
        ${renderPersonaList(scenario.personas)}

        <div class="button-group" style="margin-top:16px;">
          ${actionButtons}
        </div>

        <hr style="margin:16px 0; border:none; border-top:1px solid var(--border-color);">

        <div class="form-row">
          <div class="form-group">
            <label for="scenario-prefix">Prefix</label>
            <input type="text" id="scenario-prefix" value="${escHtml(prefixInput?.value || 'sim_')}" maxlength="30">
          </div>
          <div class="form-group">
            <label for="scenario-delay">Delay (ms)</label>
            <input type="number" id="scenario-delay" value="${escHtml(delayInput?.value || '300')}" min="0" max="5000">
          </div>
        </div>

        <div class="button-group" style="margin-bottom:16px;">
          <button type="button" class="btn-primary detail-run">Run Scenario</button>
          <button type="button" class="btn-secondary detail-preview">Preview Payload</button>
        </div>

        <div class="detail-progress" style="display:none;">
          <div class="scenario-progress-bar">
            <div class="detail-progress-fill scenario-progress-fill"></div>
          </div>
          <p class="detail-progress-label help-text" style="margin-top:6px;"></p>
        </div>

        <div class="detail-results" style="display:none;"></div>
      </div>
    `;

    // Re-bind prefix/delay inputs to the new elements in the detail panel
    const detailPrefix = detailEl.querySelector('#scenario-prefix');
    const detailDelay = detailEl.querySelector('#scenario-delay');

    // Action handlers

    // Edit (custom scenarios)
    detailEl.querySelector('.detail-edit')?.addEventListener('click', () => editor.open(scenario, false));

    // "Open in Builder" for templates: clones then immediately opens the builder
    detailEl.querySelector('.detail-open-builder')?.addEventListener('click', async () => {
      const name = prompt('Name for the new scenario (cloned from template):', scenario.name + ' (Custom)');
      if (!name) return;
      try {
        const cloned = await api.cloneScenario(id, name);
        const clonedFull = await api.fetchScenario(cloned.id);
        await loadList();
        selectedId = cloned.id;
        renderList(searchInput.value);
        editor.open(clonedFull, false);
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    });

    // Clone (custom scenarios) — also opens builder
    detailEl.querySelector('.detail-clone')?.addEventListener('click', async () => {
      const name = prompt('Name for the cloned scenario:', scenario.name + ' (Copy)');
      if (!name) return;
      try {
        const cloned = await api.cloneScenario(id, name);
        const clonedFull = await api.fetchScenario(cloned.id);
        await loadList();
        selectedId = cloned.id;
        renderList(searchInput.value);
        editor.open(clonedFull, false);
      } catch (err) {
        alert('Clone failed: ' + err.message);
      }
    });

    detailEl.querySelector('.detail-export')?.addEventListener('click', () => {
      window.location.href = api.exportScenarioUrl(id);
    });

    const deleteBtn = detailEl.querySelector('.detail-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete "' + scenario.name + '"?')) return;
        try {
          await api.deleteScenario(id);
          selectedId = null;
          await loadList();
          detailEl.innerHTML = '<p class="help-text">Select a scenario from the list.</p>';
        } catch (err) {
          alert('Delete failed: ' + err.message);
        }
      });
    }

    // Preview
    detailEl.querySelector('.detail-preview').addEventListener('click', () => {
      const prefix = detailPrefix.value || 'sim_';
      const payloads = scenario.personas.map(p => buildPersonaPayload(p, prefix));
      const resultsEl = detailEl.querySelector('.detail-results');
      resultsEl.innerHTML = `
        <h3 style="margin-bottom:10px;">Payload Preview (${scenario.personas.length} user${scenario.personas.length > 1 ? 's' : ''})</h3>
        <p class="help-text" style="margin-bottom:8px;">JSON sent to <code>/users/track</code> — one call per user.</p>
        <pre style="background:#1e293b;color:#e2e8f0;padding:14px;border-radius:6px;font-size:12px;overflow:auto;max-height:360px;line-height:1.5;">${escHtml(JSON.stringify(payloads, null, 2))}</pre>
      `;
      resultsEl.style.display = 'block';
    });

    // Run
    detailEl.querySelector('.detail-run').addEventListener('click', async () => {
      const apiKey = apiKeyInput.value.trim();
      const restEndpoint = endpointSelect.value;
      if (!apiKey) { alert('Enter your REST API Key in the Configuration section.'); return; }

      const prefix = detailPrefix.value || 'sim_';
      const delayMs = parseInt(detailDelay.value, 10) || 300;

      const runBtn = detailEl.querySelector('.detail-run');
      const previewBtn = detailEl.querySelector('.detail-preview');
      const progressWrap = detailEl.querySelector('.detail-progress');
      const progressFill = detailEl.querySelector('.detail-progress-fill');
      const progressLabel = detailEl.querySelector('.detail-progress-label');
      const resultsEl = detailEl.querySelector('.detail-results');

      runBtn.disabled = true;
      previewBtn.disabled = true;
      progressFill.style.width = '0%';
      progressLabel.textContent = 'Starting...';
      progressWrap.style.display = 'block';
      resultsEl.style.display = 'none';

      const total = scenario.personas.length;

      function onProgress(current, t, label, status) {
        const pct = Math.round((current / t) * 100);
        progressFill.style.width = pct + '%';
        const icon = status === 'sending' ? '⏳' : status === 'success' ? '✓' : '✗';
        progressLabel.textContent = `${icon} ${current} of ${t}: ${label}`;
      }

      let results;
      try {
        results = await runScenario(scenario, prefix, delayMs, apiKey, restEndpoint, onProgress);
      } catch (err) {
        progressLabel.textContent = 'Error: ' + err.message;
        runBtn.disabled = false;
        previewBtn.disabled = false;
        return;
      }

      progressLabel.textContent = `Done — ${results.success.length} of ${total} users created successfully.`;

      const errorCount = results.errors.length;
      const summaryClass = errorCount === 0 ? 'status-success' : (results.success.length === 0 ? 'status-error' : 'status-warning');

      let html = `
        <p class="scenario-summary status-message ${summaryClass}" style="display:block; margin-bottom:14px;">
          ${results.success.length} of ${total} users created successfully${errorCount ? ' (' + errorCount + ' failed)' : ''}.
        </p>
        ${renderResultsList(results.success, results.errors)}
      `;

      if (scenario.id === 'currents-ping' && results.traceId) {
        html += renderSnowflakeSQL(prefix, results.traceId, results.firedAt);
      }
      if (scenario.id === 'internal-group-setup' && results.success.length) {
        html += renderInternalGroupInstructions(prefix, results.success.map(u => u.id));
      }
      if (scenario.id === 'analytics-demo') {
        html += renderAnalyticsDemoInstructions(prefix, results.success.length, total);
      }

      resultsEl.innerHTML = html;
      resultsEl.style.display = 'block';

      if (results.success.length > 0) {
        const successIds = results.success.map(u => u.id);
        renderPostRunCanvasTrigger(resultsEl, successIds, apiKeyInput, endpointSelect);
      }

      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      runBtn.disabled = false;
      previewBtn.disabled = false;
    });
  }

  // Search
  searchInput.addEventListener('input', () => renderList(searchInput.value));

  // New scenario
  newBtn.addEventListener('click', () => {
    selectedId = null;
    renderList(searchInput.value);
    editor.open(null, true);
  });

  // Import
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', async () => {
    const file = importFileInput.files[0];
    if (!file) return;
    try {
      const imported = await api.importScenario(file);
      await loadList();
      selectedId = imported.id;
      renderList(searchInput.value);
      showDetail(imported.id);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    importFileInput.value = '';
  });

  // Initial load
  loadList();
}
