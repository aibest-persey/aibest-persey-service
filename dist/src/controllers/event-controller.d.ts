import { Request, Response } from "express";
export declare const createEvent: (req: Request, res: Response) => Promise<void>;
export declare const getEventFormOptions: (req: Request, res: Response) => Promise<void>;
export declare const listEvents: (req: Request, res: Response) => Promise<void>;
export declare const getEvent: (req: Request, res: Response) => Promise<void>;
export declare const updateEvent: (req: Request, res: Response) => Promise<void>;
export declare const publishEvent: (req: Request, res: Response) => Promise<void>;
export declare const unpublishEvent: (req: Request, res: Response) => Promise<void>;
export declare const cancelEvent: (req: Request, res: Response) => Promise<void>;
export declare const deleteEvent: (req: Request, res: Response) => Promise<void>;
export declare const registerForEvent: (req: Request, res: Response) => Promise<void>;
export declare const cancelRegistration: (req: Request, res: Response) => Promise<void>;
export declare const getMyRegistrations: (req: Request, res: Response) => Promise<void>;
export declare const getTicket: (req: Request, res: Response) => Promise<void>;
export declare const getParticipants: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=event-controller.d.ts.map