import { Pool } from "pg";
import { User } from "../domain/entities/User";
import { UserRole, UserWithOrganization } from "@shared/models";
import { DatabaseError, NotFoundError } from "@shared/service";
import { USER_ROLES } from "@shared/constants";
import bcrypt from "bcrypt";

const ALLOWED_SORT_FIELDS = [
  "id",
  "name",
  "role",
  "created_at",
  "updated_at",
  "organization_id",
];

export class UserRepository {
  constructor(private db: Pool) {}

  async findAll(
    limit: number = 50,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    organization_id?: number,
  ): Promise<{ data: UserWithOrganization[]; total: number }> {
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
    const order = sortOrder === "DESC" ? "DESC" : "ASC";

    let query = `
      SELECT 
        u.id, u.name, u.organization_id, u.password, u.role, u.created_at, u.updated_at,
        o.id as org_id, o.name as org_name, o.created_at as org_created_at, o.updated_at as org_updated_at,
        o.latitude as org_latitude, o.longitude as org_longitude
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (organization_id) {
      query += ` WHERE u.organization_id = $${paramIndex}`;
      params.push(organization_id);
      paramIndex++;
    }

    query += ` ORDER BY ${sortField} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    let countQuery = "SELECT COUNT(*) as total FROM app_users u";
    if (organization_id) {
      countQuery += " WHERE u.organization_id = $1";
    }
    const countParams = organization_id ? [organization_id] : [];

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, params),
      this.db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data: UserWithOrganization[] = dataResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.org_id ? {
        id: row.org_id,
        name: row.org_name,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
        latitude: row.org_latitude,
        longitude: row.org_longitude,
      } : null,
    }));

    return { data, total };
  }

  async findById(id: number): Promise<UserWithOrganization | null> {
    const query = `
      SELECT 
        u.id, u.name, u.organization_id, u.password, u.role, u.created_at, u.updated_at,
        o.id as org_id, o.name as org_name, o.created_at as org_created_at, o.updated_at as org_updated_at,
        o.latitude as org_latitude, o.longitude as org_longitude
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `;
    
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    
    return {
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.org_id ? {
        id: row.org_id,
        name: row.org_name,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
        latitude: row.org_latitude,
        longitude: row.org_longitude,
      } : null,
    };
  }

  async findByName(name: string): Promise<UserWithOrganization | null> {
    const query = `
      SELECT 
        u.id, u.name, u.organization_id, u.password, u.role, u.created_at, u.updated_at,
        o.id as org_id, o.name as org_name, o.created_at as org_created_at, o.updated_at as org_updated_at,
        o.latitude as org_latitude, o.longitude as org_longitude
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.name = $1
    `;
    
    const result = await this.db.query(query, [name]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    
    return {
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.org_id ? {
        id: row.org_id,
        name: row.org_name,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
        latitude: row.org_latitude,
        longitude: row.org_longitude,
      } : null,
    };
  }

  async findByOrganizationId(organizationId: number): Promise<UserWithOrganization[]> {
    const query = `
      SELECT 
        u.id, u.name, u.organization_id, u.password, u.role, u.created_at, u.updated_at,
        o.id as org_id, o.name as org_name, o.created_at as org_created_at, o.updated_at as org_updated_at,
        o.latitude as org_latitude, o.longitude as org_longitude
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.organization_id = $1
      ORDER BY u.id
    `;
    
    const result = await this.db.query(query, [organizationId]);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.org_id ? {
        id: row.org_id,
        name: row.org_name,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
        latitude: row.org_latitude,
        longitude: row.org_longitude,
      } : null,
    }));
  }

  async findByRole(role: UserRole): Promise<UserWithOrganization[]> {
    const query = `
      SELECT 
        u.id, u.name, u.organization_id, u.password, u.role, u.created_at, u.updated_at,
        o.id as org_id, o.name as org_name, o.created_at as org_created_at, o.updated_at as org_updated_at,
        o.latitude as org_latitude, o.longitude as org_longitude
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.role = $1
      ORDER BY u.id
    `;
    
    const result = await this.db.query(query, [role]);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.org_id ? {
        id: row.org_id,
        name: row.org_name,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
        latitude: row.org_latitude,
        longitude: row.org_longitude,
      } : null,
    }));
  }

  async countSuperAdminsInOrganization(organizationId: number): Promise<number> {
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

  async checkOrganizationHasSuperAdmin(organizationId: number): Promise<boolean> {
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

  async save(user: User): Promise<UserWithOrganization> {
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

    return this.findById(result.rows[0].id) as Promise<UserWithOrganization>;
  }

  async update(id: number, user: User): Promise<void> {
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
    limit: number = 50,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    organization_id?: number,
  ): Promise<{ data: UserWithOrganization[]; total: number }> {
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "name";
    const order = sortOrder === "DESC" ? "DESC" : "ASC";

    const searchPattern = `%${queryStr}%`;
    const exactStartPattern = `${queryStr}%`;

    let query = `
      SELECT 
        u.id, u.name, u.organization_id, u.password, u.role, u.created_at, u.updated_at,
        o.id as org_id, o.name as org_name, o.created_at as org_created_at, o.updated_at as org_updated_at,
        o.latitude as org_latitude, o.longitude as org_longitude
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.name ILIKE $1
    `;
    
    const params: any[] = [searchPattern];
    let paramIndex = 2;

    if (organization_id) {
      query += ` AND u.organization_id = $${paramIndex}`;
      params.push(organization_id);
      paramIndex++;
    }

    query += `
      ORDER BY 
        CASE 
          WHEN u.name ILIKE $${paramIndex} THEN 1
          ELSE 2
        END,
        ${sortField} ${order}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    params.push(exactStartPattern, limit, offset);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM app_users u
      WHERE u.name ILIKE $1
    `;
    const countParams: any[] = [searchPattern];

    if (organization_id) {
      countQuery += ` AND u.organization_id = $2`;
      countParams.push(organization_id);
    }

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, params),
      this.db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data: UserWithOrganization[] = dataResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.org_id ? {
        id: row.org_id,
        name: row.org_name,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
        latitude: row.org_latitude,
        longitude: row.org_longitude,
      } : null,
    }));

    return { data, total };
  }
}