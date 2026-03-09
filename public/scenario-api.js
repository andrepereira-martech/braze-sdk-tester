/**
 * HTTP client for scenario CRUD
 */

const BASE = '/api/scenarios';

export async function fetchScenarios() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function fetchScenario(id) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Scenario not found');
  return res.json();
}

export async function createScenario(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create scenario');
  return json;
}

export async function updateScenario(id, data) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update scenario');
  return json;
}

export async function deleteScenario(id) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete scenario');
  return json;
}

export async function cloneScenario(id, newName) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to clone scenario');
  return json;
}

export function exportScenarioUrl(id) {
  return `${BASE}/${encodeURIComponent(id)}/export`;
}

export async function importScenario(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/import`, {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to import scenario');
  return json;
}
