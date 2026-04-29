// services/TokenService.ts
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@shared/service";
import { UserDataDTO } from "@shared/dto";

export class TokenService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;

  constructor() {
    if (
      !process.env.JWT_ACCESS_TOKEN_SECRET ||
      !process.env.JWT_REFRESH_TOKEN_SECRET
    ) {
      throw new Error("JWT secrets not configured");
    }
    this.accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
  }

  generateTokens(userData: UserDataDTO): {
    accessToken: string;
    refreshToken: string;
  } {
    const tokenData = {
      id: userData.id,
      name: userData.name,
      organization_id: userData.organization_id ?? null,
      role: userData.role,
    };

    const accessToken = jwt.sign(tokenData, this.accessTokenSecret, {
      expiresIn: "30m",
    });
    const refreshToken = jwt.sign(tokenData, this.refreshTokenSecret, {
      expiresIn: "2d",
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): UserDataDTO {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as UserDataDTO;
      if (!decoded.role) {
        (decoded as any).role = "user";
      }
      // Убеждаемся, что organization_id есть, даже если null
      if (decoded.organization_id === undefined) {
        (decoded as any).organization_id = null;
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Срок действия токена истёк",
          "verifyAccessToken",
          "TokenService",
        );
      }
      throw new UnauthorizedError(
        "Неверный токен доступа",
        "verifyAccessToken",
        "TokenService",
      );
    }
  }

  verifyRefreshToken(token: string): UserDataDTO {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as UserDataDTO;
      if (!decoded.role) {
        (decoded as any).role = "user";
      }
      if (decoded.organization_id === undefined) {
        (decoded as any).organization_id = null;
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Срок действия refresh токена истёк",
          "verifyRefreshToken",
          "TokenService",
        );
      }
      throw new UnauthorizedError(
        "Неверный refresh токен",
        "verifyRefreshToken",
        "TokenService",
      );
    }
  }

  decodeToken(token: string): UserDataDTO | null {
    try {
      const decoded = jwt.decode(token) as UserDataDTO | null;
      if (decoded && decoded.organization_id === undefined) {
        (decoded as any).organization_id = null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  validateTokenPayload(payload: UserDataDTO): boolean {
    const requiredFields = ["id", "name", "organization_id", "role"];
    return requiredFields.every((field) => field in payload);
  }
}
