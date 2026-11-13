/**
 * Jest manual mock for @op-engineering/op-sqlite
 *
 * In-memory SQLite-like store for unit tests.
 * Phase 2C.2: Extended to handle all migration SQL patterns.
 */

'use strict';

const _stores = new Map();

function getOrCreateStore(name) {
  if (!_stores.has(name)) {
    _stores.set(name, { tables: new Map(), sequences: new Map() });
  }
  return _stores.get(name);
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function makeRows(arr) {
  return { length: arr.length, item: (i) => arr[i] };
}

function literalValue(tok) {
  if (tok === undefined || tok === null) return null;
  const t = tok.trim();
  if (t.toUpperCase() === 'NULL') return null;
  if (/^strftime\(/i.test(t) || t.toUpperCase() === 'CURRENT_TIMESTAMP') return nowIso();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  const n = Number(t);
  if (!isNaN(n) && t !== '') return n;
  return t;
}

/**
 * Tokenise a VALUES clause into individual tuple strings.
 * Handles multi-line, nested content.
 */
function extractTuples(valuesClause) {
  const tuples = [];
  let depth = 0;
  let current = '';
  let inside = false;
  for (let i = 0; i < valuesClause.length; i++) {
    const ch = valuesClause[i];
    if (ch === '(' && !inside) {
      inside = true;
      depth = 1;
      current = '';
    } else if (inside) {
      if (ch === '(') { depth++; current += ch; }
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          tuples.push(current);
          inside = false;
        } else {
          current += ch;
        }
      } else {
        current += ch;
      }
    }
  }
  return tuples;
}

/**
 * Split a tuple body by commas, respecting single-quoted strings.
 */
function splitTupleValues(tupleBody) {
  const vals = [];
  let current = '';
  let inStr = false;
  for (let i = 0; i < tupleBody.length; i++) {
    const ch = tupleBody[i];
    if (ch === "'" && !inStr) { inStr = true; current += ch; }
    else if (ch === "'" && inStr) { inStr = false; current += ch; }
    else if (ch === ',' && !inStr) { vals.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  if (current.trim() !== '') vals.push(current.trim());
  return vals;
}

function executeOnStore(store, sql, params = []) {
  // Normalise whitespace but preserve structure for regex matching
  const trimmed = sql.trim();
  const compact = trimmed.replace(/\s+/g, ' ');
  const upper = compact.toUpperCase();

  // ── PRAGMA / BEGIN / COMMIT / ROLLBACK ─────────────────────
  if (upper.startsWith('PRAGMA') || /^(BEGIN|COMMIT|ROLLBACK);?$/.test(upper)) {
    return { rowsAffected: 0, rows: makeRows([]) };
  }

  // ── ALTER TABLE ... RENAME TO ───────────────────────────────
  if (upper.startsWith('ALTER TABLE') && upper.includes('RENAME TO')) {
    const m = compact.match(/ALTER TABLE\s+(\w+)\s+RENAME TO\s+(\w+)/i);
    if (m) {
      const [, oldName, newName] = m;
      if (store.tables.has(oldName)) {
        store.tables.set(newName, store.tables.get(oldName));
        store.sequences.set(newName, store.sequences.get(oldName) ?? 1);
        store.tables.delete(oldName);
        store.sequences.delete(oldName);
      }
    }
    return { rowsAffected: 0, rows: makeRows([]) };
  }

  // ── DROP TABLE ──────────────────────────────────────────────
  if (upper.startsWith('DROP TABLE')) {
    const m = compact.match(/DROP TABLE(?:\s+IF EXISTS)?\s+(\w+)/i);
    if (m) { store.tables.delete(m[1]); store.sequences.delete(m[1]); }
    return { rowsAffected: 0, rows: makeRows([]) };
  }

  // ── CREATE INDEX ────────────────────────────────────────────
  if (upper.startsWith('CREATE INDEX') || upper.startsWith('CREATE UNIQUE INDEX')) {
    return { rowsAffected: 0, rows: makeRows([]) };
  }

  // ── CREATE TABLE ────────────────────────────────────────────
  if (upper.startsWith('CREATE TABLE')) {
    const m = compact.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
    if (m && !store.tables.has(m[1])) {
      store.tables.set(m[1], []);
      store.sequences.set(m[1], 1);
    }
    return { rowsAffected: 0, rows: makeRows([]) };
  }

  // ── INSERT ──────────────────────────────────────────────────
  if (upper.startsWith('INSERT')) {
    // Check if this is an INSERT INTO dest (...) SELECT ... FROM src
    const selectMatch = compact.match(/INSERT\s+INTO\s+(\w+)(?:\s*\([^)]+\))?\s+SELECT\s+[\s\S]+?\s+FROM\s+(\w+)/i);
    if (selectMatch) {
      const [, destTable, srcTable] = selectMatch;
      if (store.tables.has(srcTable)) {
        if (!store.tables.has(destTable)) {
          store.tables.set(destTable, []);
          store.sequences.set(destTable, 1);
        }
        const srcRows = store.tables.get(srcTable);
        const destRows = store.tables.get(destTable);
        for (const row of srcRows) {
          destRows.push({ ...row });
        }
        const srcSeq = store.sequences.get(srcTable) ?? 1;
        store.sequences.set(destTable, Math.max(srcSeq, store.sequences.get(destTable) ?? 1));
      }
      return { rowsAffected: 0, rows: makeRows([]) };
    }

    const isOrIgnore = /INSERT\s+OR\s+IGNORE/i.test(compact);

    // Parse: INSERT [OR IGNORE] INTO table (cols) VALUES ...
    const headerMatch = compact.match(
      /INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+)/i
    );
    if (!headerMatch) return { rowsAffected: 0, rows: makeRows([]) };

    const tableName = headerMatch[1];
    const cols = headerMatch[2].split(',').map(c => c.trim());
    const valuesClause = headerMatch[3];

    if (!store.tables.has(tableName)) {
      store.tables.set(tableName, []);
      store.sequences.set(tableName, 1);
    }

    const tuples = extractTuples(valuesClause);
    let paramIdx = 0;
    let inserted = 0;
    let lastInsertId;

    for (const tupleBody of tuples) {
      const values = splitTupleValues(tupleBody);
      const row = {};

      for (let i = 0; i < cols.length; i++) {
        const v = values[i] !== undefined ? values[i].trim() : undefined;
        if (v === '?') {
          row[cols[i]] = params[paramIdx++] ?? null;
        } else {
          row[cols[i]] = literalValue(v);
        }
      }

      const rows = store.tables.get(tableName);

      // UNIQUE constraint check for OR IGNORE
      if (isOrIgnore) {
        let dup = false;
        if (row.username !== undefined && rows.some(r => r.username === row.username)) dup = true;
        if (row.reference_number !== undefined && rows.some(r => r.reference_number === row.reference_number)) dup = true;
        if (dup) continue;
      }

      // Auto ID
      if (row.id === undefined || row.id === null) {
        const seq = store.sequences.get(tableName) || 1;
        row.id = seq;
        store.sequences.set(tableName, seq + 1);
      } else if (typeof row.id === 'number') {
        const seq = store.sequences.get(tableName) || 1;
        if (row.id >= seq) {
          store.sequences.set(tableName, row.id + 1);
        }
      }

      // Timestamp defaults
      const now = nowIso();
      for (const col of cols) {
        if (['created_at', 'updated_at', 'applied_at', 'occurred_at'].includes(col) &&
            (row[col] === undefined || row[col] === null)) {
          row[col] = now;
        }
      }

      rows.push(row);
      lastInsertId = typeof row.id === 'number' ? row.id : undefined;
      inserted++;
    }

    return { rowsAffected: inserted, insertId: lastInsertId, rows: makeRows([]) };
  }

  // ── UPDATE ──────────────────────────────────────────────────
  if (upper.startsWith('UPDATE')) {
    // UPDATE table SET ... WHERE col = ?
    const m = compact.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/is);
    if (!m) return { rowsAffected: 0, rows: makeRows([]) };
    const tableName = m[1];
    if (!store.tables.has(tableName)) return { rowsAffected: 0, rows: makeRows([]) };

    // Parse SET: split by comma but careful with values containing commas
    const setClauses = m[2].split(',').map(s => s.trim());
    let paramIdx = 0;
    const updates = {};
    for (const clause of setClauses) {
      const eqIdx = clause.indexOf('=');
      const col = clause.substring(0, eqIdx).trim();
      const val = clause.substring(eqIdx + 1).trim();
      updates[col] = val === '?' ? (params[paramIdx++] ?? null) : literalValue(val);
    }

    // WHERE: single col = ?
    const whereM = m[3].trim().match(/^(\w+)\s*=\s*\?$/i);
    if (!whereM) return { rowsAffected: 0, rows: makeRows([]) };
    const whereVal = params[paramIdx];
    const whereCol = whereM[1];

    let rowsAffected = 0;
    for (const row of store.tables.get(tableName)) {
      if (String(row[whereCol]) === String(whereVal)) {
        Object.assign(row, updates);
        rowsAffected++;
      }
    }
    return { rowsAffected, rows: makeRows([]) };
  }

  // ── DELETE FROM ─────────────────────────────────────────────
  if (upper.startsWith('DELETE FROM')) {
    const m = compact.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*=\s*\?)?/i);
    if (!m) return { rowsAffected: 0, rows: makeRows([]) };
    const tableName = m[1];
    if (!store.tables.has(tableName)) return { rowsAffected: 0, rows: makeRows([]) };
    const whereCol = m[2];
    const before = store.tables.get(tableName);
    const after = whereCol ? before.filter(r => String(r[whereCol]) !== String(params[0])) : [];
    store.tables.set(tableName, after);
    return { rowsAffected: before.length - after.length, rows: makeRows([]) };
  }

  // ── SELECT ──────────────────────────────────────────────────
  if (upper.startsWith('SELECT')) {
    const tableMatch = compact.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return { rowsAffected: 0, rows: makeRows([]) };
    const tableName = tableMatch[1];
    if (!store.tables.has(tableName)) return { rowsAffected: 0, rows: makeRows([]) };

    let rows = [...store.tables.get(tableName)];

    // ── LEFT JOIN support ───────────────────────────────────────
    // Parse all LEFT JOIN <table> <alias> ON <left>.<col> = <right>.<col>
    const joinRe = /LEFT\s+JOIN\s+(\w+)\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
    let joinMatch;
    while ((joinMatch = joinRe.exec(compact)) !== null) {
      const joinTable = joinMatch[1];
      // const joinAlias = joinMatch[2]; // alias not used directly
      // ON lAlias.lCol = rAlias.rCol — figure out which side is the base table
      const lAlias = joinMatch[3];
      const lCol = joinMatch[4];
      const rAlias = joinMatch[5];
      const rCol = joinMatch[6];

      // Determine which is the join table (the one that is not the FROM table alias)
      // In our queries, base alias is the first letter of the FROM table or its full name
      const joinRows = store.tables.has(joinTable) ? [...store.tables.get(joinTable)] : [];

      // Determine which side references the join table
      // The ON clause: base.foreignKey = joinTable.primaryKey
      // We'll check which alias maps to the FROM table vs join table
      // Simple heuristic: the join table's alias is what LEFT JOIN declared
      const baseCol = lAlias !== joinTable[0] && lAlias !== joinTable ? lCol : rCol;
      const joinKeyCol = lAlias !== joinTable[0] && lAlias !== joinTable ? rCol : lCol;

      rows = rows.map(r => {
        const fkVal = r[baseCol] ?? r[lCol] ?? r[rCol];
        const matched = joinRows.find(j => String(j[joinKeyCol] ?? j[lCol] ?? j[rCol]) === String(fkVal));
        if (matched) {
          // Merge joined columns — joined columns don't overwrite base columns
          const extra = {};
          for (const k of Object.keys(matched)) {
            if (!(k in r)) extra[k] = matched[k];
          }
          return { ...r, ...extra };
        }
        return r;
      });
    }

    // WHERE ... ORDER BY / LIMIT — extract WHERE clause
    const whereMatch = compact.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const clause = whereMatch[1].trim();
      const parts = clause.split(/\s+AND\s+/i);
      let pIdx = 0;
      for (const part of parts) {
        const trimmedPart = part.trim();
        // table.col = ? or alias.col = ? or plain col = ?
        const eqM = trimmedPart.match(/^(?:\w+\.)?(\w+)\s*=\s*\?$/i);
        if (eqM) {
          const val = params[pIdx++];
          rows = rows.filter(r => String(r[eqM[1]]) === String(val));
          continue;
        }
        // col = 'literal'
        const eqLit = trimmedPart.match(/^(?:\w+\.)?(\w+)\s*=\s*['"]([^'"]+)['"]$/i);
        if (eqLit) {
          rows = rows.filter(r => String(r[eqLit[1]]) === String(eqLit[2]));
          continue;
        }
        // col IN ('a','b',...)
        const inM = trimmedPart.match(/^(?:\w+\.)?(\w+)\s+IN\s*\(([^)]+)\)/i);
        if (inM) {
          const vals = inM[2].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
          rows = rows.filter(r => vals.includes(String(r[inM[1]])));
          continue;
        }
      }
    }

    // ORDER BY col DESC|ASC or alias.col DESC|ASC
    const orderMatch = compact.match(/ORDER\s+BY\s+(?:\w+\.)?(\w+)\s*(DESC|ASC)?(?:\s*,\s*(?:\w+\.)?(\w+)\s*(DESC|ASC)?)?/i);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = (orderMatch[2] || 'ASC').toUpperCase();
      const col2 = orderMatch[3];
      const dir2 = orderMatch[4] ? orderMatch[4].toUpperCase() : dir;
      rows.sort((a, b) => {
        const av = a[col] ?? '';
        const bv = b[col] ?? '';
        if (av < bv) return dir === 'ASC' ? -1 : 1;
        if (av > bv) return dir === 'ASC' ? 1 : -1;
        if (col2) {
          const av2 = a[col2] ?? '';
          const bv2 = b[col2] ?? '';
          if (av2 < bv2) return dir2 === 'ASC' ? -1 : 1;
          if (av2 > bv2) return dir2 === 'ASC' ? 1 : -1;
        }
        if (a.id !== undefined && b.id !== undefined) {
          return dir === 'ASC' ? a.id - b.id : b.id - a.id;
        }
        return 0;
      });
    }

    // COUNT(*) support
    const countMatch = compact.match(/^SELECT\s+COUNT\(\*\)(?:\s+AS\s+(\w+))?/i);
    if (countMatch) {
      const colName = countMatch[1] || 'count';
      return { rowsAffected: 0, rows: makeRows([{ [colName]: rows.length }]) };
    }

    // LIMIT n | LIMIT ?
    const limitMatch = compact.match(/LIMIT\s+(\d+|\?)/i);
    if (limitMatch) {
      const lim = limitMatch[1] === '?'
        ? (Number(params[params.length - 1]) || 100)
        : parseInt(limitMatch[1], 10);
      rows = rows.slice(0, lim);
    }

    return { rowsAffected: 0, rows: makeRows(rows) };
  }

  return { rowsAffected: 0, rows: makeRows([]) };
}

function open({ name }) {
  const store = getOrCreateStore(name);
  return {
    execute(sql, params = []) { return executeOnStore(store, sql, params); },
    close() { /* preserve store for persistence simulation */ },
  };
}

function clearAllMockStores() { _stores.clear(); }

module.exports = { open, clearAllMockStores };
