import { Pool } from "pg";
import { Material } from "../models";
import { CreateMaterialDTO, UpdateMaterialDTO } from "../dto";

import Fuse, { IFuseOptions } from "fuse.js";

export class MaterialService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<Material[]> {
    const result = await this._db.query<Material>(
      "SELECT * FROM materials ORDER BY id",
    );
    return result.rows;
  }

  async findById(id: number): Promise<Material | null> {
    const result = await this._db.query<Material>(
      "SELECT * FROM materials WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error(`Material with id =${id} not found`, {})
    } 

    return result.rows[0];
  }

  async create(value: CreateMaterialDTO): Promise<Material> {
    const result = await this._db.query<Material>(
      "INSERT INTO materials (name) VALUES $1 RETURNING *",
      [value.name],
    );
    return result.rows[0];
  }

  async update({ name, id }: UpdateMaterialDTO): Promise<Material> {
    const material = this.findById(id);

    if (!material) {
      throw new Error(`Material with id ${id} not found`);
    }

    const result = await this._db.query<Material>(
      `UPDATE materials SET name="$1" updated_at = CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      [name, id],
    );
    return result.rows[0];
  }

  async delete(id: number): Promise<Material> {
    const result = await this._db.query<Material>(
      `DELETE FROM materials WHERE id=$1`,
      [id],
    );

    return result.rows[0];
  }

  async search(input: string): Promise<Material[]> {
    const materials = await this.findAll();

    const fuseConfig: IFuseOptions<Material> = {
      keys: [{ name: "name", weight: 0.8 }],
      isCaseSensitive: false,
      ignoreDiacritics: true,
      minMatchCharLength: 2,
      shouldSort: true,
      threshold: 0.4,
      useExtendedSearch: true,
    };

    const fuse = new Fuse(materials, fuseConfig);
    const searchResult = fuse.search(input);

    return searchResult.map((i) => i.item);
  }
}
