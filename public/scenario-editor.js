/**
 * Scenario Editor — form builder + JSON toggle
 */
import { escHtml } from './scenario-render.js';

const CATEGORIES = ['Segment Building', 'Internal Groups & Testing', 'Connectivity Testing', 'Custom'];
const BADGE_OPTIONS = ['buyer', 'browser', 'churned', 'test', 'ping', 'trial', 'converted', 'media', 'user'];

export class ScenarioEditor {
  constructor(container, { onSave, onCancel }) {
    this.container = container;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.scenario = null;
    this.isNew = false;
    this.jsonMode = false;
  }

  open(scenario, isNew = false) {
    this.scenario = JSON.parse(JSON.stringify(scenario || {
      id: '',
      name: '',
      description: '',
      category: 'Custom',
      isTemplate: false,
      personas: [this._emptyPersona()]
    }));
    this.isNew = isNew;
    this.jsonMode = false;
    this.render();
  }

  _emptyPersona() {
    return {
      id: '',
      label: '',
      badge: 'user',
      attributes: { first_name: '', last_name: '', email: '' },
      events: [],
      purchases: []
    };
  }

  render() {
    if (this.jsonMode) {
      this._renderJson();
    } else {
      this._renderForm();
    }
  }

  _renderForm() {
    const s = this.scenario;
    const categoryOptions = CATEGORIES.map(c =>
      `<option value="${escHtml(c)}"${s.category === c ? ' selected' : ''}>${escHtml(c)}</option>`
    ).join('');

    let html = `
      <div class="scenario-editor">
        <div class="editor-header">
          <h3>${this.isNew ? 'New Scenario' : 'Edit Scenario'}</h3>
          <button type="button" class="btn-small editor-json-toggle">Switch to JSON</button>
        </div>

        <div class="form-group">
          <label>Name *</label>
          <input type="text" class="editor-name" value="${escHtml(s.name || '')}" placeholder="My Scenario" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Description</label>
            <textarea class="editor-description" rows="2" placeholder="What does this scenario do?">${escHtml(s.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select class="editor-category">${categoryOptions}</select>
          </div>
        </div>

        <h4 style="margin: 16px 0 8px;">Personas</h4>
        <div class="editor-personas">
          ${(s.personas || []).map((p, i) => this._renderPersonaForm(p, i)).join('')}
        </div>
        <button type="button" class="btn-secondary btn-small editor-add-persona" style="margin-top:8px;">+ Add Persona</button>

        <div class="button-group" style="margin-top:20px;">
          <button type="button" class="btn-primary editor-save">Save</button>
          <button type="button" class="btn-secondary editor-cancel">Cancel</button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this._bindFormEvents();
  }

  _renderPersonaForm(persona, index) {
    const badgeOptions = BADGE_OPTIONS.map(b =>
      `<option value="${b}"${persona.badge === b ? ' selected' : ''}>${b}</option>`
    ).join('');

    const attrRows = Object.entries(persona.attributes || {}).map(([k, v], ai) => `
      <tr data-attr-idx="${ai}">
        <td><input type="text" class="attr-key" value="${escHtml(k)}" placeholder="key"></td>
        <td><input type="text" class="attr-val" value="${escHtml(String(v ?? ''))}" placeholder="value"></td>
        <td><button type="button" class="btn-small btn-danger attr-remove">×</button></td>
      </tr>
    `).join('');

    const eventRows = (persona.events || []).map((evt, ei) => `
      <tr data-event-idx="${ei}">
        <td><input type="text" class="evt-name" value="${escHtml(evt.name || '')}" placeholder="event_name"></td>
        <td><input type="number" class="evt-offset" value="${evt.time_offset_days ?? 0}" style="width:80px;"></td>
        <td><input type="text" class="evt-props" value="${escHtml(JSON.stringify(evt.properties || {}))}" placeholder="{}"></td>
        <td><button type="button" class="btn-small btn-danger evt-remove">×</button></td>
      </tr>
    `).join('');

    const purchaseRows = (persona.purchases || []).map((pu, pi) => `
      <tr data-purchase-idx="${pi}">
        <td><input type="text" class="pu-product" value="${escHtml(pu.product_id || '')}" placeholder="product_id"></td>
        <td><input type="text" class="pu-currency" value="${escHtml(pu.currency || 'USD')}" style="width:60px;"></td>
        <td><input type="number" class="pu-price" value="${pu.price ?? 0}" step="0.01" style="width:80px;"></td>
        <td><input type="number" class="pu-qty" value="${pu.quantity ?? 1}" style="width:50px;"></td>
        <td><input type="number" class="pu-offset" value="${pu.time_offset_days ?? 0}" style="width:80px;"></td>
        <td><button type="button" class="btn-small btn-danger pu-remove">×</button></td>
      </tr>
    `).join('');

    return `
      <div class="persona-accordion" data-persona-idx="${index}">
        <div class="persona-accordion-header">
          <span class="persona-accordion-toggle">▸</span>
          <span class="persona-accordion-title">${escHtml(persona.label || 'Persona ' + (index + 1))}</span>
          <button type="button" class="btn-small btn-danger persona-remove" title="Remove persona">×</button>
        </div>
        <div class="persona-accordion-body" style="display:none;">
          <div class="form-row">
            <div class="form-group">
              <label>ID</label>
              <input type="text" class="persona-id" value="${escHtml(persona.id || '')}" placeholder="auto_slug">
            </div>
            <div class="form-group">
              <label>Label *</label>
              <input type="text" class="persona-label" value="${escHtml(persona.label || '')}" placeholder="Persona name">
            </div>
            <div class="form-group">
              <label>Badge</label>
              <select class="persona-badge">${badgeOptions}</select>
            </div>
          </div>

          <details open>
            <summary><strong>Attributes</strong></summary>
            <table class="kv-editor attr-table">
              <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
              <tbody>${attrRows}</tbody>
            </table>
            <button type="button" class="btn-small attr-add" style="margin-top:4px;">+ Attribute</button>
          </details>

          <details>
            <summary><strong>Events</strong> (${(persona.events || []).length})</summary>
            <table class="kv-editor evt-table">
              <thead><tr><th>Name</th><th>Offset (days)</th><th>Properties</th><th></th></tr></thead>
              <tbody>${eventRows}</tbody>
            </table>
            <button type="button" class="btn-small evt-add" style="margin-top:4px;">+ Event</button>
          </details>

          <details>
            <summary><strong>Purchases</strong> (${(persona.purchases || []).length})</summary>
            <table class="kv-editor pu-table">
              <thead><tr><th>Product</th><th>Currency</th><th>Price</th><th>Qty</th><th>Offset</th><th></th></tr></thead>
              <tbody>${purchaseRows}</tbody>
            </table>
            <button type="button" class="btn-small pu-add" style="margin-top:4px;">+ Purchase</button>
          </details>
        </div>
      </div>
    `;
  }

  _readFormState() {
    const s = {
      id: this.scenario.id,
      name: this.container.querySelector('.editor-name').value.trim(),
      description: this.container.querySelector('.editor-description').value.trim(),
      category: this.container.querySelector('.editor-category').value,
      isTemplate: false,
      personas: []
    };

    this.container.querySelectorAll('.persona-accordion').forEach(el => {
      const persona = {
        id: el.querySelector('.persona-id').value.trim(),
        label: el.querySelector('.persona-label').value.trim(),
        badge: el.querySelector('.persona-badge').value,
        attributes: {},
        events: [],
        purchases: []
      };

      // Auto-generate ID from label if empty
      if (!persona.id && persona.label) {
        persona.id = persona.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      }

      // Attributes
      el.querySelectorAll('.attr-table tbody tr').forEach(row => {
        const key = row.querySelector('.attr-key').value.trim();
        const rawVal = row.querySelector('.attr-val').value;
        if (key) {
          persona.attributes[key] = this._autoTypeValue(rawVal);
        }
      });

      // Events
      el.querySelectorAll('.evt-table tbody tr').forEach(row => {
        const name = row.querySelector('.evt-name').value.trim();
        if (!name) return;
        let props = {};
        try { props = JSON.parse(row.querySelector('.evt-props').value); } catch { /* keep empty */ }
        persona.events.push({
          name,
          time_offset_days: parseInt(row.querySelector('.evt-offset').value, 10) || 0,
          properties: props
        });
      });

      // Purchases
      el.querySelectorAll('.pu-table tbody tr').forEach(row => {
        const productId = row.querySelector('.pu-product').value.trim();
        if (!productId) return;
        persona.purchases.push({
          product_id: productId,
          currency: row.querySelector('.pu-currency').value.trim() || 'USD',
          price: parseFloat(row.querySelector('.pu-price').value) || 0,
          quantity: parseInt(row.querySelector('.pu-qty').value, 10) || 1,
          time_offset_days: parseInt(row.querySelector('.pu-offset').value, 10) || 0
        });
      });

      s.personas.push(persona);
    });

    return s;
  }

  _autoTypeValue(raw) {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (raw === 'null') return null;
    if (raw !== '' && !isNaN(Number(raw))) return Number(raw);
    return raw;
  }

  _renderJson() {
    const json = JSON.stringify(this.scenario, null, 2);
    this.container.innerHTML = `
      <div class="scenario-editor">
        <div class="editor-header">
          <h3>${this.isNew ? 'New Scenario' : 'Edit Scenario'} (JSON)</h3>
          <button type="button" class="btn-small editor-json-toggle">Switch to Form</button>
        </div>
        <div class="form-group">
          <textarea class="editor-json-textarea" rows="30" spellcheck="false">${escHtml(json)}</textarea>
        </div>
        <div id="editor-json-error" class="status-message status-error" style="display:none;"></div>
        <div class="button-group" style="margin-top:12px;">
          <button type="button" class="btn-primary editor-save">Save</button>
          <button type="button" class="btn-secondary editor-cancel">Cancel</button>
        </div>
      </div>
    `;
    this._bindJsonEvents();
  }

  _bindFormEvents() {
    // Toggle JSON
    this.container.querySelector('.editor-json-toggle').addEventListener('click', () => {
      this.scenario = this._readFormState();
      this.jsonMode = true;
      this.render();
    });

    // Save
    this.container.querySelector('.editor-save').addEventListener('click', () => {
      const data = this._readFormState();
      if (!data.name) {
        alert('Name is required');
        return;
      }
      if (!data.personas.length) {
        alert('At least one persona is required');
        return;
      }
      this.onSave(data, this.isNew);
    });

    // Cancel
    this.container.querySelector('.editor-cancel').addEventListener('click', () => this.onCancel());

    // Add persona
    this.container.querySelector('.editor-add-persona').addEventListener('click', () => {
      this.scenario = this._readFormState();
      this.scenario.personas.push(this._emptyPersona());
      this.render();
    });

    // Persona accordion toggles, removes, and sub-add buttons
    this.container.querySelectorAll('.persona-accordion').forEach(el => {
      const header = el.querySelector('.persona-accordion-header');
      const body = el.querySelector('.persona-accordion-body');
      const toggle = el.querySelector('.persona-accordion-toggle');

      header.addEventListener('click', (e) => {
        if (e.target.closest('.persona-remove')) return;
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        toggle.textContent = open ? '▸' : '▾';
      });

      el.querySelector('.persona-remove').addEventListener('click', () => {
        this.scenario = this._readFormState();
        const idx = parseInt(el.dataset.personaIdx, 10);
        this.scenario.personas.splice(idx, 1);
        this.render();
      });

      // Attribute add/remove
      el.querySelector('.attr-add').addEventListener('click', () => {
        const tbody = el.querySelector('.attr-table tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="text" class="attr-key" placeholder="key"></td>
          <td><input type="text" class="attr-val" placeholder="value"></td>
          <td><button type="button" class="btn-small btn-danger attr-remove">×</button></td>
        `;
        tbody.appendChild(row);
        row.querySelector('.attr-remove').addEventListener('click', () => row.remove());
      });
      el.querySelectorAll('.attr-remove').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('tr').remove());
      });

      // Event add/remove
      el.querySelector('.evt-add').addEventListener('click', () => {
        const tbody = el.querySelector('.evt-table tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="text" class="evt-name" placeholder="event_name"></td>
          <td><input type="number" class="evt-offset" value="0" style="width:80px;"></td>
          <td><input type="text" class="evt-props" value="{}" placeholder="{}"></td>
          <td><button type="button" class="btn-small btn-danger evt-remove">×</button></td>
        `;
        tbody.appendChild(row);
        row.querySelector('.evt-remove').addEventListener('click', () => row.remove());
      });
      el.querySelectorAll('.evt-remove').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('tr').remove());
      });

      // Purchase add/remove
      el.querySelector('.pu-add').addEventListener('click', () => {
        const tbody = el.querySelector('.pu-table tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="text" class="pu-product" placeholder="product_id"></td>
          <td><input type="text" class="pu-currency" value="USD" style="width:60px;"></td>
          <td><input type="number" class="pu-price" value="0" step="0.01" style="width:80px;"></td>
          <td><input type="number" class="pu-qty" value="1" style="width:50px;"></td>
          <td><input type="number" class="pu-offset" value="0" style="width:80px;"></td>
          <td><button type="button" class="btn-small btn-danger pu-remove">×</button></td>
        `;
        tbody.appendChild(row);
        row.querySelector('.pu-remove').addEventListener('click', () => row.remove());
      });
      el.querySelectorAll('.pu-remove').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('tr').remove());
      });
    });
  }

  _bindJsonEvents() {
    // Toggle to form
    this.container.querySelector('.editor-json-toggle').addEventListener('click', () => {
      const textarea = this.container.querySelector('.editor-json-textarea');
      try {
        this.scenario = JSON.parse(textarea.value);
        this.jsonMode = false;
        this.render();
      } catch (err) {
        const errorEl = this.container.querySelector('#editor-json-error');
        errorEl.textContent = 'Invalid JSON: ' + err.message;
        errorEl.style.display = 'block';
      }
    });

    // Save
    this.container.querySelector('.editor-save').addEventListener('click', () => {
      const textarea = this.container.querySelector('.editor-json-textarea');
      try {
        const data = JSON.parse(textarea.value);
        if (!data.name) { alert('Name is required'); return; }
        if (!data.personas || !data.personas.length) { alert('At least one persona is required'); return; }
        this.onSave(data, this.isNew);
      } catch (err) {
        const errorEl = this.container.querySelector('#editor-json-error');
        errorEl.textContent = 'Invalid JSON: ' + err.message;
        errorEl.style.display = 'block';
      }
    });

    // Cancel
    this.container.querySelector('.editor-cancel').addEventListener('click', () => this.onCancel());
  }
}
