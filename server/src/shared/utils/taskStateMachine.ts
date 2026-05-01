import { ForbiddenError, BadRequestError } from "../errors/AppError";

// ══════════════════════════════════════════════════════════════
// Task State Machine — Strict RBAC Transition Rules
//
// This is the SINGLE SOURCE OF TRUTH for what status transitions
// are allowed and who can perform them.
//
// ┌───────┐    ┌──────────────┐    ┌───────────┐    ┌──────┐
// │  TODO │───>│ IN_PROGRESS  │───>│ IN_REVIEW │───>│ DONE │
// └───────┘    └──────────────┘    └───────────┘    └──────┘
//                   ▲                    │
//                   └────────────────────┘
//                     (ADMIN reject only)
//
// MEMBER:
//   TODO → IN_PROGRESS    ✅  (start working)
//   IN_PROGRESS → IN_REVIEW ✅  (submit for review)
//   anything else          ❌  FORBIDDEN
//
// ADMIN:
//   TODO → IN_PROGRESS    ✅  (override / start)
//   IN_PROGRESS → IN_REVIEW ✅  (override / submit)
//   IN_REVIEW → DONE      ✅  (approve & complete)
//   IN_REVIEW → IN_PROGRESS ✅  (reject back)
//   anything else          ❌  INVALID
//
// NOTE: No one can skip states (e.g., TODO → DONE is ALWAYS invalid)
// ══════════════════════════════════════════════════════════════

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type ProjectRole = "ADMIN" | "MEMBER";

// ─── Allowed transition maps per role ───

const MEMBER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: [],         // members CANNOT mark as done
  DONE: [],              // done is done
};

const ADMIN_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE", "IN_PROGRESS"],  // approve OR reject
  DONE: [],                             // re-open not supported in v1
};

/**
 * Validate a task status transition against the strict RBAC rules.
 *
 * @param currentStatus  - the task's current status
 * @param newStatus      - the requested new status
 * @param role           - the user's role in the project (ADMIN or MEMBER)
 *
 * @throws BadRequestError  if the transition is structurally invalid
 * @throws ForbiddenError   if the user's role doesn't allow this transition
 */
export function validateTaskTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus,
  role: ProjectRole
): void {
  // same status = no-op, allow silently
  if (currentStatus === newStatus) return;

  // get the allowed transitions for this role
  const allowedMap = role === "ADMIN" ? ADMIN_TRANSITIONS : MEMBER_TRANSITIONS;
  const allowed = allowedMap[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    // figure out WHY it failed for a useful error message
    const adminAllowed = ADMIN_TRANSITIONS[currentStatus] || [];

    if (!adminAllowed.includes(newStatus)) {
      // structurally invalid — even admins can't do this
      throw new BadRequestError(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Tasks must follow the lifecycle: TODO → IN_PROGRESS → IN_REVIEW → DONE`
      );
    }

    // the transition exists but this role can't do it
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

/**
 * Get the list of allowed next statuses for a given role and current status.
 * Used by the frontend to show only valid action buttons.
 */
export function getAllowedTransitions(
  currentStatus: TaskStatus,
  role: ProjectRole
): TaskStatus[] {
  const map = role === "ADMIN" ? ADMIN_TRANSITIONS : MEMBER_TRANSITIONS;
  return map[currentStatus] || [];
}

/**
 * Human-readable label for transition actions (for UI/logs)
 */
export const transitionLabels: Record<string, string> = {
  "TODO→IN_PROGRESS": "Start Working",
  "IN_PROGRESS→IN_REVIEW": "Submit for Review",
  "IN_REVIEW→DONE": "Approve & Complete",
  "IN_REVIEW→IN_PROGRESS": "Reject (Needs Work)",
};

export function getTransitionLabel(from: TaskStatus, to: TaskStatus): string {
  return transitionLabels[`${from}→${to}`] || `Move to ${to}`;
}
