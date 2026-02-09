import { Pool } from "pg";
import { Organization, User, UserWithOrganization } from "../models";
import bcrypt from "bcrypt";
import { CreateUserDTO, UpdateUserDTO } from "../dto/UserDTO";
import Fuse, { IFuseOptions } from "fuse.js";

export class UserService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<UserWithOrganization[]> {
    const query = `
      SELECT 
        row_to_json(u.*) as user,
        row_to_json(o.*) as organization
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.id
    `;

    const result = await this._db.query<{
      user: User;
      organization: Organization;
    }>(query);

    return result.rows.map((row) => ({
      ...row.user,
      organization: row.organization,
    }));
  }

  async findById(id: number): Promise<UserWithOrganization> {
    const query = `
      SELECT 
        row_to_json(u.*) as user,
        row_to_json(o.*) as organization
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `;

    const result = await this._db.query<{
      user: User;
      organization: Organization;
    }>(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    const row = result.rows[0];

    return {
      ...row.user,
      organization: row.organization,
    };
  }

  async createUser({
    name,
    organization_id,
    password,
    is_admin = false,
  }: CreateUserDTO): Promise<User> {
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    const createQuery = `
      INSERT INTO app_users (name, organization_id, password, is_admin) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const createResult = await this._db.query<User>(createQuery, [
      name,
      organization_id,
      hashedPassword,
      is_admin,
    ]);

    if (createResult.rows.length === 0) {
      throw new Error("Failed to create user");
    }

    return createResult.rows[0];
  }

  async updateUser({
    id,
    name,
    organization_id,
    password,
    is_admin,
  }: UpdateUserDTO): Promise<User> {
    const existingUser = this.findById(id);

    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Обрабатываем каждое поле, если оно передано
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (organization_id !== undefined) {
      updates.push(`organization_id = $${paramIndex}`);
      values.push(organization_id);
      paramIndex++;
    }

    if (password !== undefined) {
      const salt = await bcrypt.genSalt(8);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push(`password = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }

    if (is_admin !== undefined) {
      updates.push(`is_admin = $${paramIndex}`);
      values.push(is_admin);
      paramIndex++;
    }

    // Если нет полей для обновления, возвращаем текущего пользователя
    if (updates.length === 0) {
      const result = await this._db.query<User>(
        "SELECT * FROM app_users WHERE id = $1",
        [id],
      );
      if (result.rows.length === 0) {
        throw new Error("User not found");
      }
      return result.rows[0];
    }

    // Добавляем ID в конец значений
    values.push(id);

    const updateQuery = `
      UPDATE app_users 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updateResult = await this._db.query<User>(updateQuery, values);

    if (updateResult.rows.length === 0) {
      throw new Error("User not found");
    }

    return updateResult.rows[0];
  }

  async deleteUser(id: number): Promise<User> {
    const deleteResult = await this._db.query<User>(
      "DELETE FROM app_users WHERE id = $1 RETURNING *",
      [id],
    );

    if (deleteResult.rows.length === 0) {
      throw new Error("User not found");
    }

    return deleteResult.rows[0];
  }

  async findByOrganizationId(orgId: number): Promise<UserWithOrganization[]> {
    const query = `
      SELECT 
        row_to_json(u.*) as user,
        row_to_json(o.*) as organization
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.organization_id = $1
      ORDER BY u.id
    `;

    const result = await this._db.query<{
      user: User;
      organization: Organization;
    }>(query, [orgId]);

    return result.rows.map((row) => ({
      ...row.user,
      organization: row.organization,
    }));
  }

  async findAdmins(): Promise<UserWithOrganization[]> {
    const query = `
      SELECT 
        row_to_json(u.*) as user,
        row_to_json(o.*) as organization
      FROM app_users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.is_admin = true
      ORDER BY u.id
    `;

    const result = await this._db.query<{
      user: User;
      organization: Organization;
    }>(query);

    return result.rows.map((row) => ({
      ...row.user,
      organization: row.organization,
    }));
  }

  // Метод для получения доступных менеджеров (пользователей, которых можно назначить)
  async getAvailableManagers(organizationId?: number): Promise<User[]> {
    let query = `
    SELECT u.*, o.name as organization_name
    FROM app_user u
    INNER JOIN organizations o ON u.org_id = o.id
    WHERE u.is_admin = false OR u.is_admin = true
  `;

    const values = [];

    if (organizationId !== undefined) {
      query += " AND u.org_id = $1";
      values.push(organizationId);
    }

    query += " ORDER BY u.name";

    const result = await this._db.query<User>(query, values);
    return result.rows;
  }

  async searchUsers(input: string): Promise<User[]> {
    // Сначала получаем всех пользователей
    const query = `
      SELECT 
        u.*,
        row_to_json(o.*) as organization
      FROM app_user u
      LEFT JOIN organizations o ON u.org_id = o.id
    `;

    const result = await this._db.query<UserWithOrganization>(query);

    const allUsers = result.rows.map((row) => ({
      ...row,
      organization: row.organization,
    }));

    // Настраиваем Fuse.js для поиска
    const fuseConfig: IFuseOptions<User> = {
      keys: [
        { name: "name", weight: 0.8 },
        { name: "organization.name", weight: 0.2 }, // если есть организация
      ],
      threshold: 0.4,
      minMatchCharLength: 2,
      findAllMatches: true,
      ignoreLocation: true,
      useExtendedSearch: true,
      shouldSort: true,
    };

    const fuse = new Fuse(allUsers, fuseConfig);
    const searchResult = fuse.search(input);

    return searchResult.map((i) => i.item);
  }
}
