/**
 * Scenario Engine — builds payloads and runs scenarios via /api/proxy
 */

/**
 * Convert a persona definition into a /users/track payload object.
 */
export function buildPersonaPayload(persona, prefix) {
  const externalId = prefix + persona.id;
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  const attributeObject = {
    external_id: externalId,
    ...persona.attributes
  };

  const eventObjects = (persona.events || []).map(evt => ({
    external_id: externalId,
    name: evt.name,
    time: new Date(now + evt.time_offset_days * msPerDay).toISOString(),
    properties: evt.properties || {}
  }));

  const purchaseObjects = (persona.purchases || []).map(p => ({
    external_id: externalId,
    product_id: p.product_id,
    currency: p.currency,
    price: p.price,
    quantity: p.quantity || 1,
    time: new Date(now + p.time_offset_days * msPerDay).toISOString()
  }));

  return {
    attributes: [attributeObject],
    events: eventObjects.length ? eventObjects : undefined,
    purchases: purchaseObjects.length ? purchaseObjects : undefined
  };
}

/**
 * Deep-clone a persona and inject a trace_id + fired_at timestamp.
 */
export function injectTraceId(persona, traceId, firedAt) {
  return {
    ...persona,
    attributes: { ...persona.attributes, fired_at: firedAt },
    events: persona.events.map(evt => ({
      ...evt,
      properties: { ...evt.properties, trace_id: traceId }
    }))
  };
}

/**
 * Run a scenario — accepts a full scenario object.
 */
export async function runScenario(scenario, prefix, delayMs, apiKey, restEndpoint, onProgress) {
  const results = { success: [], errors: [], traceId: null, firedAt: null };

  for (let i = 0; i < scenario.personas.length; i++) {
    let persona = scenario.personas[i];

    // Inject trace ID for connectivity ping
    if (scenario.id === 'currents-ping') {
      const traceId = crypto.randomUUID();
      const firedAt = new Date().toISOString();
      results.traceId = traceId;
      results.firedAt = firedAt;
      persona = injectTraceId(persona, traceId, firedAt);
    }

    const payload = buildPersonaPayload(persona, prefix);
    const externalId = prefix + persona.id;
    onProgress(i + 1, scenario.personas.length, persona.label, 'sending');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'POST',
          endpoint: '/users/track',
          body: payload,
          apiKey,
          restEndpoint
        })
      });
      const data = await response.json();

      if (data.status >= 200 && data.status < 300) {
        results.success.push({ id: externalId, label: persona.label, badge: persona.badge });
        onProgress(i + 1, scenario.personas.length, persona.label, 'success');
      } else {
        const errMsg = (data.data && data.data.message) || data.statusText || String(data.status);
        results.errors.push({ id: externalId, label: persona.label, detail: errMsg });
        onProgress(i + 1, scenario.personas.length, persona.label, 'error');
      }
    } catch (err) {
      results.errors.push({ id: externalId, label: persona.label, detail: err.message });
      onProgress(i + 1, scenario.personas.length, persona.label, 'error');
    }

    if (i < scenario.personas.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
