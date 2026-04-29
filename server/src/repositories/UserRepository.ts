// repositories/UserRepository.ts
import { Pool } from "pg";
import { User } from "../domain/entities/User";
import { UserRole } from "@shared/models";
import { DatabaseError, NotFoundError } from "@shared/service";
import { USER_ROLES } from "@shared/constants";
import bcrypt from "bcrypt";

export class UserRepository {
  constructor(private db: Pool) {}

  async findAll(): Promise<User[]> {
    const query = `
      SELECT id, name, organization_id, password, role, created_at, updated_at
      FROM app_users ORDER BY id
    `;
    const result = await this.db.query(query);

    return result.rows.map(
      (row) =>
        new User(
          row.id,
          row.name,
          row.password,
          row.role,
          row.organization_id,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, name, organization_id, password, role, created_at, updated_at
      FROM app_users WHERE id = $1
    `;
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new User(
      row.id,
      row.name,
      row.password,
      row.role,
      row.organization_id,
      row.created_at,
      row.updated_at,
    );
  }

  async findByName(name: string): Promise<User | null> {
    const query = `
      SELECT id, name, organization_id, password, role, created_at, updated_at
      FROM app_users WHERE name = $1
    `;
    const result = await this.db.query(query, [name]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new User(
      row.id,
      row.name,
      row.password,
      row.role,
      row.organization_id,
      row.created_at,
      row.updated_at,
    );
  }

  async findByOrganizationId(organizationId: number): Promise<User[]> {
    const query = `
      SELECT id, name, organization_id, password, role, created_at, updated_at
      FROM app_users WHERE organization_id = $1 ORDER BY id
    `;
    const result = await this.db.query(query, [organizationId]);

    return result.rows.map(
      (row) =>
        new User(
          row.id,
          row.name,
          row.password,
          row.role,
          row.organization_id,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const query = `
      SELECT id, name, organization_id, password, role, created_at, updated_at
      FROM app_users WHERE role = $1 ORDER BY id
    `;
    const result = await this.db.query(query, [role]);

    return result.rows.map(
      (row) =>
        new User(
          row.id,
          row.name,
          row.password,
          row.role,
          row.organization_id,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async countSuperAdminsInOrganization(
    organizationId: number,
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM app_users
      WHERE organization_id = $1 AND role = $2
    `;
    const result = await this.db.query(query, [
      organizationId,
      USER_ROLES.SUPER_ADMIN,
    ]);
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async checkOrganizationHasSuperAdmin(
    organizationId: number,
  ): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM app_users 
        WHERE organization_id = $1 AND role = $2
      ) as has_super_admin
    `;
    const result = await this.db.query(query, [
      organizationId,
      USER_ROLES.SUPER_ADMIN,
    ]);
    return result.rows[0]?.has_super_admin || false;
  }

  async save(user: User): Promise<User> {
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const query = `
      INSERT INTO app_users (name, organization_id, password, role) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      user.name,
      user.organization_id,
      hashedPassword,
      user.role,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Не удалось создать пользователя",
        "save",
        "UserRepository",
      );
    }

    return new User(
      result.rows[0].id,
      user.name,
      hashedPassword,
      user.role,
      user.organization_id,
      result.rows[0].created_at,
      result.rows[0].updated_at,
    );
  }

  async update(id: number, user: User): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (user.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(user.name);
    }
    if (user.organization_id !== undefined) {
      updates.push(`organization_id = $${paramIndex++}`);
      values.push(user.organization_id);
    }
    if (user.password !== undefined) {
      const salt = await bcrypt.genSalt(8);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    if (user.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(user.role);
    }

    if (updates.length === 0) {
      throw new Error("Нет полей для обновления");
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE app_users 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING updated_at
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Пользователь с ID ${id} не найден`,
        "User",
        id.toString(),
      );
    }

    return new User(
      id,
      user.name,
      user.password,
      user.role,
      user.organization_id,
      user.created_at,
      result.rows[0].updated_at,
    );
  }

  async delete(id: number): Promise<void> {
    const query = "DELETE FROM app_users WHERE id = $1 RETURNING id";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Пользователь с ID ${id} не найден`,
        "User",
        id.toString(),
      );
    }
  }

  async search(
    queryStr: string,
    organization_id?: number,
    limit: number = 50,
  ): Promise<User[]> {
    let query = `
    SELECT id, name, organization_id, password, role, created_at, updated_at
    FROM app_users 
    WHERE name ILIKE $1
  `;
    const params: any[] = [`%${queryStr}%`];
    let paramIndex = 2;

    if (organization_id) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organization_id);
      paramIndex++;
    }

    query += `
    ORDER BY 
      CASE 
        WHEN name ILIKE $${paramIndex} THEN 1
        ELSE 2
      END,
      name
    LIMIT $${paramIndex + 1}
  `;
    params.push(`${queryStr}%`, limit);

    const result = await this.db.query(query, params);

    return result.rows.map(
      (row) =>
        new User(
          row.id,
          row.name,
          row.password,
          row.role,
          row.organization_id,
          row.created_at,
          row.updated_at,
        ),
    );
  }
}
