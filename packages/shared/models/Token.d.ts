export const TokenTypes = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export type TokenType = (typeof TokenTypes)[keyof typeof TokenTypes];

export interface Token extends BaseModel {
  user_id: number;
  refreshToken: string;
}
