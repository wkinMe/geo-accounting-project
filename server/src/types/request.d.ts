// server/src/types/express.ts
import { UserDataDTO } from "@shared/dto";
import { Request } from "express";

export interface RequestWithUser extends Request {
  user?: UserDataDTO;
}
