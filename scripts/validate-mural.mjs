import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultJson = resolve(siteRoot, 'data/mural.json');

const ALLOWED_ITEM_KEYS = new Set([
  'id',
  'titulo',
  'resumo',
  'categoria',
  'data_evento',
  'prazo',
  'local',
  'url',
  'atualizado_em',
]);

const FORBIDDEN_KEYS = new Set([
  'submitted_by',
  'pending_review',
  'discarded',
  'active',
  'ranking_data',
]);

export function validateMural(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return ['O snapshot do mural deve ser um objeto JSON.'];
  }
  if (!Array.isArray(payload.itens)) {
    return ['Campo "itens" ausente ou inválido no snapshot do mural.'];
  }
  if (typeof payload.atualizado_em !== 'string') {
    errors.push('Campo "atualizado_em" ausente ou inválido no snapshot do mural.');
  }
  if (typeof payload.total !== 'number' || payload.total !== payload.itens.length) {
    errors.push(`Campo "total" (${payload.total}) diverge da quantidade de itens (${payload.itens.length}).`);
  }
  const seenIds = new Set();
  for (let i = 0; i < payload.itens.length; i += 1) {
    const item = payload.itens[i];
    const ctx = `itens[${i}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${ctx}: item inválido.`);
      continue;
    }
    for (const key of Object.keys(item)) {
      if (FORBIDDEN_KEYS.has(key) || !ALLOWED_ITEM_KEYS.has(key)) {
        errors.push(`${ctx}: campo não permitido no snapshot público: ${key}.`);
      }
    }
    for (const req of ['id', 'titulo', 'categoria']) {
      if (typeof item[req] !== 'string' || !item[req].trim()) {
        errors.push(`${ctx}: campo obrigatório vazio: ${req}.`);
      }
    }
    if (typeof item.url === 'string' && item.url.trim()) {
      if (!/^https?:\/\//i.test(item.url.trim())) {
        errors.push(`${ctx}: url inválida ou com protocolo não permitido (${item.url}).`);
      }
    }
    if (typeof item.id === 'string' && item.id.trim()) {
      if (seenIds.has(item.id)) errors.push(`${ctx}: id duplicado (${item.id}).`);
      seenIds.add(item.id);
    }
  }
  return errors;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  }
}

if (isMainModule()) {
  const jsonPath = resolve(process.argv[2] || defaultJson);
  try {
    const payload = JSON.parse(readFileSync(jsonPath, 'utf8'));
    const errors = validateMural(payload);
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else {
      console.log(`Mural público válido: ${payload.total} aviso(s), somente campos públicos.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
