// repositories/RefreshTokenRepository.ts
import { Pool } from "pg";
import { RefreshToken } from "../domain/entities/RefreshToken";

export class RefreshTokenRepository {
  constructor(private db: Pool) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const query =
      'SELECT id, user_id, "refreshToken" FROM tokens WHERE "refreshToken" = $1';
    const result = await this.db.query(query, [token]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new RefreshToken(row.id, row.user_id, row.refreshToken);
  }

  async findByUserId(userId: number): Promise<RefreshToken | null> {
    const query =
      'SELECT id, user_id, "refreshToken" FROM tokens WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new RefreshToken(row.id, row.user_id, row.refreshToken);
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const existing = await this.findByUserId(refreshToken.user_id);

    if (existing) {
      const query = 'UPDATE tokens SET "refreshToken" = $1 WHERE user_id = $2';
      await this.db.query(query, [refreshToken.token, refreshToken.user_id]);

      return new RefreshToken(
        existing.id,
        refreshToken.user_id,
        refreshToken.token,
      );
    }

    const query =
      'INSERT INTO tokens (user_id, "refreshToken") VALUES ($1, $2) RETURNING id';
    const result = await this.db.query(query, [
      refreshToken.user_id,
      refreshToken.token,
    ]);

    return new RefreshToken(
      result.rows[0].id,
      refreshToken.user_id,
      refreshToken.token,
    );
  }

  async delete(token: string): Promise<void> {
    const query = 'DELETE FROM tokens WHERE "refreshToken" = $1';
    await this.db.query(query, [token]);
  }

  async deleteByUserId(userId: number): Promise<void> {
    const query = "DELETE FROM tokens WHERE user_id = $1";
    await this.db.query(query, [userId]);
  }
}
