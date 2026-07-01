import { Request, Response, NextFunction } from "express";
export declare const verifyToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireStudent: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOrganiser: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOrganiserOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireStudentOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth-middleware.d.ts.map