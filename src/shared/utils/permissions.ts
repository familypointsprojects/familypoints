import { ParentProfile } from '@/shared/types/family';

/**
 * Returns true if the given parent can manage (edit/delete/approve) an item.
 *
 * Rules:
 * - Owner always can (isOwner === true)
 * - Parent with hasFullPermissions can manage anything
 * - Otherwise only items they created (createdBy === parent.id)
 */
export const canManage = (
  parent: ParentProfile | undefined,
  createdBy: string | undefined,
): boolean => {
  if (!parent) return false;
  if (parent.isOwner) return true;
  if (parent.hasFullPermissions) return true;
  return createdBy === parent.id;
};

/**
 * Returns true if the parent can approve/reject submissions.
 * Same logic as canManage but without createdBy check —
 * limited parents can only approve tasks they created.
 */
export const canApproveSubmission = (
  parent: ParentProfile | undefined,
  taskCreatedBy: string | undefined,
): boolean => canManage(parent, taskCreatedBy);
