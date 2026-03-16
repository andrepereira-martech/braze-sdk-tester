/**
 * Scenario Builder — interactive timeline-based scenario editor
 */
import { escHtml } from './scenario-render.js';

const CATEGORIES = ['Segment Building', 'Internal Groups & Testing', 'Connectivity Testing', 'Custom'];
const BADGE_OPTIONS = ['buyer', 'browser', 'churned', 'test', 'ping', 'trial', 'converted', 'media', 'user'];
const CHIP_W = 80;
const MIN_TRACK_W = 280;

export class ScenarioBuilder {
  constructor(container, { onSave, onCancel }) {
    this.container = container;
    this.onSave = (data, isNewScenario) => { this._exitFullwidth(); onSave(data, isNewScenario); };
    this.onCancel = () => { this._exitFullwidth(); onCancel(); };
    this._section = null;
    this._trackWidth = MIN_TRACK_W;
    this.state = {
      scenario: null,
      focusedPersonaIndex: null,
      selectedPersonaIds: new Set(),
      isNew: false,
      jsonMode: false,
      activePopover: null,
      activeBackdrop: null,
      addDialogPersona: null,
    };
  }

  _enterFullwidth() {
    this._section = this.container.closest('.section');
    this._section?.classList.add('sb-fullwidth');
  }

  _exitFullwidth() {
    this._section?.classList.remove('sb-fullwidth');
    this._section = null;
  }

  _measureTrackWidth() {
    const pane = this.container.querySelector('.sb-timeline-pane');
    if (!pane) return MIN_TRACK_W;
    const nameW = 160;
    const actionsW = 140;
    const available = pane.clientWidth - nameW - actionsW - 24;
    return Math.max(MIN_TRACK_W, available);
  }

  open(scenario, isNew = false) {
    this._closePopover();
    this._enterFullwidth();
    this.state.scenario = JSON.parse(JSON.stringify(scenario || {
      id: '',
      name: '',
      description: '',
      category: 'Custom',
      isTemplate: false,
      personas: [this._emptyPersona()],
    }));
    this.state.scenario.isTemplate = false;
    this.state.isNew = isNew;
    this.state.jsonMode = false;
    this.state.focusedPersonaIndex = null;
    this.state.selectedPersonaIds = new Set();
    this.state.addDialogPersona = null;
    this.render();
  }

  render() {
    this._closePopover();
    if (this.state.jsonMode) {
      this._renderJsonMode();
    } else {
      this._renderBuilder();
    }
  }

  // ── Builder shell ─────────────────────────────────────────────────────────

  _renderBuilder() {
    const s = this.state.scenario;
    const catOptions = CATEGORIES.map(c =>
      `<option value="${escHtml(c)}"${s.category === c ? ' selected' : ''}>${escHtml(c)}</option>`
    ).join('');

    this.container.innerHTML = `
      <div class="sb-layout">
        <div class="sb-header">
          <div class="sb-header-fields">
            <div class="sb-field-group">
              <label>Name *</label>
              <input type="text" class="sb-name" value="${escHtml(s.name || '')}" placeholder="My Scenario">
            </div>
            <div class="sb-field-group">
              <label>Category</label>
              <select class="sb-category">${catOptions}</select>
            </div>
            <div class="sb-field-group sb-field-desc">
              <label>Description</label>
              <input type="text" class="sb-description" value="${escHtml(s.description || '')}" placeholder="What does this scenario do?">
            </div>
          </div>
          <div class="sb-toolbar">
            <button type="button" class="btn-small sb-json-toggle" aria-label="Switch to JSON editor">JSON</button>
            <button type="button" class="btn-primary btn-small sb-save">Save</button>
            <button type="button" class="btn-secondary btn-small sb-cancel">Cancel</button>
          </div>
        </div>

        <div class="sb-body">
          <div class="sb-timeline-pane">
            <div class="sb-timeline-inner" id="sb-timeline"></div>
            <div class="sb-timeline-footer">
              <button type="button" class="btn-primary btn-small sb-add-persona">+ Add Persona</button>
            </div>
            <div class="sb-bulk-bar" id="sb-bulk-bar">
              <span class="sb-bulk-label"></span>
              <button type="button" class="btn-small btn-secondary sb-bulk-add">+ Add Event</button>
              <button type="button" class="btn-small btn-secondary sb-bulk-remove">- Remove Event</button>
              <button type="button" class="btn-small sb-bulk-clear" style="background:transparent;color:var(--text-muted);border:1px solid var(--border-color);">Clear Selection</button>
              <div class="sb-bulk-form" id="sb-bulk-form" style="display:none;"></div>
            </div>
          </div>
          <div class="sb-panel" id="sb-panel">
            <p class="sb-panel-placeholder">Click a persona name to edit its attributes and purchases.</p>
          </div>
        </div>
      </div>
    `;

    this._bindShellEvents();
    requestAnimationFrame(() => {
      this._trackWidth = this._measureTrackWidth();
      this._renderTimeline();
    });
  }

  _bindShellEvents() {
    const c = this.container;

    c.querySelector('.sb-name').addEventListener('input', e => {
      this.state.scenario.name = e.target.value;
    });
    c.querySelector('.sb-category').addEventListener('change', e => {
      this.state.scenario.category = e.target.value;
    });
    c.querySelector('.sb-description').addEventListener('input', e => {
      this.state.scenario.description = e.target.value;
    });

    c.querySelector('.sb-json-toggle').addEventListener('click', () => {
      this.state.jsonMode = true;
      this.render();
    });

    c.querySelector('.sb-save').addEventListener('click', () => {
      const s = this.state.scenario;
      if (!s.name.trim()) { alert('Name is required'); return; }
      if (!s.personas.length) { alert('At least one persona is required'); return; }
      s.personas.forEach(p => {
        if (!p.id && p.label) {
          p.id = p.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        }
      });
      this.onSave(s, this.state.isNew);
    });

    c.querySelector('.sb-cancel').addEventListener('click', () => this.onCancel());

    c.querySelector('.sb-add-persona').addEventListener('click', () => {
      this.state.scenario.personas.push(this._emptyPersona());
      this._renderTimeline();
    });

    c.querySelector('.sb-bulk-add').addEventListener('click', () => this._bulkAddEvent());
    c.querySelector('.sb-bulk-remove').addEventListener('click', () => this._bulkRemoveEvent());
    c.querySelector('.sb-bulk-clear').addEventListener('click', () => {
      this.state.selectedPersonaIds.clear();
      this.container.querySelectorAll('.sb-persona-check').forEach(cb => { cb.checked = false; });
      this.container.querySelectorAll('.sb-persona-row').forEach(r => r.classList.remove('sb-selected'));
      this._updateBulkBar();
    });
  }

  // ── Timeline ──────────────────────────────────────────────────────────────

  _getTimeRange() {
    let minDay = -5;
    for (const p of this.state.scenario.personas) {
      for (const e of (p.events || [])) minDay = Math.min(minDay, e.time_offset_days || 0);
      for (const pu of (p.purchases || [])) minDay = Math.min(minDay, pu.time_offset_days || 0);
    }
    return { minDay, maxDay: 0 };
  }

  _dayToX(day, minDay) {
    const range = -minDay || 1;
    const usable = this._trackWidth - CHIP_W - 8;
    return Math.round(((day - minDay) / range) * usable);
  }

  _labelInterval(range) {
    if (range <= 14) return 2;
    if (range <= 31) return 5;
    if (range <= 90) return 10;
    if (range <= 180) return 30;
    return 60;
  }

  _renderTimeline() {
    const { minDay } = this._getTimeRange();
    const range = -minDay;
    const interval = this._labelInterval(range);
    const tw = this._trackWidth;

    let labels = '';
    let ticks = '';
    for (let d = minDay; d <= 0; d++) {
      if (d % interval === 0 || d === 0) {
        const x = this._dayToX(d, minDay);
        const text = d === 0 ? 'Today' : `Day ${d}`;
        labels += `<div class="sb-col-label" style="left:${x}px;">${text}</div>`;
        ticks += `<div class="sb-tick" style="left:${x}px;"></div>`;
      }
    }

    let html = `
      <div class="sb-header-row">
        <div class="sb-name-spacer"></div>
        <div class="sb-track-area">
          <div class="sb-track-header" style="width:${tw}px;">
            ${labels}${ticks}
          </div>
        </div>
        <div class="sb-actions-spacer"></div>
      </div>
    `;

    this.state.scenario.personas.forEach((persona, i) => {
      html += this._buildPersonaRowHtml(persona, i, minDay);
    });

    document.getElementById('sb-timeline').innerHTML = html;
    this._bindTimelineEvents(minDay);
  }

  _buildPersonaRowHtml(persona, index, minDay) {
    const isSelected = this.state.selectedPersonaIds.has(index);
    const isFocused = this.state.focusedPersonaIndex === index;
    const tw = this._trackWidth;

    const allItems = [
      ...(persona.events || []).map((e, ei) => ({ type: 'event', data: e, idx: ei })),
      ...(persona.purchases || []).map((pu, pi) => ({ type: 'purchase', data: pu, idx: pi })),
    ].sort((a, b) => (a.data.time_offset_days || 0) - (b.data.time_offset_days || 0));

    const levels = [];

    const chips = allItems.map(item => {
      const day = item.data.time_offset_days || 0;
      const x = this._dayToX(day, minDay);

      let topIdx = 0;
      while (true) {
        const occupied = levels[topIdx] || [];
        const overlaps = occupied.some(o => x < o.x + o.w + 4 && x + CHIP_W > o.x - 4);
        if (!overlaps) break;
        topIdx++;
      }
      if (!levels[topIdx]) levels[topIdx] = [];
      levels[topIdx].push({ x, w: CHIP_W });

      const top = 8 + topIdx * 26;
      const label = item.type === 'event' ? item.data.name : item.data.product_id;
      const truncated = label && label.length > 9 ? label.slice(0, 8) + '…' : (label || '?');
      const cls = item.type === 'purchase' ? 'sb-chip purchase' : 'sb-chip';
      const title = item.type === 'event'
        ? `${label} (Day ${day})`
        : `${label} $${item.data.price} (Day ${day})`;
      const dataAttr = item.type === 'event'
        ? `data-event="${item.idx}"`
        : `data-purchase="${item.idx}"`;

      return `<div class="${cls}" style="left:${x}px;top:${top}px;width:${CHIP_W}px;" title="${escHtml(title)}" data-persona="${index}" ${dataAttr}>${escHtml(truncated)}</div>`;
    }).join('');

    const trackH = Math.max(44, 8 + levels.length * 26 + 10);

    return `
      <div class="sb-persona-row${isSelected ? ' sb-selected' : ''}" data-persona-idx="${index}">
        <div class="sb-name-spacer">
          <input type="checkbox" class="sb-persona-check" data-idx="${index}"${isSelected ? ' checked' : ''}>
          <span class="sb-persona-name${isFocused ? ' active' : ''}" data-idx="${index}" title="${escHtml(persona.label || '')}">${escHtml(persona.label || 'Persona ' + (index + 1))}</span>
        </div>
        <div class="sb-track-area">
          <div class="sb-track" style="width:${tw}px;height:${trackH}px;" data-persona="${index}">
            ${chips}
          </div>
        </div>
        <div class="sb-actions-spacer">
          <button type="button" class="sb-row-btn" data-idx="${index}" title="Add event to this persona" aria-label="Add event">+ Event</button>
          <button type="button" class="sb-row-btn sb-btn-icon sb-clone-persona" data-idx="${index}" title="Clone persona" aria-label="Clone persona">⧉</button>
          <button type="button" class="sb-row-btn sb-btn-icon sb-btn-danger sb-remove-persona" data-idx="${index}" title="Remove persona" aria-label="Remove persona">×</button>
        </div>
      </div>
    `;
  }

  _bindTimelineEvents(_minDay) {
    this.container.querySelectorAll('.sb-persona-name').forEach(el => {
      el.addEventListener('click', () => this._selectPersona(parseInt(el.dataset.idx, 10)));
    });

    this.container.querySelectorAll('.sb-persona-check').forEach(cb => {
      cb.addEventListener('change', () => this._updateCheckbox(parseInt(cb.dataset.idx, 10), cb.checked));
    });

    this.container.querySelectorAll('.sb-chip:not(.purchase)').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        this._openEventPopover(parseInt(chip.dataset.persona, 10), parseInt(chip.dataset.event, 10), chip);
      });
    });

    this.container.querySelectorAll('.sb-chip.purchase').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        this._openPurchasePopover(parseInt(chip.dataset.persona, 10), parseInt(chip.dataset.purchase, 10), chip);
      });
    });

    this.container.querySelectorAll('.sb-row-btn:not(.sb-clone-persona):not(.sb-remove-persona)').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this._openAddEventDialog(parseInt(btn.dataset.idx, 10), btn);
      });
    });

    this.container.querySelectorAll('.sb-clone-persona').forEach(btn => {
      btn.addEventListener('click', () => this._clonePersona(parseInt(btn.dataset.idx, 10)));
    });
    this.container.querySelectorAll('.sb-remove-persona').forEach(btn => {
      btn.addEventListener('click', () => this._removePersona(parseInt(btn.dataset.idx, 10)));
    });
  }

  // ── Persona selection / checkboxes ────────────────────────────────────────

  _selectPersona(i) {
    this.state.focusedPersonaIndex = i;
    this.container.querySelectorAll('.sb-persona-name').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.idx, 10) === i);
    });
    this._renderAttributePanel();
  }

  _updateCheckbox(i, checked) {
    if (checked) this.state.selectedPersonaIds.add(i);
    else this.state.selectedPersonaIds.delete(i);
    const row = this.container.querySelector(`.sb-persona-row[data-persona-idx="${i}"]`);
    if (row) row.classList.toggle('sb-selected', checked);
    this._updateBulkBar();
  }

  _updateBulkBar() {
    const bar = document.getElementById('sb-bulk-bar');
    if (!bar) return;
    const n = this.state.selectedPersonaIds.size;
    if (n >= 2) {
      bar.classList.add('visible');
      bar.querySelector('.sb-bulk-label').textContent = `${n} personas selected`;
    } else {
      bar.classList.remove('visible');
      const form = document.getElementById('sb-bulk-form');
      if (form) form.style.display = 'none';
    }
  }

  // ── Persona CRUD ──────────────────────────────────────────────────────────

  _clonePersona(i) {
    const clone = JSON.parse(JSON.stringify(this.state.scenario.personas[i]));
    clone.label = clone.label ? clone.label + ' (Copy)' : 'Copy';
    clone.id = clone.id ? clone.id + '_copy' : '';
    this.state.scenario.personas.splice(i + 1, 0, clone);
    this._renderTimeline();
  }

  _removePersona(i) {
    if (this.state.scenario.personas.length <= 1) {
      alert('A scenario must have at least one persona.');
      return;
    }
    this.state.scenario.personas.splice(i, 1);
    this.state.selectedPersonaIds.delete(i);
    if (this.state.focusedPersonaIndex === i) {
      this.state.focusedPersonaIndex = null;
      document.getElementById('sb-panel').innerHTML =
        '<p class="sb-panel-placeholder">Click a persona name to edit its attributes and purchases.</p>';
    } else if (this.state.focusedPersonaIndex > i) {
      this.state.focusedPersonaIndex--;
    }
    this._renderTimeline();
  }

  // ── Popover positioning helper ────────────────────────────────────────────

  _positionPopover(pop, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popW = 320;
    const popH = pop.offsetHeight || 300;

    let top = rect.bottom + 8;
    let left = rect.left;

    if (top + popH > window.innerHeight - 16) {
      top = Math.max(16, rect.top - popH - 8);
    }

    if (left + popW > window.innerWidth - 16) {
      left = window.innerWidth - popW - 16;
    }
    if (left < 16) left = 16;

    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  // ── Event popover ─────────────────────────────────────────────────────────

  _openEventPopover(pi, ei, anchorEl) {
    this._closePopover();
    const evt = this.state.scenario.personas[pi].events[ei];
    if (!evt) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'sb-popover-backdrop';
    document.body.appendChild(backdrop);
    this.state.activeBackdrop = backdrop;

    const pop = document.createElement('div');
    pop.className = 'sb-popover';

    pop.innerHTML = `
      <div class="sb-popover-header">
        <strong>Edit Event</strong>
        <button type="button" class="sb-popover-close" aria-label="Close">×</button>
      </div>
      <div class="sb-popover-field">
        <label>Name</label>
        <input type="text" class="pop-name" value="${escHtml(evt.name || '')}">
      </div>
      <div class="sb-popover-field">
        <label>Day offset (0 = today, negative = past)</label>
        <input type="number" class="pop-offset" value="${evt.time_offset_days ?? 0}" step="1">
      </div>
      <div class="sb-popover-field">
        <label>Properties (JSON)</label>
        <textarea class="pop-props" rows="3" spellcheck="false">${escHtml(JSON.stringify(evt.properties || {}, null, 2))}</textarea>
      </div>
      <div class="sb-popover-error status-message status-error" style="display:none;"></div>
      <div class="sb-popover-actions">
        <button type="button" class="btn-primary btn-small pop-update">Update</button>
        <button type="button" class="btn-danger btn-small pop-delete">Delete</button>
      </div>
    `;

    document.body.appendChild(pop);
    this.state.activePopover = pop;
    this._positionPopover(pop, anchorEl);
    pop.querySelector('.pop-name').focus();

    pop.querySelector('.pop-update').addEventListener('click', () => {
      const name = pop.querySelector('.pop-name').value.trim();
      if (!name) return this._showPopoverError(pop, 'Event name is required');
      let props = {};
      try { props = JSON.parse(pop.querySelector('.pop-props').value || '{}'); }
      catch (e) { return this._showPopoverError(pop, 'Invalid JSON: ' + e.message); }
      this.state.scenario.personas[pi].events[ei] = {
        name,
        time_offset_days: parseInt(pop.querySelector('.pop-offset').value, 10) || 0,
        properties: props,
      };
      this._closePopover();
      this._renderTimeline();
    });

    pop.querySelector('.pop-delete').addEventListener('click', () => {
      this.state.scenario.personas[pi].events.splice(ei, 1);
      this._closePopover();
      this._renderTimeline();
    });

    pop.querySelector('.sb-popover-close').addEventListener('click', () => this._closePopover());
    backdrop.addEventListener('click', () => this._closePopover());
  }

  _openPurchasePopover(pi, puIdx, anchorEl) {
    this._closePopover();
    const pu = this.state.scenario.personas[pi].purchases[puIdx];
    if (!pu) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'sb-popover-backdrop';
    document.body.appendChild(backdrop);
    this.state.activeBackdrop = backdrop;

    const pop = document.createElement('div');
    pop.className = 'sb-popover';

    pop.innerHTML = `
      <div class="sb-popover-header">
        <strong>Edit Purchase</strong>
        <button type="button" class="sb-popover-close" aria-label="Close">×</button>
      </div>
      <div class="sb-popover-field">
        <label>Product ID</label>
        <input type="text" class="pop-product" value="${escHtml(pu.product_id || '')}">
      </div>
      <div class="sb-popover-row">
        <div class="sb-popover-field">
          <label>Currency</label>
          <input type="text" class="pop-currency" value="${escHtml(pu.currency || 'USD')}" style="width:70px;">
        </div>
        <div class="sb-popover-field">
          <label>Price</label>
          <input type="number" class="pop-price" value="${pu.price ?? 0}" step="0.01" style="width:90px;">
        </div>
        <div class="sb-popover-field">
          <label>Qty</label>
          <input type="number" class="pop-qty" value="${pu.quantity ?? 1}" style="width:60px;">
        </div>
      </div>
      <div class="sb-popover-field">
        <label>Day offset (0 = today, negative = past)</label>
        <input type="number" class="pop-offset" value="${pu.time_offset_days ?? 0}" step="1">
      </div>
      <div class="sb-popover-actions">
        <button type="button" class="btn-primary btn-small pop-update">Update</button>
        <button type="button" class="btn-danger btn-small pop-delete">Delete</button>
      </div>
    `;

    document.body.appendChild(pop);
    this.state.activePopover = pop;
    this._positionPopover(pop, anchorEl);

    pop.querySelector('.pop-update').addEventListener('click', () => {
      this.state.scenario.personas[pi].purchases[puIdx] = {
        product_id: pop.querySelector('.pop-product').value.trim(),
        currency: pop.querySelector('.pop-currency').value.trim() || 'USD',
        price: parseFloat(pop.querySelector('.pop-price').value) || 0,
        quantity: parseInt(pop.querySelector('.pop-qty').value, 10) || 1,
        time_offset_days: parseInt(pop.querySelector('.pop-offset').value, 10) || 0,
      };
      this._closePopover();
      this._renderTimeline();
    });

    pop.querySelector('.pop-delete').addEventListener('click', () => {
      this.state.scenario.personas[pi].purchases.splice(puIdx, 1);
      this._closePopover();
      this._renderTimeline();
    });

    pop.querySelector('.sb-popover-close').addEventListener('click', () => this._closePopover());
    backdrop.addEventListener('click', () => this._closePopover());
  }

  _showPopoverError(pop, msg) {
    const el = pop.querySelector('.sb-popover-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  _closePopover() {
    if (this.state.activeBackdrop) {
      this.state.activeBackdrop.remove();
      this.state.activeBackdrop = null;
    }
    if (this.state.activePopover) {
      this.state.activePopover.remove();
      this.state.activePopover = null;
    }
  }

  // ── Add event inline dialog ───────────────────────────────────────────────

  _openAddEventDialog(pi, _anchorBtn) {
    const existing = this.container.querySelector('.sb-add-dialog');
    if (existing) {
      existing.remove();
      if (this.state.addDialogPersona === pi) {
        this.state.addDialogPersona = null;
        return;
      }
    }
    this.state.addDialogPersona = pi;

    const dialog = document.createElement('div');
    dialog.className = 'sb-add-dialog';
    dialog.innerHTML = `
      <div class="sb-add-dialog-inner">
        <strong style="font-size:0.8125rem;color:var(--secondary-color);">Add Event to "${escHtml(this.state.scenario.personas[pi].label || 'Persona ' + (pi + 1))}"</strong>
        <div class="sb-add-fields">
          <div class="sb-popover-field" style="min-width:140px;">
            <label>Name *</label>
            <input type="text" class="add-evt-name" placeholder="event_name">
          </div>
          <div class="sb-popover-field" style="width:100px;">
            <label>Day offset</label>
            <input type="number" class="add-evt-offset" value="-1" step="1">
          </div>
          <div class="sb-popover-field" style="flex:1;min-width:140px;">
            <label>Properties (JSON)</label>
            <input type="text" class="add-evt-props" value="{}" placeholder="{}">
          </div>
          <div class="sb-popover-field" style="align-self:flex-end;display:flex;gap:6px;">
            <button type="button" class="btn-primary btn-small add-evt-confirm">Add</button>
            <button type="button" class="btn-small add-evt-cancel" style="background:transparent;color:var(--text-muted);border:1px solid var(--border-color);">Cancel</button>
          </div>
        </div>
        <div class="add-evt-error status-message status-error" style="display:none;"></div>
      </div>
    `;

    const row = this.container.querySelector(`.sb-persona-row[data-persona-idx="${pi}"]`);
    if (row) row.after(dialog);
    dialog.querySelector('.add-evt-name').focus();

    dialog.querySelector('.add-evt-confirm').addEventListener('click', () => {
      const name = dialog.querySelector('.add-evt-name').value.trim();
      const errEl = dialog.querySelector('.add-evt-error');
      if (!name) { errEl.textContent = 'Event name is required'; errEl.style.display = 'block'; return; }
      let props = {};
      try { props = JSON.parse(dialog.querySelector('.add-evt-props').value || '{}'); }
      catch (e) { errEl.textContent = 'Invalid JSON: ' + e.message; errEl.style.display = 'block'; return; }
      const offset = parseInt(dialog.querySelector('.add-evt-offset').value, 10) || 0;
      this.state.scenario.personas[pi].events.push({ name, time_offset_days: offset, properties: props });
      dialog.remove();
      this.state.addDialogPersona = null;
      this._renderTimeline();
    });

    dialog.querySelector('.add-evt-cancel').addEventListener('click', () => {
      dialog.remove();
      this.state.addDialogPersona = null;
    });
  }

  // ── Bulk operations ───────────────────────────────────────────────────────

  _bulkAddEvent() {
    const formEl = document.getElementById('sb-bulk-form');
    const n = this.state.selectedPersonaIds.size;

    formEl.innerHTML = `
      <div class="sb-bulk-form-inner">
        <strong style="font-size:0.8125rem;">Add event to ${n} personas:</strong>
        <div class="sb-add-fields">
          <div class="sb-popover-field" style="min-width:140px;">
            <label>Name *</label>
            <input type="text" class="bulk-evt-name" placeholder="event_name">
          </div>
          <div class="sb-popover-field" style="width:100px;">
            <label>Day offset</label>
            <input type="number" class="bulk-evt-offset" value="-1" step="1">
          </div>
          <div class="sb-popover-field" style="flex:1;min-width:120px;">
            <label>Properties (JSON)</label>
            <input type="text" class="bulk-evt-props" value="{}" placeholder="{}">
          </div>
          <div class="sb-popover-field" style="align-self:flex-end;display:flex;gap:6px;">
            <button type="button" class="btn-primary btn-small bulk-add-confirm">Add to ${n}</button>
            <button type="button" class="btn-small bulk-form-cancel" style="background:transparent;color:var(--text-muted);border:1px solid var(--border-color);">Cancel</button>
          </div>
        </div>
        <div class="bulk-add-error status-message status-error" style="display:none;"></div>
      </div>
    `;
    formEl.style.display = 'block';
    formEl.querySelector('.bulk-evt-name').focus();

    formEl.querySelector('.bulk-add-confirm').addEventListener('click', () => {
      const name = formEl.querySelector('.bulk-evt-name').value.trim();
      const errEl = formEl.querySelector('.bulk-add-error');
      if (!name) { errEl.textContent = 'Event name is required'; errEl.style.display = 'block'; return; }
      let props = {};
      try { props = JSON.parse(formEl.querySelector('.bulk-evt-props').value || '{}'); }
      catch (e) { errEl.textContent = 'Invalid JSON: ' + e.message; errEl.style.display = 'block'; return; }
      const offset = parseInt(formEl.querySelector('.bulk-evt-offset').value, 10) || 0;
      for (const idx of this.state.selectedPersonaIds) {
        this.state.scenario.personas[idx].events.push({ name, time_offset_days: offset, properties: props });
      }
      formEl.style.display = 'none';
      this._renderTimeline();
    });

    formEl.querySelector('.bulk-form-cancel').addEventListener('click', () => {
      formEl.style.display = 'none';
    });
  }

  _bulkRemoveEvent() {
    const formEl = document.getElementById('sb-bulk-form');
    const n = this.state.selectedPersonaIds.size;

    formEl.innerHTML = `
      <div class="sb-bulk-form-inner">
        <strong style="font-size:0.8125rem;">Remove event from ${n} personas:</strong>
        <div class="sb-add-fields">
          <div class="sb-popover-field" style="flex:1;">
            <label>Event name to remove (all matching occurrences)</label>
            <input type="text" class="bulk-rem-name" placeholder="event_name">
          </div>
          <div class="sb-popover-field" style="align-self:flex-end;display:flex;gap:6px;">
            <button type="button" class="btn-danger btn-small bulk-rem-confirm">Remove from ${n}</button>
            <button type="button" class="btn-small bulk-form-cancel" style="background:transparent;color:var(--text-muted);border:1px solid var(--border-color);">Cancel</button>
          </div>
        </div>
      </div>
    `;
    formEl.style.display = 'block';
    formEl.querySelector('.bulk-rem-name').focus();

    formEl.querySelector('.bulk-rem-confirm').addEventListener('click', () => {
      const name = formEl.querySelector('.bulk-rem-name').value.trim().toLowerCase();
      if (!name) return;
      for (const idx of this.state.selectedPersonaIds) {
        const p = this.state.scenario.personas[idx];
        p.events = (p.events || []).filter(e => e.name.toLowerCase() !== name);
      }
      formEl.style.display = 'none';
      this._renderTimeline();
    });

    formEl.querySelector('.bulk-form-cancel').addEventListener('click', () => {
      formEl.style.display = 'none';
    });
  }

  // ── Attribute panel ───────────────────────────────────────────────────────

  _renderAttributePanel() {
    const i = this.state.focusedPersonaIndex;
    const panelEl = document.getElementById('sb-panel');
    if (i === null || !this.state.scenario.personas[i]) {
      panelEl.innerHTML = '<p class="sb-panel-placeholder">Click a persona name to edit its attributes and purchases.</p>';
      return;
    }

    const persona = this.state.scenario.personas[i];
    const badgeOptions = BADGE_OPTIONS.map(b =>
      `<option value="${b}"${persona.badge === b ? ' selected' : ''}>${b}</option>`
    ).join('');

    const attrRows = Object.entries(persona.attributes || {}).map(([k, v]) => `
      <tr>
        <td><input type="text" class="attr-key" value="${escHtml(k)}" placeholder="key"></td>
        <td><input type="text" class="attr-val" value="${escHtml(String(v ?? ''))}" placeholder="value"></td>
        <td><button type="button" class="sb-row-btn sb-btn-icon sb-btn-danger attr-remove" aria-label="Remove attribute">×</button></td>
      </tr>
    `).join('');

    const puRows = (persona.purchases || []).map(pu => `
      <tr>
        <td><input type="text" class="pu-product" value="${escHtml(pu.product_id || '')}" placeholder="product_id"></td>
        <td><input type="text" class="pu-currency" value="${escHtml(pu.currency || 'USD')}" style="width:46px;"></td>
        <td><input type="number" class="pu-price" value="${pu.price ?? 0}" step="0.01" style="width:66px;"></td>
        <td><input type="number" class="pu-qty" value="${pu.quantity ?? 1}" style="width:40px;"></td>
        <td><input type="number" class="pu-offset" value="${pu.time_offset_days ?? 0}" style="width:52px;"></td>
        <td><button type="button" class="sb-row-btn sb-btn-icon sb-btn-danger pu-remove" aria-label="Remove purchase">×</button></td>
      </tr>
    `).join('');

    panelEl.innerHTML = `
      <div class="sb-panel-content">
        <div class="sb-panel-meta">
          <div class="sb-popover-field">
            <label>Label</label>
            <input type="text" class="panel-label" value="${escHtml(persona.label || '')}" placeholder="Persona name">
          </div>
          <div class="sb-panel-row">
            <div class="sb-popover-field" style="flex:1;">
              <label>Badge</label>
              <select class="panel-badge">${badgeOptions}</select>
            </div>
            <div class="sb-popover-field" style="flex:1;">
              <label>ID</label>
              <input type="text" class="panel-id" value="${escHtml(persona.id || '')}" placeholder="auto from label">
            </div>
          </div>
        </div>

        <div class="sb-panel-section">
          <div class="sb-attr-section-title">Attributes</div>
          <table class="kv-editor">
            <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
            <tbody class="attr-tbody">${attrRows}</tbody>
          </table>
          <button type="button" class="btn-primary btn-small attr-add" style="margin-top:6px;">+ Attribute</button>
        </div>

        <div class="sb-panel-section">
          <div class="sb-attr-section-title">Purchases <span style="font-weight:400;color:var(--text-muted);">(${(persona.purchases || []).length})</span></div>
          <table class="kv-editor" style="font-size:0.8rem;">
            <thead><tr><th>Product</th><th>Curr</th><th>Price</th><th>Qty</th><th>Day</th><th></th></tr></thead>
            <tbody class="pu-tbody">${puRows}</tbody>
          </table>
          <button type="button" class="btn-primary btn-small pu-add" style="margin-top:6px;">+ Purchase</button>
        </div>
      </div>
    `;

    this._bindPanelEvents(i);
  }

  _bindPanelEvents(personaIndex) {
    const panelEl = document.getElementById('sb-panel');
    const persona = this.state.scenario.personas[personaIndex];

    panelEl.querySelector('.panel-label').addEventListener('input', e => {
      persona.label = e.target.value;
      const nameEl = this.container.querySelector(`.sb-persona-name[data-idx="${personaIndex}"]`);
      if (nameEl) nameEl.textContent = persona.label || ('Persona ' + (personaIndex + 1));
    });

    panelEl.querySelector('.panel-badge').addEventListener('change', e => { persona.badge = e.target.value; });
    panelEl.querySelector('.panel-id').addEventListener('input', e => { persona.id = e.target.value; });

    const syncAttributes = () => {
      const attrs = {};
      panelEl.querySelectorAll('.attr-tbody tr').forEach(row => {
        const key = row.querySelector('.attr-key')?.value.trim();
        const rawVal = row.querySelector('.attr-val')?.value ?? '';
        if (key) attrs[key] = this._autoTypeValue(rawVal);
      });
      persona.attributes = attrs;
    };

    panelEl.querySelector('.attr-tbody').addEventListener('input', syncAttributes);

    panelEl.querySelector('.attr-add').addEventListener('click', () => {
      syncAttributes();
      const tbody = panelEl.querySelector('.attr-tbody');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="text" class="attr-key" placeholder="key"></td>
        <td><input type="text" class="attr-val" placeholder="value"></td>
        <td><button type="button" class="sb-row-btn sb-btn-icon sb-btn-danger attr-remove" aria-label="Remove attribute">×</button></td>
      `;
      tbody.appendChild(row);
      row.querySelector('.attr-remove').addEventListener('click', () => { row.remove(); syncAttributes(); });
      row.querySelector('.attr-key').focus();
    });

    panelEl.querySelectorAll('.attr-remove').forEach(btn => {
      btn.addEventListener('click', () => { btn.closest('tr').remove(); syncAttributes(); });
    });

    const syncPurchases = () => {
      const purchases = [];
      panelEl.querySelectorAll('.pu-tbody tr').forEach(row => {
        const pid = row.querySelector('.pu-product')?.value.trim();
        if (!pid) return;
        purchases.push({
          product_id: pid,
          currency: row.querySelector('.pu-currency')?.value.trim() || 'USD',
          price: parseFloat(row.querySelector('.pu-price')?.value) || 0,
          quantity: parseInt(row.querySelector('.pu-qty')?.value, 10) || 1,
          time_offset_days: parseInt(row.querySelector('.pu-offset')?.value, 10) || 0,
        });
      });
      persona.purchases = purchases;
    };

    panelEl.querySelector('.pu-tbody').addEventListener('input', syncPurchases);

    panelEl.querySelector('.pu-add').addEventListener('click', () => {
      syncPurchases();
      const tbody = panelEl.querySelector('.pu-tbody');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="text" class="pu-product" placeholder="product_id"></td>
        <td><input type="text" class="pu-currency" value="USD" style="width:46px;"></td>
        <td><input type="number" class="pu-price" value="0" step="0.01" style="width:66px;"></td>
        <td><input type="number" class="pu-qty" value="1" style="width:40px;"></td>
        <td><input type="number" class="pu-offset" value="0" style="width:52px;"></td>
        <td><button type="button" class="sb-row-btn sb-btn-icon sb-btn-danger pu-remove" aria-label="Remove purchase">×</button></td>
      `;
      tbody.appendChild(row);
      row.querySelector('.pu-remove').addEventListener('click', () => { row.remove(); syncPurchases(); });
      row.querySelector('.pu-product').focus();
    });

    panelEl.querySelectorAll('.pu-remove').forEach(btn => {
      btn.addEventListener('click', () => { btn.closest('tr').remove(); syncPurchases(); });
    });
  }

  // ── JSON mode ─────────────────────────────────────────────────────────────

  _renderJsonMode() {
    const json = JSON.stringify(this.state.scenario, null, 2);
    this.container.innerHTML = `
      <div class="scenario-editor">
        <div class="editor-header">
          <h3 style="color:var(--secondary-color);">${this.state.isNew ? 'New Scenario' : 'Edit Scenario'} (JSON)</h3>
          <button type="button" class="btn-small btn-secondary editor-json-toggle">Switch to Builder</button>
        </div>
        <div class="form-group">
          <textarea class="editor-json-textarea" rows="28" spellcheck="false">${escHtml(json)}</textarea>
        </div>
        <div class="sb-json-error status-message status-error" style="display:none;"></div>
        <div class="button-group" style="margin-top:12px;">
          <button type="button" class="btn-primary editor-save">Save</button>
          <button type="button" class="btn-secondary editor-cancel">Cancel</button>
        </div>
      </div>
    `;

    const errEl = this.container.querySelector('.sb-json-error');

    this.container.querySelector('.editor-json-toggle').addEventListener('click', () => {
      try {
        this.state.scenario = JSON.parse(this.container.querySelector('.editor-json-textarea').value);
        this.state.jsonMode = false;
        this.render();
      } catch (e) {
        errEl.textContent = 'Invalid JSON: ' + e.message;
        errEl.style.display = 'block';
      }
    });

    this.container.querySelector('.editor-save').addEventListener('click', () => {
      try {
        const data = JSON.parse(this.container.querySelector('.editor-json-textarea').value);
        if (!data.name) { alert('Name is required'); return; }
        if (!data.personas?.length) { alert('At least one persona is required'); return; }
        this.onSave(data, this.state.isNew);
      } catch (e) {
        errEl.textContent = 'Invalid JSON: ' + e.message;
        errEl.style.display = 'block';
      }
    });

    this.container.querySelector('.editor-cancel').addEventListener('click', () => this.onCancel());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _emptyPersona() {
    return {
      id: '',
      label: '',
      badge: 'user',
      attributes: { first_name: '', last_name: '', email: '' },
      events: [],
      purchases: [],
    };
  }

  _autoTypeValue(raw) {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (raw === 'null') return null;
    if (raw !== '' && !isNaN(Number(raw))) return Number(raw);
    return raw;
  }
}
