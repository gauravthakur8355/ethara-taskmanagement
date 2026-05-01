import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/types";
export declare const taskController: {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findByProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    findById(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response): Promise<void>;
};
//# sourceMappingURL=task.controller.d.ts.map