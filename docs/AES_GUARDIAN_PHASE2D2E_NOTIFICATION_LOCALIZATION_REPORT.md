# AES GUARDIAN — PHASE 2D.2E
## Notification Localization — FR / EN / AR Report

**Date:** 2026-11-14  
**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`  
**Current Schema:** Version 8 (`in_app_notifications` with 11 canonical event types)  
**Status:** COMPLETE & FULLY VERIFIED (100% Pass: 39 Test Suites, 646 Tests)

---

## 1. Executive Summary

Phase 2D.2E implements complete French (`fr`), English (`en`), and Arabic (`ar`) localization for the AES Guardian in-app notification system.

### Key Architectural Achievements:
1. **100% Language-Independent Persistence:**  
   The SQLite schema (Version 8) and database records in `in_app_notifications` store strictly language-agnostic identifiers: `title_key`, `message_key`, and `entity_reference`. No translated text or pre-rendered display strings are persisted to SQLite.
2. **Dynamic Runtime Locale Resolution:**  
   Notification text is resolved at presentation time using the application's existing locale state (`currentLocale`, `getLocale()`, `setLocale()`). Changing application language immediately updates notification titles and messages without rewriting database records.
3. **Full 11-Event Canonical Translation Coverage:**  
   All 11 canonical notification event types have complete, professional, non-empty titles and messages in French, English, and Arabic. Arabic translations use natural healthcare terminology and authentic Arabic script.
4. **Safe Parameter Interpolation:**  
   The pure formatting function `formatNotification()` safely interpolates `{reference}` and any custom parameters. Missing, null, or undefined parameters never produce `'undefined'`, `'null'`, or unreplaced `{...}` tokens; whitespace is automatically normalized.
5. **Predictable Fallback Strategy:**  
   If an unknown key is passed, the system returns the key itself as a documented fallback. If a translation is missing or a locale is unsupported, the system predictably falls back to French (`DEFAULT_LOCALE = 'fr'`) rather than displaying empty or broken text.
6. **Zero Schema or Boundary Drift:**  
   Database migrations, table schema, transaction boundaries, authentication guards, and role authorizations were completely untouched. Schema version remains exactly 8.

---

## 2. Preliminary Audit & Canonical Event Inventory

The AES Guardian notification system defines exactly 11 canonical workflow event types across 6 polymorphic entity types. Every event type is mapped to a dedicated title key and message key following the naming convention `notification.<camelCaseName>.title` and `notification.<camelCaseName>.message`.

### 2.1 Complete Translation Inventory (11 Event Types across FR / EN / AR)

| # | Event Type | Entity Type | Target Role | Translation Keys | French (`fr`) | English (`en`) | Arabic (`ar`) |
|---|---|---|---|---|---|---|---|
| 1 | `declaration_submitted` | `aes_declaration` | `admin_reviewer` | **Title:** `notification.declarationSubmitted.title`<br>**Message:** `notification.declarationSubmitted.message` | **T:** Nouvelle déclaration soumise<br>**M:** La déclaration {reference} a été enregistrée et est en attente de revue administrative. | **T:** New Declaration Submitted<br>**M:** Declaration {reference} has been registered and is pending administrative review. | **T:** تم تقديم بلاغ جديد<br>**M:** تم تسجيل البلاغ {reference} وهو في انتظار المراجعة الإدارية. |
| 2 | `review_completed` | `administrative_review` | `exposed_professional` | **Title:** `notification.reviewCompleted.title`<br>**Message:** `notification.reviewCompleted.message` | **T:** Revue administrative finalisée<br>**M:** La revue administrative de votre déclaration {reference} est terminée. | **T:** Administrative Review Completed<br>**M:** The administrative review for your declaration {reference} has been completed. | **T:** اكتملت المراجعة الإدارية<br>**M:** تم الانتهاء من المراجعة الإدارية للبلاغ {reference}. |
| 3 | `correction_requested` | `administrative_review` | `exposed_professional` | **Title:** `notification.correctionRequested.title`<br>**Message:** `notification.correctionRequested.message` | **T:** Demande de correction<br>**M:** Des précisions sont requises pour votre déclaration {reference}. | **T:** Correction Requested<br>**M:** Clarifications are required for your declaration {reference}. | **T:** طلب تصحيح أو استيضاح<br>**M:** يرجى تقديم استيضاحات إضافية حول البلاغ {reference}. |
| 4 | `correction_submitted` | `correction_response` | `admin_reviewer` | **Title:** `notification.correctionSubmitted.title`<br>**Message:** `notification.correctionSubmitted.message` | **T:** Réponse à la correction transmise<br>**M:** Le déclarant a transmis les éléments de correction pour le dossier {reference}. | **T:** Correction Response Submitted<br>**M:** The declarant has submitted corrections for declaration {reference}. | **T:** تم تقديم الرد على التصحيح<br>**M:** قام صاحب البلاغ بتقديم عناصر التصحيح المطلوبة للملف {reference}. |
| 5 | `oh_coordination_created` | `oh_coordination` | `oh_professional` | **Title:** `notification.ohCoordinationCreated.title`<br>**Message:** `notification.ohCoordinationCreated.message` | **T:** Nouveau dossier SST à coordonner<br>**M:** Un nouveau dossier de coordination SST a été ouvert pour la déclaration {reference}. | **T:** New Occupational Health Case<br>**M:** A new occupational health coordination case has been opened for declaration {reference}. | **T:** ملف جديد للتنسيق بطب العمل<br>**M:** تم فتح ملف تنسيق جديد بطب العمل للبلاغ {reference}. |
| 6 | `oh_coordination_acknowledged` | `oh_coordination` | `exposed_professional` | **Title:** `notification.ohCoordinationAcknowledged.title`<br>**Message:** `notification.ohCoordinationAcknowledged.message` | **T:** Prise en charge SST confirmée<br>**M:** Le service de santé au travail a pris en charge votre dossier {reference}. | **T:** Occupational Health Case Acknowledged<br>**M:** The occupational health service has acknowledged your case {reference}. | **T:** تأكيد استلام ملف طب العمل<br>**M:** تم تأكيد استلام وبدء متابعة ملفكم {reference} من قبل مصلحة طب العمل. |
| 7 | `oh_milestone_recorded` | `oh_follow_up_events` | `exposed_professional` | **Title:** `notification.ohMilestoneRecorded.title`<br>**Message:** `notification.ohMilestoneRecorded.message` | **T:** Étape de suivi SST enregistrée<br>**M:** Une nouvelle étape de suivi a été validée pour votre dossier {reference}. | **T:** Follow-Up Milestone Recorded<br>**M:** A follow-up milestone has been recorded for your case {reference}. | **T:** تسجيل محطة متابعة بطب العمل<br>**M:** تم تسجيل وتأكيد محطة متابعة جديدة لملفكم {reference}. |
| 8 | `oh_coordination_completed` | `oh_coordination` | `exposed_professional` | **Title:** `notification.ohCoordinationCompleted.title`<br>**Message:** `notification.ohCoordinationCompleted.message` | **T:** Suivi SST clôturé<br>**M:** Le suivi de santé au travail pour votre déclaration {reference} est désormais clôturé. | **T:** Occupational Health Case Closed<br>**M:** The occupational health follow-up for your declaration {reference} is now closed. | **T:** إغلاق ملف متابعة طب العمل<br>**M:** تم إغلاق ملف متابعة طب العمل المرتبط بالبلاغ {reference} بنجاح. |
| 9 | `capa_created` | `prevention_action` | `quality_staff` | **Title:** `notification.capaCreated.title`<br>**Message:** `notification.capaCreated.message` | **T:** Action de prévention créée<br>**M:** L'action de prévention {reference} a été enregistrée dans le registre CAPA. | **T:** Prevention Action Created<br>**M:** Prevention action {reference} has been registered in the CAPA register. | **T:** إنشاء إجراء وقائي جديد<br>**M:** تم تسجيل الإجراء الوقائي {reference} في سجل إجراءات الوقاية (CAPA). |
| 10 | `capa_status_changed` | `prevention_action` | `quality_staff` | **Title:** `notification.capaStatusChanged.title`<br>**Message:** `notification.capaStatusChanged.message` | **T:** Statut CAPA actualisé<br>**M:** Le statut de l'action de prévention {reference} a été mis à jour. | **T:** CAPA Status Updated<br>**M:** The status of prevention action {reference} has been updated. | **T:** تحديث حالة إجراء الوقاية<br>**M:** تم تحديث حالة الإجراء الوقائي {reference} في السجل. |
| 11 | `capa_finalized` | `prevention_action` | `quality_staff` | **Title:** `notification.capaFinalized.title`<br>**Message:** `notification.capaFinalized.message` | **T:** Action de prévention finalisée<br>**M:** L'action de prévention {reference} a été finalisée dans le registre CAPA. | **T:** Prevention Action Finalized<br>**M:** Prevention action {reference} has been finalized in the CAPA register. | **T:** اكتمال إجراء الوقاية<br>**M:** تم إتمام وإغلاق الإجراء الوقائي {reference} في سجل (CAPA). |

---

## 3. Formatting Architecture & Locale Resolution

The formatting function is fully decoupled from React hooks, components, and SQLite database operations.

### 3.1 Pure Functions (`src/localization/index.ts`)

```typescript
export interface NotificationFormatOptions {
  locale?: SupportedLocale;
  params?: Record<string, string | number | null | undefined>;
}

export interface FormattedNotification {
  title: string;
  message: string;
}

export function formatNotificationText(
  key: string,
  params?: Record<string, string | number | null | undefined>,
  locale?: SupportedLocale,
): string {
  const activeLocale = locale ?? currentLocale;
  const dict = translations[activeLocale] as Record<string, string> | undefined;
  const fallbackDict = translations[DEFAULT_LOCALE] as Record<string, string>;

  let text = dict?.[key];
  if (!text || text.trim() === '') {
    text = fallbackDict?.[key];
  }
  if (!text || text.trim() === '') {
    return key; // Documented fallback
  }

  // Safe parameter interpolation with automatic whitespace normalization
  return text
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, paramName) => {
      const val = params?.[paramName];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val);
      }
      return '';
    })
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export function formatNotification(
  notification: {
    title_key: string;
    message_key: string;
    entity_reference?: string | null;
  },
  options?: NotificationFormatOptions,
): FormattedNotification {
  const locale = options?.locale ?? currentLocale;
  const combinedParams: Record<string, string | number | null | undefined> = {
    reference: notification.entity_reference ?? undefined,
    entity_reference: notification.entity_reference ?? undefined,
    ...(options?.params ?? {}),
  };

  const title = formatNotificationText(notification.title_key, combinedParams, locale);
  const message = formatNotificationText(notification.message_key, combinedParams, locale);

  return { title, message };
}
```

### 3.2 Interpolation and Missing Parameter Safety
- **When `reference` is provided (`'AES-2026-DEMO-01'`):**  
  `"La déclaration AES-2026-DEMO-01 a été enregistrée et est en attente de revue administrative."`
- **When `reference` is missing (`null` or `undefined`):**  
  The token `{reference}` is safely eliminated, whitespace normalized, and punctuation preserved:  
  `"La déclaration a été enregistrée et est en attente de revue administrative."`  
  No `'undefined'`, `'null'`, or unreplaced `{...}` tokens are ever emitted.
- **When `key` is completely unknown (`'notification.unknownKey.title'`):**  
  Returns `'notification.unknownKey.title'`.

---

## 4. Verification & Test Results

### 4.1 Focused Notification Localization Tests (`notification-localization.test.ts`)
A dedicated test suite was added in `src/features/aes-guardian/__tests__/notification-localization.test.ts` comprising 48 focused unit tests across 5 parts:
1. **Part 1: Completeness across 11 event types:** Verified all 11 event types have non-empty titles and messages in `fr`, `en`, and `ar`. Verified authentic Arabic script (`[\u0600-\u06FF]`) and proper English/French grammar.
2. **Part 2: Parameter interpolation & missing parameter safety:** Verified `{reference}` interpolation in all 3 languages, custom parameter override, and confirmed that `undefined`, `null`, or empty string parameter inputs never produce malformed text or double spaces.
3. **Part 3: Fallback behavior:** Verified that unknown keys return the raw key, and unsupported locales fall back cleanly to French (`DEFAULT_LOCALE`).
4. **Part 4: Language-independence & SQLite persistence:** Created a live in-memory SQLite database, seeded the 4 baseline notifications, proved that SQLite table `in_app_notifications` contains zero translated text, switched locales dynamically (`fr` -> `en` -> `ar` -> `fr`), and proved that SQLite records are bit-for-bit identical before and after language changes.
5. **Part 5: Full workflow compatibility:** Verified all 11 event types format properly with workflow-generated references and contain no confidential data leaks.

**Result:** PASS (48/48 tests).

### 4.2 Subsystem Notification Tests
- `src/core/database/__tests__/notification-workflow.test.ts`: PASS
- `src/core/database/__tests__/notifications.test.ts`: PASS
- `src/core/database/__tests__/notification-workflow-hardening.test.ts`: PASS
- `src/core/database/__tests__/demo-notification-seeding.test.ts`: PASS
- `src/features/aes-guardian/__tests__/notification-localization.test.ts`: PASS  
**Subtotal:** 5 passed, 5 total (185 tests passing).

### 4.3 Full Repository Test Suite
Executed `npx jest --maxWorkers=2 --no-coverage` across all suites:
- **Test Suites:** 39 passed, 39 total (100%)
- **Tests:** 646 passed, 646 total (100%)
- **Snapshots:** 0 total
- **Time:** ~40.28 s

### 4.4 Scoped TypeScript Check
Executed `npx tsc --noEmit --skipLibCheck --jsx react-jsx --esModuleInterop` on all source files in `src/core`, `src/features/aes-guardian`, and `src/localization`:
- **Result:** Exit code 0 (Zero errors).

---

## 5. Working Tree & Git Status

```text
Branch: migration/aes-guardian
HEAD:   d79b01ef51646509170996f8c77517f95470f217

Modified tracked files:
 M src/localization/index.ts
 (existing modified files from preceding phases intact)

Added test file:
 ?? src/features/aes-guardian/__tests__/notification-localization.test.ts
```

No commits, pushes, stashes, or branch switches were executed.

---

## 6. Phase Closeout Notice

Phase 2D.2E objectives are completely fulfilled. The notification localization system is fully implemented in French, English, and Arabic, verified against genuine SQLite persistence, and validated with zero regressions across all 39 test suites.

**Phase 2D.2F has NOT been started.** Awaiting user instruction before proceeding.
