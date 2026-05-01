export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type ProjectRole = "ADMIN" | "MEMBER";
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
export declare function validateTaskTransition(currentStatus: TaskStatus, newStatus: TaskStatus, role: ProjectRole): void;
/**
 * Get the list of allowed next statuses for a given role and current status.
 * Used by the frontend to show only valid action buttons.
 */
export declare function getAllowedTransitions(currentStatus: TaskStatus, role: ProjectRole): TaskStatus[];
/**
 * Human-readable label for transition actions (for UI/logs)
 */
export declare const transitionLabels: Record<string, string>;
export declare function getTransitionLabel(from: TaskStatus, to: TaskStatus): string;
//# sourceMappingURL=taskStateMachine.d.ts.map