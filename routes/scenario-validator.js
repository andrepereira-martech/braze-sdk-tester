export function validateScenario(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Scenario must be an object'] };
  }

  if (!obj.name || typeof obj.name !== 'string' || !obj.name.trim()) {
    errors.push('name is required and must be a non-empty string');
  }

  if (!Array.isArray(obj.personas) || obj.personas.length < 1) {
    errors.push('personas must be an array with at least 1 entry');
  } else {
    obj.personas.forEach((p, i) => {
      if (!p.id || typeof p.id !== 'string') {
        errors.push(`personas[${i}].id is required and must be a string`);
      }
      if (!p.label || typeof p.label !== 'string') {
        errors.push(`personas[${i}].label is required and must be a string`);
      }
      if (!p.attributes || typeof p.attributes !== 'object') {
        errors.push(`personas[${i}].attributes is required and must be an object`);
      }

      if (p.events && !Array.isArray(p.events)) {
        errors.push(`personas[${i}].events must be an array`);
      } else if (p.events) {
        p.events.forEach((e, j) => {
          if (!e.name || typeof e.name !== 'string') {
            errors.push(`personas[${i}].events[${j}].name is required`);
          }
          if (typeof e.time_offset_days !== 'number') {
            errors.push(`personas[${i}].events[${j}].time_offset_days must be a number`);
          }
        });
      }

      if (p.purchases && !Array.isArray(p.purchases)) {
        errors.push(`personas[${i}].purchases must be an array`);
      } else if (p.purchases) {
        p.purchases.forEach((pu, j) => {
          if (!pu.product_id) errors.push(`personas[${i}].purchases[${j}].product_id is required`);
          if (!pu.currency) errors.push(`personas[${i}].purchases[${j}].currency is required`);
          if (typeof pu.price !== 'number') errors.push(`personas[${i}].purchases[${j}].price must be a number`);
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
