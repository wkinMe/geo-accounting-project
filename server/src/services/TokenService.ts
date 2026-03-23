// server/src/services/TokenService.ts
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import { executeQuery, getSingleResult } from "@src/utils";
import { NotFoundError, UnauthorizedError } from "@shared/service";
import { Token } from "@shared/models/Token";
import { UserDataDTO } from "@shared/dto";

export class TokenService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async generateTokens(userData: UserDataDTO) {
    const tokenData = {
      id: userData.id,
      name: userData.name,
      organization_id: userData.organization_id,
      role: userData.role,
    };

    const accessToken = jwt.sign(
      tokenData,
      process.env.JWT_ACCESS_TOKEN_SECRET!,
      { expiresIn: "30m" },
    );

    const refreshToken = jwt.sign(
      tokenData,
      process.env.JWT_REFRESH_TOKEN_SECRET!,
      { expiresIn: "2d" },
    );

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId: number, refreshToken: string) {
    try {
      const token = await getSingleResult<Token>(
        this._db,
        "saveRefreshToken",
        `SELECT * FROM tokens WHERE user_id = $1`,
        [userId],
      );

      if (token) {
        const result = await executeQuery<Token>(
          this._db,
          "saveRefreshToken",
          `UPDATE tokens SET "refreshToken"=$1 WHERE user_id = $2 RETURNING *`,
          [refreshToken, userId],
        );
        return result;
      }

      const result = await executeQuery<Token>(
        this._db,
        "saveRefreshToken",
        `INSERT INTO tokens (user_id, "refreshToken") VALUES ($1, $2) RETURNING *`,
        [userId, refreshToken],
      );
      return result;
    } catch (e: unknown) {
      if (e instanceof NotFoundError) {
        const result = await executeQuery<Token>(
          this._db,
          "saveRefreshToken",
          `INSERT INTO tokens (user_id, "refreshToken") VALUES ($1, $2) RETURNING *`,
          [userId, refreshToken],
        );
        return result;
      }
      throw e;
    }
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    await executeQuery(
      this._db,
      "deleteRefreshToken",
      `DELETE FROM tokens WHERE "refreshToken" = $1`,
      [refreshToken],
    );
  }

  verifyAccessToken(token: string): UserDataDTO {
    try {
      if (!process.env.JWT_ACCESS_TOKEN_SECRET) {
        throw new Error("Secret not configured");
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET,
      ) as UserDataDTO;

      if (!decoded.role) {
        (decoded as any).role = "user";
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Access token expired",
          "verifyAccessToken",
          "TokenService",
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(
          "Invalid access token",
          "verifyAccessToken",
          "TokenService",
        );
      }

      throw new UnauthorizedError(
        "Invalid or expired access token",
        "verifyAccessToken",
        "TokenService",
      );
    }
  }

  verifyRefreshToken(token: string): UserDataDTO {
    try {
      if (!process.env.JWT_REFRESH_TOKEN_SECRET) {
        throw new Error("Secret not configured");
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_TOKEN_SECRET,
      ) as UserDataDTO;

      if (!decoded.role) {
        (decoded as any).role = "user";
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Refresh token expired",
          "verifyRefreshToken",
          "TokenService",
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(
          "Invalid refresh token",
          "verifyRefreshToken",
          "TokenService",
        );
      }
      throw new UnauthorizedError(
        "Invalid or expired refresh token",
        "verifyRefreshToken",
        "TokenService",
      );
    }
  }

  async findRefreshToken(refreshToken: string): Promise<Token> {
    try {
      const token = await getSingleResult<Token>(
        this._db,
        "findRefreshToken",
        `SELECT * FROM tokens WHERE "refreshToken" = $1`,
        [refreshToken],
      );
      return token;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError(
          "Refresh token not found",
          "findRefreshToken",
          "TokenService",
        );
      }
      throw error;
    }
  }

  decodeToken(token: string): UserDataDTO | null {
    try {
      const decoded = jwt.decode(token) as UserDataDTO | null;
      return decoded;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  validateTokenPayload(payload: UserDataDTO): boolean {
    const requiredFields = ["id", "name", "organization_id", "role"];
    return requiredFields.every((field) => field in payload);
  }
}
