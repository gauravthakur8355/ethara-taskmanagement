import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/types";
export declare const projectController: {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findAll(req: AuthenticatedRequest, res: Response): Promise<void>;
    findById(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response): Promise<void>;
    addMember(req: AuthenticatedRequest, res: Response): Promise<void>;
    removeMember(req: AuthenticatedRequest, res: Response): Promise<void>;
};
//# sourceMappingURL=project.controller.d.ts.map