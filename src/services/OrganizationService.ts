import { Pool } from "pg";
import { Organization, Warehouse } from "../models";
import { CreateOrganizationDTO, UpdateOrganizationDTO } from "../dto";
import Fuse, { IFuseOptions } from "fuse.js";

export class OrganizationService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<Organization[]> {
    const result = await this._db.query<Organization>(
      `SELECT * FROM organizations`,
    );

    return result.rows;
  }

  async findById(id: number): Promise<Organization> {
    const result = await this._db.query<Organization>(
      `SELECT * FROM organizations WHERE id=$1`,
      [id],
    );

    return result.rows[0];
  }

  async update({
    id,
    name,
    latitude,
    longitude,
  }: UpdateOrganizationDTO): Promise<Organization> {
    // Проверяем существование организации
    const existingOrganization = await this.findById(id);
    if (!existingOrganization) {
      throw new Error(`Organization with id ${id} not found`);
    }

    // Одна проверка на корректность координат
    if (
      (latitude !== undefined && (latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (longitude < -180 || longitude > 180))
    ) {
      throw new Error(
        `Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.`,
      );
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (latitude !== undefined) {
      fields.push(`latitude = $${paramIndex}`);
      values.push(latitude);
      paramIndex++;
    }

    if (longitude !== undefined) {
      fields.push(`longitude = $${paramIndex}`);
      values.push(longitude);
      paramIndex++;
    }

    if (fields.length === 0) {
      return existingOrganization;
    }

    values.push(id);

    const query = `
    UPDATE organizations 
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

    const result = await this._db.query<Organization>(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Failed to update organization with id ${id}`);
    }

    return result.rows[0];
  }

  async create({
    name,
    latitude,
    longitude,
  }: CreateOrganizationDTO): Promise<Organization> {
    if (
      (latitude !== undefined && (latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (longitude < -180 || longitude > 180))
    ) {
      throw new Error(
        `Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.`,
      );
    }

    // Правильный SQL запрос:
    const query = `
    INSERT INTO organizations (name, latitude, longitude) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `;

    const result = await this._db.query<Organization>(query, [
      name,
      latitude,
      longitude,
    ]);

    return result.rows[0];
  }

  async delete(id: number): Promise<Organization> {
    const result = await this._db.query<Organization>(
      `DELETE FROM organizations WHERE id=$1 RETURNING *`,
      [id],
    );

    if (result.rowCount === 0) {
      throw Error(
        `Organization with id = ${id} not found, deletion incomplete`,
      );
    }

    return result.rows[0];
  }

  async search(input: string): Promise<Organization[]> {
    const organizations = await this.findAll();

    const fuseOptions: IFuseOptions<Organization> = {
      keys: [{ name: "name", weight: 0.8 }],
      isCaseSensitive: false,
      ignoreDiacritics: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      useExtendedSearch: true,
    };

    const fuse = new Fuse(organizations, fuseOptions);
    const searchResult = fuse.search(input);

    return searchResult.map((i) => i.item);
  }
}
