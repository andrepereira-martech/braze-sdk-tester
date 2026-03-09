import { Router } from 'express';
import multer from 'multer';
import { listAll, readScenario, writeScenario, deleteScenario, isTemplate } from './scenario-store.js';
import { validateScenario } from './scenario-validator.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

// List all scenarios
router.get('/', async (req, res) => {
  try {
    const scenarios = await listAll();
    res.json(scenarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single scenario
router.get('/:id', async (req, res) => {
  try {
    const scenario = await readScenario(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    res.json(scenario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new custom scenario
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const { valid, errors } = validateScenario(data);
    if (!valid) return res.status(400).json({ error: 'Validation failed', errors });

    // Generate ID from name if not provided
    if (!data.id) {
      data.id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    data.isTemplate = false;

    // Check for ID collision
    const existing = await readScenario(data.id);
    if (existing) {
      return res.status(409).json({ error: 'A scenario with this ID already exists' });
    }

    const saved = await writeScenario(data.id, data);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a custom scenario
router.put('/:id', async (req, res) => {
  try {
    if (await isTemplate(req.params.id)) {
      return res.status(403).json({ error: 'Cannot edit a template scenario. Clone it first.' });
    }

    const existing = await readScenario(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Scenario not found' });

    const data = req.body;
    const { valid, errors } = validateScenario(data);
    if (!valid) return res.status(400).json({ error: 'Validation failed', errors });

    data.id = req.params.id;
    data.isTemplate = false;
    const saved = await writeScenario(req.params.id, data);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a custom scenario
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteScenario(req.params.id);
    if (!result.deleted) {
      return res.status(result.reason.includes('template') ? 403 : 404).json({ error: result.reason });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clone a scenario
router.post('/:id/clone', async (req, res) => {
  try {
    const source = await readScenario(req.params.id);
    if (!source) return res.status(404).json({ error: 'Scenario not found' });

    const newName = req.body.name || source.name + ' (Copy)';
    const newId = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const clone = {
      ...source,
      id: newId,
      name: newName,
      isTemplate: false
    };

    // Avoid ID collision
    const existing = await readScenario(newId);
    if (existing) {
      clone.id = newId + '-' + Date.now();
    }

    const saved = await writeScenario(clone.id, clone);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export a scenario as a downloadable JSON file
router.get('/:id/export', async (req, res) => {
  try {
    const scenario = await readScenario(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${scenario.id}.json"`);
    res.json(scenario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import a scenario from uploaded JSON file
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    let data;

    if (req.file) {
      data = JSON.parse(req.file.buffer.toString('utf-8'));
    } else if (req.body && req.body.name && req.body.personas) {
      data = req.body;
    } else {
      return res.status(400).json({ error: 'No file uploaded and no scenario data in body' });
    }

    const { valid, errors } = validateScenario(data);
    if (!valid) return res.status(400).json({ error: 'Validation failed', errors });

    if (!data.id) {
      data.id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    data.isTemplate = false;

    // Avoid collision
    const existing = await readScenario(data.id);
    if (existing) {
      data.id = data.id + '-' + Date.now();
    }

    const saved = await writeScenario(data.id, data);
    res.status(201).json(saved);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON file' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
