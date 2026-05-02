import { ForbiddenError, BadRequestError } from "../errors/AppError";

/**
 * Task State Machine — defines allowed status transitions per role.
 *
 * Flow: TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
 *                                  |
 *                          IN_PROGRESS (admin reject)
 *
 * Members: can only move forward (TODO->IN_PROGRESS, IN_PROGRESS->IN_REVIEW)
 * Admins: can also approve (IN_REVIEW->DONE) or reject (IN_REVIEW->IN_PROGRESS)
 */

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type ProjectRole = "ADMIN" | "MEMBER";

const MEMBER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: [],
  DONE: [],
};

const ADMIN_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE", "IN_PROGRESS"],
  DONE: [],
};

/**
 * Validates a status transition against RBAC rules.
 * Throws BadRequestError for invalid transitions, ForbiddenError for unauthorized ones.
 */
export function validateTaskTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus,
  role: ProjectRole
): void {
  if (currentStatus === newStatus) return;

  const allowedMap = role === "ADMIN" ? ADMIN_TRANSITIONS : MEMBER_TRANSITIONS;
  const allowed = allowedMap[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    const adminAllowed = ADMIN_TRANSITIONS[currentStatus] || [];

    if (!adminAllowed.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Tasks must follow the lifecycle: TODO → IN_PROGRESS → IN_REVIEW → DONE`
      );
    }

    if (newStatus === "DONE" && role === "MEMBER") {
      throw new ForbiddenError(
        "Members cannot mark tasks as DONE. Only admins can approve and complete tasks."
      );
    }

    if (newStatus === "IN_PROGRESS" && currentStatus === "IN_REVIEW" && role === "MEMBER") {
      throw new ForbiddenError(
        "Members cannot reject reviews. Only admins can move tasks from IN_REVIEW back to IN_PROGRESS."
      );
    }

    throw new ForbiddenError(
      `Your role (${role}) does not allow the transition: ${currentStatus} → ${newStatus}`
    );
  }
}

/** Returns allowed next statuses for a given role and current status */
export function getAllowedTransitions(
  currentStatus: TaskStatus,
  role: ProjectRole
): TaskStatus[] {
  const map = role === "ADMIN" ? ADMIN_TRANSITIONS : MEMBER_TRANSITIONS;
  return map[currentStatus] || [];
}

export const transitionLabels: Record<string, string> = {
  "TODO→IN_PROGRESS": "Start Working",
  "IN_PROGRESS→IN_REVIEW": "Submit for Review",
  "IN_REVIEW→DONE": "Approve & Complete",
  "IN_REVIEW→IN_PROGRESS": "Reject (Needs Work)",
};

export function getTransitionLabel(from: TaskStatus, to: TaskStatus): string {
  return transitionLabels[`${from}→${to}`] || `Move to ${to}`;
}
