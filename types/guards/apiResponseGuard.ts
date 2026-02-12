import { SuccessResponse } from "../api/response";

export function isSuccessResponse(obj: any): obj is SuccessResponse {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "data" in obj &&
    "message" in obj &&
    typeof obj.message === "string"
  );
}
