import { UserRole } from '../../../types/auth';

export function isValidRole(role: string): role is UserRole {
  return ['patient', 'nurse', 'pneumologist', 'admin'].includes(role);
}

export function isNurseSideRole(role: UserRole | null | undefined): boolean {
  return role === 'nurse' || role === 'pneumologist' || role === 'admin';
}
