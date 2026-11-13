/**
 * AES Guardian Audit Logger
 *
 * Thin wrapper around AesGuardianDatabase.logAuditEvent that provides
 * typed, named event helpers for consistent audit trail creation.
 *
 * DISCLAIMER: Audit records stored here are local to the device SQLite
 * database. They are NOT legally immutable, NOT cryptographically signed,
 * and NOT tamper-proof. They should be treated as operational coordination
 * records for demonstration purposes only.
 */

import { getDatabase } from '../database';
import type { AuditEvent } from '../database';

export type AuditEventType =
  | 'APP_STARTED'
  | 'DB_INITIALIZED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'DECLARATION_DRAFT_CREATED'
  | 'DECLARATION_DRAFT_UPDATED'
  | 'DECLARATION_SUBMITTED'
  | 'DECLARATION_DELETED'
  | 'ADMIN_REVIEW_STARTED'
  | 'ADMIN_REVIEW_RECORDED'
  | 'CORRECTION_REQUESTED'
  | 'CORRECTION_RESPONSE_SUBMITTED'
  | 'ADMIN_REREVIEW_RECORDED'
  | 'OH_COORDINATION_CREATED'
  | 'OH_COORDINATION_ACKNOWLEDGED'
  | 'OH_COORDINATION_COMPLETED'
  | 'OH_FOLLOW_UP_EVENT_RECORDED'
  | 'NAVIGATION'
  | 'ERROR';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: number | null;
  entityType?: string | null;
  entityId?: number | null;
  /**
   * Human-readable description.
   * Must NOT contain complete declaration contents, patient data,
   * clinical details, or unnecessary sensitive information.
   */
  description: string;
}

/**
 * Log an audit event to the local database.
 * Errors are caught and logged to console so audit failures never crash features.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const db = getDatabase();
    await db.logAuditEvent({
      event_type: entry.eventType,
      user_id: entry.userId ?? null,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      description: entry.description,
    });
  } catch (err) {
    console.warn('[AuditLogger] Failed to write audit event:', err);
  }
}

/** List recent audit events, newest first. */
export async function listRecentAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const db = getDatabase();
  return db.listAuditEvents(limit);
}
