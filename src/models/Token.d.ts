export const TokenTypes = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export type TokenType = (typeof TokenTypes)[keyof typeof TokenTypes];

export interface Token extends BaseModel {
  user_id: number;
  token: string;
  token_type: TokenType;
  expires_at: Date;
  created_at: Date;
  is_revoked: boolean;
}
