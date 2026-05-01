import { Response } from "express";
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, meta?: Record<string, unknown>) => Response;
export declare const sendError: (res: Response, message: string, statusCode?: number, code?: string, errors?: Record<string, string[]>) => Response;
export declare const buildPaginationMeta: (page: number, limit: number, totalCount: number) => Record<string, unknown>;
//# sourceMappingURL=response.d.ts.map