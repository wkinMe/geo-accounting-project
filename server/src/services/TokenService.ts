import { Pool } from "pg";
import jwt from "jsonwebtoken";
import { executeQuery, getSingleResult } from "@src/utils";
import { NotFoundError, UnauthorizedError } from "@src/errors/service";
import { Token } from "@shared/models/Token";
import { UserDataDTO } from "@shared/dto";

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
      // Пытаемся найти существующий токен
      const token = await getSingleResult<Token>(
        this._db,
        "saveRefreshToken",
        `SELECT * FROM tokens WHERE user_id = $1`,
        [userId],
      );

      // Если токен найден - обновляем
      if (token) {
        const result = await executeQuery<Token>(
          this._db,
          "saveRefreshToken",
          `UPDATE tokens SET "refreshToken"=$1 WHERE user_id = $2 RETURNING *`,
          [refreshToken, userId],
        );
        return result;
      }

      // Если токен не найден - создаем новый
      const result = await executeQuery<Token>(
        this._db,
        "saveRefreshToken",
        `INSERT INTO tokens (user_id, "refreshToken") VALUES ($1, $2) RETURNING *`,
        [userId, refreshToken],
      );
      return result;
    } catch (e: unknown) {
      // Если произошла ошибка NotFoundError при поиске, все равно пробуем создать
      if (e instanceof NotFoundError) {
        const result = await executeQuery<Token>(
          this._db,
          "saveRefreshToken",
          `INSERT INTO tokens (user_id, "refreshToken") VALUES ($1, $2) RETURNING *`,
          [userId, refreshToken],
        );
        return result;
      }
      // Пробрасываем другие ошибки
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
      console.log("=== Token Verification ===");
      console.log("Token to verify:", token.substring(0, 30) + "...");
      console.log("Current server time:", new Date().toISOString());
      console.log("Current server time (locale):", new Date().toString());

      // Проверим, что секретный ключ вообще есть
      if (!process.env.JWT_ACCESS_TOKEN_SECRET) {
        console.error("JWT_ACCESS_TOKEN_SECRET is not set!");
        throw new Error("Secret not configured");
      }

      // Декодируем без проверки чтобы посмотреть время истечения
      const decodedWithoutVerify = jwt.decode(token, { complete: true });
      if (decodedWithoutVerify) {
        console.log(
          "Token payload (without verify):",
          decodedWithoutVerify.payload,
        );
        console.log(
          "Token expiration time:",
          new Date(
            (decodedWithoutVerify.payload as any).exp * 1000,
          ).toISOString(),
        );
        console.log(
          "Token issued at:",
          new Date(
            (decodedWithoutVerify.payload as any).iat * 1000,
          ).toISOString(),
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET,
      ) as UserDataDTO;

      console.log("Token verified successfully");
      return decoded;
    } catch (error) {
      console.error("=== Token Verification Failed ===");
      console.error("Error:", error);
      console.error("Current server time:", new Date().toISOString());
      console.error("Current server time (locale):", new Date().toString());

      if (error instanceof jwt.TokenExpiredError) {
        console.error("Token expired at:", error.expiredAt.toISOString());
        console.error(
          "Time difference:",
          (new Date().getTime() - error.expiredAt.getTime()) / 1000,
          "seconds ago",
        );
        throw new UnauthorizedError(
          "Access token expired",
          "verifyAccessToken",
          "TokenService",
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        console.error("JWT Error:", error.message);
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
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_TOKEN_SECRET,
      ) as UserDataDTO;
      return decoded;
    } catch (error) {
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
        );
      }
      throw error;
    }
  }
}
