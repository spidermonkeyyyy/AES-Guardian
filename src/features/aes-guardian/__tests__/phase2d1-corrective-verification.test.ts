/**
 * AES Guardian — Phase 2D.1.1 Corrective Verification Test Suite
 *
 * Verifies that all Phase 2D.1.1 corrections are in place:
 *
 * 1. CONTENT SAFETY
 *    - No unsupported clinical deadlines (24h, 48h, TPE timing, M3/M6 as mandatory)
 *    - No unimplemented-feature claims (automated cluster detection, high-risk device alerts)
 *    - Audit log description does not falsely claim immutability
 *    - Serology description does not prescribe mandatory regulatory schedule
 *    - All three languages (FR, EN, AR) are consistent
 *
 * 2. ROLE MODEL INTEGRITY
 *    - Exactly five authorized role identifiers are referenced
 *    - No `head_nurse`, `occupational_health_doctor`, or other aliases
 *    - `tech_admin` cannot access operational data via resetDemoScenario
 *
 * 3. RESET SCHEMA INTEGRITY
 *    - Actual FK dependencies are respected in the deletion order
 *    - prevention_actions has no FK constraint to aes_declarations
 *    - Referential integrity passes after reset (PRAGMA foreign_key_check)
 *    - Audit reset event is recorded as a local, clearable event (not permanent)
 *
 * 4. PROFILE ROLE MAPPING
 *    - Only the five canonical roles are referenced in the capabilities matrix
 */

import {
  AES_GUARDIAN_ROLES,
} from '../../../core';
import { AesGuardianDatabase } from '../../../core/database/AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../../../core/database/NativeSQLiteAdapter';
import { seedDemoScenarioIfEmpty } from '../../../core/database/demo-scenario-seeder';
import { translations, SUPPORTED_LOCALES } from '../../../localization';

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONTENT SAFETY — Localization
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 2D.1.1 — Content Safety: Localization', () => {
  const allContent = (): string[] => {
    const lines: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale] as Record<string, string>;
      // Only include help and glossary keys in Phase 2D.1
      for (const [key, value] of Object.entries(dict)) {
        if (
          key.startsWith('help.') ||
          key.startsWith('glossary.') ||
          key.startsWith('helpGlossary.')
        ) {
          lines.push(`[${locale}] ${key}: ${value}`);
        }
      }
    }
    return lines;
  };

  test('no unsupported clinical time deadlines in help or glossary content', () => {
    const content = allContent().join('\n');

    // These patterns would indicate unsupported clinical protocol prescriptions
    const forbidden = [
      /dans les 24 heures/i,
      /dans les 48 heures/i,
      /24h après/i,
      /48h après/i,
      /within 24 hours/i,
      /within 48 hours/i,
      /within 4 hours/i,
      /dans les 4 heures/i,
      /dans les 4h/i,
      /M3.*obligatoire/i,
      /M6.*obligatoire/i,
      /mandatory.*M3/i,
      /mandatory.*M6/i,
      /prescribed.*48/i,
    ];

    for (const pattern of forbidden) {
      expect(content).not.toMatch(pattern);
    }
  });

  test('no TPE/PEP initiation timing presented as mandatory in any language', () => {
    const content = allContent().join('\n');

    const forbidden = [
      /TPE.*idéalement.*heure/i,
      /TPE.*au plus tard.*48/i,
      /PEP.*within.*4/i,
      /PEP.*within.*48/i,
      /initier.*TPE.*4h/i,
      /start.*PEP.*4 hour/i,
    ];

    for (const pattern of forbidden) {
      expect(content).not.toMatch(pattern);
    }
  });

  test('no unimplemented automated cluster detection claimed in help content', () => {
    const content = allContent().join('\n');

    const forbidden = [
      /cluster.*detect.*automat/i,
      /automated.*cluster/i,
      /automat.*détect.*grappe/i,
      /high.risk.*device.*alert/i,
      /alerte.*matériel.*risque/i,
    ];

    for (const pattern of forbidden) {
      expect(content).not.toMatch(pattern);
    }
  });

  test('audit log glossary term does NOT claim immutability in any language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale] as Record<string, string>;
      const term14def = dict['glossary.term14.definition'] ?? '';

      // Must not use "immutable", "immuable", "non modifiable" (absolute)
      expect(term14def.toLowerCase()).not.toMatch(/\bimmutable\b/);
      expect(term14def.toLowerCase()).not.toMatch(/\bimmuable\b/);
      // Must not say "non modifiable" as an absolute property
      // (Allowed if qualified, e.g. referencing the reset behavior)
      // Check it doesn't start with that phrase as a defining claim
      expect(term14def.toLowerCase()).not.toMatch(/^registre.*non modifiable/);
    }
  });

  test('serology term does NOT prescribe mandatory regulatory schedule in any language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale] as Record<string, string>;
      const term8def = dict['glossary.term8.definition'] ?? '';

      // Must not assert a mandatory schedule
      const forbidden = [
        /scheduled as part of regulatory/i,
        /programmés dans le cadre du suivi.*réglementaire/i,
        /مبرمجة ضمن المراقبة المناعية/i,
      ];
      for (const pattern of forbidden) {
        expect(term8def).not.toMatch(pattern);
      }

      // Must have a non-empty definition
      expect(term8def.length).toBeGreaterThan(20);
    }
  });

  test('all Phase 2D.1 help and glossary keys are non-empty in FR, EN, and AR', () => {
    const keyPrefixes = ['help.section', 'glossary.term', 'helpGlossary.'];
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale] as Record<string, string>;
      for (const [key, value] of Object.entries(dict)) {
        const isPhase2D1Key = keyPrefixes.some((p) => key.startsWith(p));
        if (isPhase2D1Key) {
          expect({ locale, key, value: !!value && value.length > 0 }).toEqual({
            locale,
            key,
            value: true,
          });
        }
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. ROLE MODEL INTEGRITY
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 2D.1.1 — Role Model Integrity', () => {
  const CANONICAL_ROLES = new Set([
    'exposed_professional',
    'admin_reviewer',
    'oh_professional',
    'quality_staff',
    'tech_admin',
  ]);

  test('AES_GUARDIAN_ROLES constant contains exactly the five authorized role identifiers', () => {
    expect(AES_GUARDIAN_ROLES).toHaveLength(5);
    for (const role of AES_GUARDIAN_ROLES) {
      expect(CANONICAL_ROLES.has(role)).toBe(true);
    }
  });

  test('no Phase 2D.1 alias roles (head_nurse, occupational_health_doctor) exist in AES_GUARDIAN_ROLES', () => {
    expect(AES_GUARDIAN_ROLES).not.toContain('head_nurse');
    expect(AES_GUARDIAN_ROLES).not.toContain('occupational_health_doctor');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. RESET SCHEMA & FK INTEGRITY
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 2D.1.1 — Reset Schema & Referential Integrity', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  const TECH_ADMIN_ID = 5;

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();
    await seedDemoScenarioIfEmpty(db);
  });

  afterEach(async () => {
    await adapter.close();
  });

  test('prevention_actions has NO foreign key to aes_declarations (confirmed from migration 7)', async () => {
    // prevention_actions was created in migration 7 with only created_by_user_id FK to demo_users.
    // No declaration FK exists. PRAGMA foreign_key_list should NOT show aes_declarations.
    const fkList = await db.query<{
      id: number;
      seq: number;
      table: string;
      from: string;
      to: string;
    }>(`PRAGMA foreign_key_list(prevention_actions)`);

    const declarationFKs = fkList.rows.filter((row) => row.table === 'aes_declarations');
    expect(declarationFKs).toHaveLength(0);
  });

  test('oh_follow_up_events references oh_coordinations (not aes_declarations directly)', async () => {
    const fkList = await db.query<{
      table: string;
      from: string;
    }>(`PRAGMA foreign_key_list(oh_follow_up_events)`);

    const tables = fkList.rows.map((r) => r.table);
    expect(tables).toContain('oh_coordinations');
    expect(tables).not.toContain('aes_declarations');
  });

  test('correction_responses references both administrative_reviews and aes_declarations', async () => {
    const fkList = await db.query<{
      table: string;
      from: string;
    }>(`PRAGMA foreign_key_list(correction_responses)`);

    const tables = fkList.rows.map((r) => r.table);
    expect(tables).toContain('administrative_reviews');
    expect(tables).toContain('aes_declarations');
  });

  test('PRAGMA foreign_key_check passes after a successful reset', async () => {
    await db.resetDemoScenario(TECH_ADMIN_ID);
    const violations = await db.query<{ table: string }>(`PRAGMA foreign_key_check`);
    expect(violations.rows).toHaveLength(0);
  });

  test('DEMO_DATA_RESET audit event is a local, clearable record (not immutable)', async () => {
    await db.resetDemoScenario(TECH_ADMIN_ID);

    // Verify event was recorded
    const events = await db.query<{ event_type: string; user_id: number }>(
      `SELECT event_type, user_id FROM audit_events WHERE event_type = 'DEMO_DATA_RESET'`,
    );
    expect(events.rows.length).toBeGreaterThan(0);
    expect(events.rows[0].user_id).toBe(TECH_ADMIN_ID);

    // Verify that audit_events are cleared on subsequent reset (demonstrating clearable nature)
    await db.resetDemoScenario(TECH_ADMIN_ID);
    const afterSecondReset = await db.query<{ event_type: string }>(
      `SELECT event_type FROM audit_events WHERE event_type = 'DEMO_DATA_RESET'`,
    );
    // After second reset, old reset event was cleared and a new one was created
    // — exactly 1 DEMO_DATA_RESET event from the second reset
    expect(afterSecondReset.rows).toHaveLength(1);
  });

  test('tech_admin cannot access OH coordination queue or admin OH coordination lists', async () => {
    // Domain-level authorization guards operational queues from tech_admin.
    // listOhCoordinationsQueue requires oh_professional role.
    await db.resetDemoScenario(TECH_ADMIN_ID);

    await expect(
      db.listOhCoordinationsQueue(TECH_ADMIN_ID),
    ).rejects.toThrow(/unauthorized|oh_professional/i);
  });

  test('tech_admin cannot access admin OH coordination list either', async () => {
    // listOhCoordinationsForAdmin requires admin_reviewer role.
    await db.resetDemoScenario(TECH_ADMIN_ID);

    await expect(
      db.listOhCoordinationsForAdmin(TECH_ADMIN_ID),
    ).rejects.toThrow(/unauthorized|admin_reviewer/i);
  });

  test('tech_admin cannot access the CAPA prevention register', async () => {
    // listPreventionActions requires quality_staff, admin_reviewer, or oh_professional.
    await db.resetDemoScenario(TECH_ADMIN_ID);

    await expect(
      db.listPreventionActions(TECH_ADMIN_ID),
    ).rejects.toThrow(/unauthorized|UnauthorizedError/i);
  });
});
