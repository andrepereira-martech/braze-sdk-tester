import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, '..', 'scenarios', 'templates');
// On Vercel the deployment filesystem is read-only; use /tmp for custom scenarios (ephemeral per instance)
const CUSTOM_DIR = process.env.VERCEL
  ? join('/tmp', 'braze-api-tester-scenarios')
  : join(__dirname, '..', 'scenarios', 'custom');

async function ensureCustomDir() {
  await mkdir(CUSTOM_DIR, { recursive: true });
}

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function readDir(dir) {
  try {
    const files = await readdir(dir);
    return files.filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
}

export async function listAll() {
  const [templateFiles, customFiles] = await Promise.all([
    readDir(TEMPLATES_DIR),
    readDir(CUSTOM_DIR)
  ]);

  const templates = await Promise.all(
    templateFiles.map(async f => {
      const data = await readJsonFile(join(TEMPLATES_DIR, f));
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category || 'Custom',
        isTemplate: true,
        personaCount: (data.personas || []).length
      };
    })
  );

  const custom = await Promise.all(
    customFiles.map(async f => {
      const data = await readJsonFile(join(CUSTOM_DIR, f));
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category || 'Custom',
        isTemplate: false,
        personaCount: (data.personas || []).length
      };
    })
  );

  return [...templates, ...custom];
}

export async function readScenario(id) {
  // Check templates first
  const templatePath = join(TEMPLATES_DIR, id + '.json');
  try {
    return await readJsonFile(templatePath);
  } catch { /* not found in templates */ }

  // Then custom
  const customPath = join(CUSTOM_DIR, id + '.json');
  try {
    return await readJsonFile(customPath);
  } catch { /* not found */ }

  return null;
}

export async function writeScenario(id, data) {
  await ensureCustomDir();
  const filePath = join(CUSTOM_DIR, id + '.json');
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

export async function deleteScenario(id) {
  // Check if it's a template — reject
  const templatePath = join(TEMPLATES_DIR, id + '.json');
  try {
    await readFile(templatePath);
    return { deleted: false, reason: 'Cannot delete a template scenario' };
  } catch { /* not a template, proceed */ }

  const customPath = join(CUSTOM_DIR, id + '.json');
  try {
    await unlink(customPath);
    return { deleted: true };
  } catch {
    return { deleted: false, reason: 'Scenario not found' };
  }
}

export function isTemplate(id) {
  try {
    // Synchronous check not ideal, but we use readScenario for the async path
    return readDir(TEMPLATES_DIR).then(files => files.includes(id + '.json'));
  } catch {
    return Promise.resolve(false);
  }
}
