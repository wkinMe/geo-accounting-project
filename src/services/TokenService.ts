import { Pool } from "pg";
import jwt from "jsonwebtoken";
import { UserDataDTO } from "@src/dto/UserDTO";
import { executeQuery, getSingleResult } from "@src/utils";
import { NotFoundError, UnauthorizedError } from "@src/errors/service";
import { Token } from "@src/models/Token";

export class TokenService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async generateTokens(userData: UserDataDTO) {
    const accessToken = jwt.sign(
      userData,
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" },
    );
    const refreshToken = jwt.sign(
      userData,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      { expiresIn: "2d" },
    );

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId: number, refreshToken: string) {
    try {
      const token = await getSingleResult<Token>(
        this._db,
        "saveRefreshToken",
        `SELECT * FROM tokens WHERE user_id=$1`,
        [userId],
      );
      if (token) {
        const result = await executeQuery<Token>(
          this._db,
          "saveRefreshToken",
          `UPDATE tokens SET refreshToken=$1 WHERE user_id=$2 RETURNING *`,
          [refreshToken, userId],
        );
        return result;
      }
    } catch (e: unknown) {
      if (e instanceof NotFoundError) {
        const result = await executeQuery(
          this._db,
          "saveRefreshToken",
          `INSERT INTO tokens(user_id, refreshToken) VALUES($1, $2) RETURNING *`,
          [userId, refreshToken],
        );
        return result;
      }
    }
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    await executeQuery(
      this._db,
      "deleteRefreshToken",
      `DELETE FROM tokens WHERE refreshToken = $1`,
      [refreshToken],
    );
  }

  verifyAccessToken(token: string): UserDataDTO {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET,
      ) as UserDataDTO;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError(
        "Invalid or expired access token",
        "verifyAccessToken",
      );
    }
  }

  verifyRefreshToken(token: string): UserDataDTO {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_TOKEN_SECRET,
      ) as UserDataDTO;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError(
        "Invalid or expired refresh token",
        "verifyRefreshToken",
      );
    }
  }

  async findRefreshToken(refreshToken: string): Promise<Token> {
    try {
      const token = await getSingleResult<Token>(
        this._db,
        "findRefreshToken",
        `SELECT * FROM tokens WHERE refreshToken = $1`,
        [refreshToken],
      );
      return token;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError(
          "Refresh token not found",
          "findRefreshToken",
        );
      }
      throw error;
    }
  }
}
