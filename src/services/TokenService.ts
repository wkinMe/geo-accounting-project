import { Pool } from "pg";
import jwt from "jsonwebtoken";
import { UserDataDTO } from "@src/dto/UserDTO";
import { executeQuery, getSingleResult } from "@src/utils";
import { NotFoundError } from "@src/errors/service";
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
      { expiresIn: "1h" },
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
          `UPDATE tokens SET refreshToken=$1 WHERE user_id=$2`,
          [refreshToken, userId],
        );
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
}
