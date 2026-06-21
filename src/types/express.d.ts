import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: "student" | "organiser";
        iat?: number;
        exp?: number;
      } & JwtPayload;
    }
  }
}

export {};