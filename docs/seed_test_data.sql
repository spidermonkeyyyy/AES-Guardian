DELETE FROM oh_follow_up_events;
DELETE FROM oh_coordinations;
DELETE FROM correction_responses;
DELETE FROM administrative_reviews;
DELETE FROM aes_declarations;

INSERT INTO aes_declarations (id, reference_number, declared_by_user_id, incident_date, incident_type, status, department_code, submitted_at, created_at, updated_at) VALUES
(1, 'AES-2026-0001', 1, '2026-09-15T10:00:00Z', 'percutaneous_exposure', 'submitted', 'URG', '2026-09-15T11:00:00Z', '2026-09-15T10:00:00Z', '2026-09-15T11:00:00Z'),
(2, 'AES-2026-0002', 1, '2026-10-02T14:30:00Z', 'mucocutaneous_exposure', 'under_review', 'CHIR', '2026-10-02T15:00:00Z', '2026-10-02T14:30:00Z', '2026-10-02T15:00:00Z'),
(3, 'AES-2026-0003', 1, '2026-10-20T08:15:00Z', 'percutaneous_exposure', 'correction_requested', 'REA', '2026-10-20T09:00:00Z', '2026-10-20T08:15:00Z', '2026-10-20T09:00:00Z'),
(4, 'AES-2026-0004', 1, '2026-11-05T12:00:00Z', 'percutaneous_exposure', 'closed', 'MED', '2026-11-05T12:30:00Z', '2026-11-05T12:00:00Z', '2026-11-05T12:30:00Z');

INSERT INTO administrative_reviews (id, declaration_id, reviewer_user_id, outcome, comments, correction_reason, reviewed_at, created_at) VALUES
(1, 2, 2, 'acknowledged', 'Revue administrative initiale', NULL, '2026-10-02T16:00:00Z', '2026-10-02T16:00:00Z'),
(2, 3, 2, 'correction_requested', 'Précisions nécessaires', 'incomplete_information', '2026-10-21T09:00:00Z', '2026-10-21T09:00:00Z');

INSERT INTO correction_responses (id, declaration_id, review_id, responding_user_id, response_text, responded_at) VALUES
(1, 3, 2, 1, 'Détails des circonstances ajoutés', '2026-10-21T11:00:00Z');

INSERT INTO oh_coordinations (id, declaration_id, created_by_user_id, coordination_reason, status, acknowledged_by_user_id, acknowledged_at, completed_by_user_id, completed_at, created_at, updated_at) VALUES
(1, 2, 2, 'routine_followup', 'acknowledged', 3, '2026-10-03T08:00:00Z', NULL, NULL, '2026-10-02T16:30:00Z', '2026-10-03T08:00:00Z'),
(2, 4, 2, 'specialized_evaluation', 'completed', 3, '2026-11-05T14:00:00Z', 3, '2026-11-10T16:00:00Z', '2026-11-05T13:00:00Z', '2026-11-10T16:00:00Z');

INSERT INTO oh_follow_up_events (id, coordination_id, event_category, event_date, recorded_by_user_id, administrative_note, created_at) VALUES
(1, 1, 'consultation_recorded', '2026-10-03T10:00:00Z', 3, 'Consultation initiale réalisée', '2026-10-03T10:00:00Z'),
(2, 2, 'follow_up_continued', '2026-11-06T09:00:00Z', 3, 'Contrôle sérologique enregistré', '2026-11-06T09:00:00Z'),
(3, 2, 'follow_up_completed', '2026-11-10T14:00:00Z', 3, 'Suivi clôturé par le médecin SST', '2026-11-10T14:00:00Z');
