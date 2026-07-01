import { Request, Response } from "express";
export declare const createOrganisation: (req: Request, res: Response) => Promise<void>;
export declare const listOrganisations: (req: Request, res: Response) => Promise<void>;
export declare const getOrganisation: (req: Request, res: Response) => Promise<void>;
export declare const getOrganisationMembers: (req: Request, res: Response) => Promise<void>;
export declare const addOrganisationMember: (req: Request, res: Response) => Promise<void>;
export declare const updateOrganisationMember: (req: Request, res: Response) => Promise<void>;
export declare const removeOrganisationMember: (req: Request, res: Response) => Promise<void>;
export declare const requestToJoinOrganisation: (req: Request, res: Response) => Promise<void>;
export declare const listJoinRequestsForOrg: (req: Request, res: Response) => Promise<void>;
export declare const getMyJoinRequests: (req: Request, res: Response) => Promise<void>;
export declare const approveJoinRequest: (req: Request, res: Response) => Promise<void>;
export declare const rejectJoinRequest: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=organisation-controller.d.ts.map