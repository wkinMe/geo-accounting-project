// repositories/AgreementMaterialRepository.ts
import { Pool } from "pg";
import { AgreementMaterial } from "../domain/entities/AgreementMaterial";
import { DatabaseError } from "@shared/service";

export class AgreementMaterialRepository {
  constructor(private db: Pool) {}

  async findByAgreement(agreement_id: number): Promise<AgreementMaterial[]> {
    const query =
      "SELECT agreement_id, material_id, amount, item_price FROM agreement_material WHERE agreement_id = $1";
    const result = await this.db.query(query, [agreement_id]);

    return result.rows.map(
      (row) =>
        new AgreementMaterial(
          row.agreement_id,
          row.material_id,
          row.amount,
          row.item_price,
        ),
    );
  }

  async save(material: AgreementMaterial): Promise<AgreementMaterial> {
    const query = `
      INSERT INTO agreement_material (agreement_id, material_id, amount, item_price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (agreement_id, material_id) 
      DO UPDATE SET amount = $3, item_price = $4
    `;

    await this.db.query(query, [
      material.agreement_id,
      material.material_id,
      material.amount,
      material.item_price,
    ]);

    return material;
  }

  async saveMany(materials: AgreementMaterial[]): Promise<void> {
    if (materials.length === 0) return;

    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      for (const material of materials) {
        await client.query(
          `INSERT INTO agreement_material (agreement_id, material_id, amount, item_price)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (agreement_id, material_id) 
           DO UPDATE SET amount = $3, item_price = $4`,
          [
            material.agreement_id,
            material.material_id,
            material.amount,
            material.item_price,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteByAgreement(agreement_id: number): Promise<void> {
    const query = "DELETE FROM agreement_material WHERE agreement_id = $1";
    await this.db.query(query, [agreement_id]);
  }

  async delete(agreement_id: number, material_id: number): Promise<void> {
    const query =
      "DELETE FROM agreement_material WHERE agreement_id = $1 AND material_id = $2";
    await this.db.query(query, [agreement_id, material_id]);
  }
}
