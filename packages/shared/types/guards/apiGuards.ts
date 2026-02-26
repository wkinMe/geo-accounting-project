import { ErrorResponse } from "@t/api";
import { SuccessResponse } from "../api/response";

export function isSuccessResponse<T>(obj: any): obj is SuccessResponse<T> {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "data" in obj &&
    "message" in obj &&
    typeof obj.message === "string"
  );
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !("data" in obj) &&
    "message" in obj &&
    typeof obj.message === "string"
  );
}
