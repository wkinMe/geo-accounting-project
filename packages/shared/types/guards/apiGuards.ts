import type { ErrorResponse } from "@shared/types";
import type { SuccessResponse } from "@shared/types";

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
