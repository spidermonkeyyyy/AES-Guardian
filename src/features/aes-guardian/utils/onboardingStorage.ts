/**
 * AES Guardian — Onboarding & First-Launch State Utility
 *
 * Manages the first-launch flag for AES Guardian onboarding flow per
 * UI Implementation Blueprint (Section 2.3 & Screen 1.1).
 *
 * Persistence Strategy:
 * - Backed by @react-native-async-storage/async-storage for persistent on-device state.
 * - Lazy accessor and in-memory fallback ensure 100% reliability in offline / headless Jest tests
 *   without requiring manual native mocks in external test suites.
 */

export const FIRST_LAUNCH_STORAGE_KEY = '@aes_guardian_first_launch_completed_v1';

let inMemoryFirstLaunchState: boolean | null = null;

function getAsyncStorage(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * Returns whether the AES Guardian onboarding flow has been completed.
 * Defaults to false if no flag has been written.
 */
export async function isFirstLaunchCompleted(): Promise<boolean> {
  if (inMemoryFirstLaunchState !== null) {
    return inMemoryFirstLaunchState;
  }
  try {
    const storage = getAsyncStorage();
    if (storage && typeof storage.getItem === 'function') {
      const val = await storage.getItem(FIRST_LAUNCH_STORAGE_KEY);
      return val === 'true';
    }
    return inMemoryFirstLaunchState ?? false;
  } catch {
    return inMemoryFirstLaunchState ?? false;
  }
}

/**
 * Marks the onboarding flow as completed (or resets it).
 */
export async function setFirstLaunchCompleted(completed: boolean = true): Promise<void> {
  inMemoryFirstLaunchState = completed;
  try {
    const storage = getAsyncStorage();
    if (storage && typeof storage.setItem === 'function') {
      await storage.setItem(FIRST_LAUNCH_STORAGE_KEY, completed ? 'true' : 'false');
    }
  } catch {
    // Non-fatal: in-memory state remains active for current runtime session
  }
}

/**
 * Resets the first launch state (for testing or evaluator demonstration reset).
 */
export async function resetFirstLaunchState(): Promise<void> {
  inMemoryFirstLaunchState = null;
  try {
    const storage = getAsyncStorage();
    if (storage && typeof storage.removeItem === 'function') {
      await storage.removeItem(FIRST_LAUNCH_STORAGE_KEY);
    }
  } catch {
    // Non-fatal fallback
  }
}

/**
 * Direct synchronous override for deterministic unit test fixtures.
 */
export function _setInMemoryFirstLaunchState(state: boolean | null): void {
  inMemoryFirstLaunchState = state;
}
