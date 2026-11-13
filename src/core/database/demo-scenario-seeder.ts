/**
 * AES Guardian Demonstration Scenario Seeder
 *
 * Provides a reproducible, idempotent synthetic demonstration dataset that
 * exercises all 6 operational phases of AES Guardian:
 *
 * 1. Declaration submitted (ready for admin review)
 * 2. Declaration in correction cycle (with review requesting precision)
 * 3. Declaration under review + active SST coordination with follow-up events
 * 4. Declaration closed with completed SST coordination
 * 5. Surveillance aggregates reflecting multi-status, multi-category incidents
 * 6. Structured prevention & corrective actions (CAPA register)
 *
 * IDEMPOTENCY GUARANTEE:
 * This seeder verifies existing records and only inserts if demonstration
 * declarations are missing. It never duplicates records, never deletes historical data,
 * and never resets the database.
 */

import { AesGuardianDatabase } from './AesGuardianDatabase';

export interface SeedResult {
  seeded: boolean;
  declarationsCount: number;
  preventionActionsCount: number;
}

export async function seedDemoScenarioIfEmpty(db: AesGuardianDatabase): Promise<SeedResult> {
  // Check if demonstration scenario declarations already exist
  const existingDecl = await db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM aes_declarations WHERE reference_number LIKE 'AES-2026-DEMO-%'`,
  );

  const declCount = existingDecl.rows[0]?.count ?? 0;

  if (declCount < 4) {
    // ────────────────────────────────────────────────────────────────────────
    // 1. Declaration 1: Newly submitted percutaneous incident
    // ────────────────────────────────────────────────────────────────────────
    const res1 = await db.execute(
      `INSERT OR IGNORE INTO aes_declarations (
         reference_number, declared_by_user_id, incident_date, incident_type,
         circumstances, exposure_description, protective_measures_taken,
         department_code, notes, status, submitted_at, created_at, updated_at
       ) VALUES (
         'AES-2026-DEMO-01', 1, '2026-11-10', 'percutaneous_exposure',
         'Piqûre accidentelle lors du recapuchonnage d''une aiguille usagée après prélèvement veineux.',
         'Aiguille creuse de calibre 21G souillée de sang veineux. Perforation du gant en latex.',
         'Gants simples en latex portés. Collecteur pour objets piquants/tranchants situé à distance.',
         'MED-INT', 'Déclaration immédiate transmise pour examen administratif.',
         'submitted', '2026-11-10T09:15:00Z', '2026-11-10T09:10:00Z', '2026-11-10T09:15:00Z'
       )`,
    );

    const decl1Id = res1.insertId ?? (await db.query<{ id: number }>(
      `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`,
    )).rows[0]?.id;

    if (decl1Id) {
      await db.execute(
        `INSERT OR IGNORE INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('declaration_submitted', 1, 'aes_declaration', ?, 'Déclaration AES-2026-DEMO-01 soumise par le professionnel', '2026-11-10T09:15:00Z')`,
        [decl1Id],
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. Declaration 2: Splash exposure with correction requested
    // ────────────────────────────────────────────────────────────────────────
    const res2 = await db.execute(
      `INSERT OR IGNORE INTO aes_declarations (
         reference_number, declared_by_user_id, incident_date, incident_type,
         circumstances, exposure_description, protective_measures_taken,
         department_code, notes, status, submitted_at, created_at, updated_at
       ) VALUES (
         'AES-2026-DEMO-02', 1, '2026-11-11', 'mucocutaneous_exposure',
         'Projection oculaire de liquide biologique lors d''une aspiration chez un patient agité en réanimation.',
         'Projection au niveau de l''œil droit sans barrière de protection faciale.',
         'Masque chirurgical et gants portés. Absence de lunettes de protection.',
         'REA-01', 'Attente de précisions suite à revue administrative.',
         'correction_requested', '2026-11-11T14:30:00Z', '2026-11-11T14:20:00Z', '2026-11-11T16:00:00Z'
       )`,
    );

    const decl2Id = res2.insertId ?? (await db.query<{ id: number }>(
      `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-02'`,
    )).rows[0]?.id;

    if (decl2Id) {
      await db.execute(
        `INSERT OR IGNORE INTO administrative_reviews (
           declaration_id, reviewer_user_id, outcome, comments, correction_reason, reviewed_at, created_at
         ) VALUES (
           ?, 2, 'correction_requested',
           'Examen administratif initial : rinçage non précisé.',
           'Veuillez préciser le délai effectif du rinçage oculaire immédiat au sérum physiologique et les mesures prises sur place.',
           '2026-11-11T16:00:00Z', '2026-11-11T16:00:00Z'
         )`,
        [decl2Id],
      );

      await db.execute(
        `INSERT OR IGNORE INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('review_recorded', 2, 'aes_declaration', ?, 'Revue administrative enregistrée: correction demandée', '2026-11-11T16:00:00Z')`,
        [decl2Id],
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. Declaration 3: Incident under review + Active SST Coordination
    // ────────────────────────────────────────────────────────────────────────
    const res3 = await db.execute(
      `INSERT OR IGNORE INTO aes_declarations (
         reference_number, declared_by_user_id, incident_date, incident_type,
         circumstances, exposure_description, protective_measures_taken,
         department_code, notes, status, submitted_at, created_at, updated_at
       ) VALUES (
         'AES-2026-DEMO-03', 1, '2026-11-05', 'percutaneous_exposure',
         'Blessure avec trocart de perfusion lors d''une pose de voie veineuse périphérique en urgence.',
         'Perforation face palmaire de l''index gauche avec trocart souillé.',
         'Gants en latex.',
         'URG-02', 'Dossier transmis au service de Santé au Travail pour prise en charge.',
         'under_review', '2026-11-05T08:45:00Z', '2026-11-05T08:30:00Z', '2026-11-05T10:30:00Z'
       )`,
    );

    const decl3Id = res3.insertId ?? (await db.query<{ id: number }>(
      `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`,
    )).rows[0]?.id;

    if (decl3Id) {
      await db.execute(
        `INSERT OR IGNORE INTO administrative_reviews (
           declaration_id, reviewer_user_id, outcome, comments, reviewed_at, created_at
         ) VALUES (
           ?, 2, 'acknowledged',
           'Déclaration administrativement recevable. Transmission SST initiée.',
           '2026-11-05T09:30:00Z', '2026-11-05T09:30:00Z'
         )`,
        [decl3Id],
      );

      const coordRes = await db.execute(
        `INSERT OR IGNORE INTO oh_coordinations (
           declaration_id, created_by_user_id, coordination_reason, status,
           acknowledged_by_user_id, acknowledged_at, created_at, updated_at
         ) VALUES (
           ?, 2, 'specialized_evaluation', 'acknowledged',
           3, '2026-11-05T10:30:00Z', '2026-11-05T09:35:00Z', '2026-11-05T10:30:00Z'
         )`,
        [decl3Id],
      );

      const coordId = coordRes.insertId ?? (await db.query<{ id: number }>(
        `SELECT id FROM oh_coordinations WHERE declaration_id = ?`,
        [decl3Id],
      )).rows[0]?.id;

      if (coordId) {
        await db.execute(
          `INSERT OR IGNORE INTO oh_follow_up_events (
             coordination_id, recorded_by_user_id, event_category, event_date, administrative_note, created_at
           ) VALUES
           (?, 3, 'appointment_coordinated', '2026-11-05T11:00:00Z', 'Bilan sérologique initial réalisé à H+2 (VIH, VHB, VHC). Conforme au protocole.', '2026-11-05T11:00:00Z'),
           (?, 3, 'consultation_recorded', '2026-11-05T11:30:00Z', 'Consultation médicale spécialisée en Santé au Travail. Statut vaccinal vérifié.', '2026-11-05T11:30:00Z')`,
          [coordId, coordId],
        );

        await db.execute(
          `INSERT OR IGNORE INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
           VALUES ('coordination_acknowledged', 3, 'oh_coordination', ?, 'Coordination SST prise en charge par le médecin du travail', '2026-11-05T10:30:00Z')`,
          [coordId],
        );
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. Declaration 4: Cut exposure closed with completed SST follow-up
    // ────────────────────────────────────────────────────────────────────────
    const res4 = await db.execute(
      `INSERT OR IGNORE INTO aes_declarations (
         reference_number, declared_by_user_id, incident_date, incident_type,
         circumstances, exposure_description, protective_measures_taken,
         department_code, notes, status, submitted_at, created_at, updated_at
       ) VALUES (
         'AES-2026-DEMO-04', 1, '2026-10-15', 'percutaneous_exposure',
         'Coupure superficielle avec une lame de bistouri lors du déballage d''un plateau d''instruments.',
         'Plaie superficielle éminence thénar main droite.',
         'Double paire de gants chirurgicaux.',
         'BLOC-CENTRAL', 'Dossier clos après suivi sérologique complet.',
         'closed', '2026-10-15T11:00:00Z', '2026-10-15T10:45:00Z', '2026-11-01T15:00:00Z'
       )`,
    );

    const decl4Id = res4.insertId ?? (await db.query<{ id: number }>(
      `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-04'`,
    )).rows[0]?.id;

    if (decl4Id) {
      await db.execute(
        `INSERT OR IGNORE INTO administrative_reviews (
           declaration_id, reviewer_user_id, outcome, comments, reviewed_at, created_at
         ) VALUES (
           ?, 2, 'acknowledged', 'Déclaration conforme. Prise en charge chirurgicale immédiate et SST.', '2026-10-15T11:30:00Z', '2026-10-15T11:30:00Z'
         )`,
        [decl4Id],
      );

      const coordRes4 = await db.execute(
        `INSERT OR IGNORE INTO oh_coordinations (
           declaration_id, created_by_user_id, coordination_reason, status,
           acknowledged_by_user_id, acknowledged_at, completed_by_user_id, completed_at,
           created_at, updated_at
         ) VALUES (
           ?, 2, 'serology_monitoring', 'completed',
           3, '2026-10-15T12:00:00Z', 3, '2026-11-01T15:00:00Z',
           '2026-10-15T11:35:00Z', '2026-11-01T15:00:00Z'
         )`,
        [decl4Id],
      );

      const coordId4 = coordRes4.insertId ?? (await db.query<{ id: number }>(
        `SELECT id FROM oh_coordinations WHERE declaration_id = ?`,
        [decl4Id],
      )).rows[0]?.id;

      if (coordId4) {
        await db.execute(
          `INSERT OR IGNORE INTO oh_follow_up_events (
             coordination_id, recorded_by_user_id, event_category, event_date, administrative_note, created_at
           ) VALUES
           (?, 3, 'appointment_coordinated', '2026-10-15T12:30:00Z', 'Prélèvement sérologique initial réalisé.', '2026-10-15T12:30:00Z'),
           (?, 3, 'consultation_recorded', '2026-11-01T14:00:00Z', 'Contrôle sérologique complet négatif.', '2026-11-01T14:00:00Z'),
           (?, 3, 'follow_up_completed', '2026-11-01T15:00:00Z', 'Clôture clinique du dossier SST.', '2026-11-01T15:00:00Z')`,
          [coordId4, coordId4, coordId4],
        );
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Ensure baseline Prevention & Corrective Actions (CAPA) exist
  // ──────────────────────────────────────────────────────────────────────────
  const existingCapa = await db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM prevention_actions`,
  );

  const capaCount = existingCapa.rows[0]?.count ?? 0;

  if (capaCount < 5) {
    await db.execute(
      `INSERT OR IGNORE INTO prevention_actions (
         id, reference_code, title, description, action_type,
         contributing_factor, rationale, status, created_by_user_id,
         surveillance_reference, created_at, updated_at
       ) VALUES
       (1, 'CAPA-2026-00001', 'Dotation en collecteurs de sécurité',
        'Installation de collecteurs d''aiguilles sécurisés à hauteur des yeux dans chaque box de soins.',
        'preventive', 'waste_disposal_container',
        'Observation récurrente d''accidents lors de l''élimination immédiate des aiguilles en médecine.',
        'in_progress', 4, 'SURV-2026-Q1-SHARPS', '2026-11-12T19:17:00Z', '2026-11-12T19:17:00Z'),

       (2, 'CAPA-2026-00002', 'Protocole port double paire de gants au bloc',
        'Diffusion du protocole standardisé de double gantage pour les interventions à haut risque d''exposition.',
        'corrective', 'procedure_compliance',
        'Incidence de coupures per-opératoires constatée au bloc central.',
        'in_progress', 4, 'SURV-2026-Q1-CUTS', '2026-11-12T19:17:00Z', '2026-11-12T19:17:00Z'),

       (3, 'CAPA-2026-00003', 'Mise à niveau procédure élimination seringues',
        'Rappel des bonnes pratiques d''élimination sans recapuchonnage auprès des équipes soignantes.',
        'corrective', 'training_supervision',
        'Deux piqûres évitables rapportées suite à un recapuchonnage d''aiguille.',
        'completed', 4, 'SURV-2026-Q1-SHARPS', '2026-11-12T19:17:00Z', '2026-11-12T20:00:00Z'),

       (4, 'CAPA-2026-00004', 'Installation de conteneurs sécurisés d''urgence',
        'Dotation des chariots d''urgence en boîtes rigides anti-perforation.',
        'preventive', 'waste_disposal_container',
        'Amélioration de l''accessibilité immédiate du matériel d''élimination en réanimation.',
        'completed', 4, 'SURV-2026-Q1-ERGONOMICS', '2026-11-12T20:19:47Z', '2026-11-12T20:19:47Z'),

       (5, 'CAPA-2026-00005', 'Sensibilisation au port de surblouses',
        'Session de formation sur les équipements de protection individuelle lors des gestes à risque.',
        'preventive', 'protective_equipment',
        'Prévention des projections muqueuses et cutanées.',
        'cancelled', 4, 'SURV-2026-Q1-SPLASH', '2026-11-12T20:19:47Z', '2026-11-12T20:19:47Z')`,
    );

    // Update completed_at and notes for completed/cancelled
    await db.execute(
      `UPDATE prevention_actions
       SET completed_at = '2026-11-10T14:30:00Z', completion_notes = 'Formation réalisée pour 45 soignants. Procédure validée.'
       WHERE id = 3`,
    );
    await db.execute(
      `UPDATE prevention_actions
       SET completed_at = '2026-11-12T20:19:47Z', completion_notes = 'Installation terminée et vérifiée dans les 12 services prioritaires.'
       WHERE id = 4`,
    );
    await db.execute(
      `UPDATE prevention_actions
       SET completion_notes = 'Annulation suite à révision du protocole de service.'
       WHERE id = 5`,
    );
  }

  const finalDecl = await db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM aes_declarations`,
  );
  const finalCapa = await db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM prevention_actions`,
  );

  return {
    seeded: declCount < 4 || capaCount < 5,
    declarationsCount: finalDecl.rows[0]?.count ?? 0,
    preventionActionsCount: finalCapa.rows[0]?.count ?? 0,
  };
}
