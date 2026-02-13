import { Pool } from "pg";
import {
  Agreement,
  AgreementWithDetails,
  Material,
  Organization,
  User,
  Warehouse,
} from "@src/models";
import Fuse, { IFuseOptions } from "fuse.js";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service"; // Импортируем классы ошибок
import { executeQuery, getSingleResult } from "@src/utils";
import { AgreementCreateParams, AgreementUpdateParams } from "@t/services";

export class AgreementService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<AgreementWithDetails[]> {
    try {
      const query = `
      SELECT
        row_to_json(a.*) as agreement,
        row_to_json(s.*) as supplier,
        row_to_json(os.*) as supplier_organization,
        row_to_json(c.*) as customer,
        row_to_json(oc.*) as customer_organization,
        row_to_json(sw.*) as supplier_warehouse,
        row_to_json(cw.*) as customer_warehouse,
        json_agg(
          json_build_object(
            'material', m.*,
            'amount', am.amount
          )
        ) as materials
      FROM agreements a
      INNER JOIN app_user s ON a.supplier_id = s.id
      LEFT JOIN organizations os ON s.organization_id = os.id
      INNER JOIN app_user c ON a.customer_id = c.id
      LEFT JOIN organizations oc ON c.organization_id = oc.id
      INNER JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
      INNER JOIN warehouses cw ON a.customer_warehouse_id = c.id
      INNER JOIN agreement_material am ON a.id = am.agreement_id
      LEFT JOIN materials m ON am.material_id = m.id
      GROUP BY 
        a.id, 
        s.id, os.id, 
        c.id, oc.id, 
        sw.id, 
        cw.id;
    `;

      const rows = await executeQuery<{
        agreement: Agreement;
        supplier: User;
        supplier_organization: Organization;
        customer: User;
        customer_organization: Organization;
        supplier_warehouse: Warehouse;
        customer_warehouse: Warehouse;
        materials: Array<{
          material: Material;
          amount: number;
        }>;
      }>(this._db, "findAll", query);

      return rows.map((row) => ({
        ...row.agreement,
        supplier: {
          ...row.supplier,
          organization: row.supplier_organization,
        },
        customer: {
          ...row.customer,
          organization: row.customer_organization,
        },
        supplier_warehouse: row.supplier_warehouse,
        customer_warehouse: row.customer_warehouse,
        materials: row.materials,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve agreements",
        "AgreementService",
        "findAll",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findById(id: number): Promise<AgreementWithDetails> {
    try {
      const query = `
      SELECT
        row_to_json(a.*) as agreement,
        row_to_json(s.*) as supplier,
        row_to_json(os.*) as supplier_organization,
        row_to_json(c.*) as customer,
        row_to_json(oc.*) as customer_organization,
        row_to_json(sw.*) as supplier_warehouse,
        row_to_json(cw.*) as customer_warehouse,
        json_agg(
          json_build_object(
            'material', m.*,
            'amount', am.amount
          )
        ) as materials_with_amounts
      FROM agreements a
      INNER JOIN app_user s ON a.supplier_id = s.id
      LEFT JOIN organizations os ON s.organization_id = os.id
      INNER JOIN app_user c ON a.customer_id = c.id
      LEFT JOIN organizations oc ON c.organization_id = oc.id
      INNER JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
      INNER JOIN warehouses cw ON a.customer_warehouse_id = c.id
      LEFT JOIN agreement_material am ON a.id = am.agreement_id
      LEFT JOIN materials m ON am.material_id = m.id
      WHERE a.id = $1
      GROUP BY 
        a.id, 
        s.id, os.id, 
        c.id, oc.id, 
        sw.id, 
        cw.id;
    `;

      const agreementData = await getSingleResult<{
        agreement: Agreement;
        supplier: User;
        supplier_organization: Organization;
        customer: User;
        customer_organization: Organization;
        supplier_warehouse: Warehouse;
        customer_warehouse: Warehouse;
        materials: Array<{
          material: Material;
          amount: number;
        }>;
      }>(this._db, "findById", query, [id], "Agreement", id);

      return {
        ...agreementData.agreement,
        supplier: {
          ...agreementData.supplier,
          organization: agreementData.supplier_organization,
        },
        customer: {
          ...agreementData.customer,
          organization: agreementData.customer_organization,
        },
        supplier_warehouse: agreementData.supplier_warehouse,
        customer_warehouse: agreementData.customer_warehouse,
        materials: agreementData.materials,
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find agreement with id ${id}`,
        "AgreementService",
        "findById",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async create({
    createData,
    materials,
  }: AgreementCreateParams): Promise<AgreementWithDetails> {
    const {
      supplier_id,
      supplier_warehouse_id,
      customer_id,
      customer_warehouse_id,
    } = createData;

    try {
      if (supplier_id !== undefined) {
        const supplierCheck = await executeQuery(
          this._db,
          "checkSupplier",
          "SELECT id FROM app_user WHERE id = $1",
          [supplier_id],
        );
        if (supplierCheck.length === 0) {
          throw new NotFoundError(
            `Supplier with id ${supplier_id} not found`,
            "Supplier",
            supplier_id,
          );
        }
      }

      if (customer_id !== undefined) {
        const customerCheck = await executeQuery(
          this._db,
          "checkCustomer",
          "SELECT id FROM app_user WHERE id = $1",
          [customer_id],
        );
        if (customerCheck.length === 0) {
          throw new NotFoundError(
            `Customer with id ${customer_id} not found`,
            "Customer",
            customer_id,
          );
        }
      }

      if (supplier_warehouse_id !== undefined) {
        const supplierWarehouseCheck = await executeQuery(
          this._db,
          "checkSupplierWarehouse",
          "SELECT id FROM warehouses WHERE id = $1",
          [supplier_warehouse_id],
        );
        if (supplierWarehouseCheck.length === 0) {
          throw new NotFoundError(
            `Supplier warehouse with id ${supplier_warehouse_id} not found`,
            "Warehouse",
            supplier_warehouse_id,
          );
        }
      }

      if (customer_warehouse_id !== undefined) {
        const customerWarehouseCheck = await executeQuery(
          this._db,
          "checkCustomerWarehouse",
          "SELECT id FROM warehouses WHERE id = $1",
          [customer_warehouse_id],
        );
        if (customerWarehouseCheck.length === 0) {
          throw new NotFoundError(
            `Customer warehouse with id ${customer_warehouse_id} not found`,
            "Warehouse",
            customer_warehouse_id,
          );
        }
      }

      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        const createQuery = `INSERT INTO agreements(supplier_id, customer_id, supplier_warehouse_id, customer_warehouse_id) VALUES ($1, $2, $3, $4) RETURNING id`;

        // Исправлено: значения должны быть переданы как массив
        const result = await client.query(createQuery, [
          supplier_id,
          customer_id,
          supplier_warehouse_id,
          customer_warehouse_id,
        ]);

        // Получаем ID созданного agreement
        const agreementId = result.rows[0].id;

        // Если переданы материалы, обновляем agreement_material
        if (materials !== undefined) {
          // Добавляем новые материалы
          for (const material of materials) {
            // Проверяем существование материала
            const materialCheck = await client.query(
              "SELECT id FROM materials WHERE id = $1",
              [material.material_id],
            );
            if (materialCheck.rows.length === 0) {
              throw new NotFoundError(
                `Material with id ${material.material_id} not found`,
                "Material",
                material.material_id,
              );
            }

            // Проверяем, что amount положительный
            if (material.amount <= 0) {
              throw new ValidationError(
                `Amount for material ${material.material_id} must be positive`,
                "update",
                "amount",
                material.amount,
              );
            }

            await client.query(
              `INSERT INTO agreement_material (agreement_id, material_id, amount) 
                 VALUES ($1, $2, $3)`,
              [agreementId, material.material_id, material.amount],
            );
          }
        }

        await client.query("COMMIT");
        return await this.findById(agreementId);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to create agreement`,
        "AgreementService",
        "create",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async update({
    id,
    updateData,
    materials,
  }: AgreementUpdateParams): Promise<AgreementWithDetails> {
    const {
      supplier_id,
      supplier_warehouse_id,
      customer_id,
      customer_warehouse_id,
    } = updateData;

    try {
      // Проверяем существование соглашения
      const existingAgreement = await this.findById(id);

      // Проверяем существование пользователей, если меняем
      if (supplier_id !== undefined) {
        const supplierCheck = await executeQuery(
          this._db,
          "checkSupplier",
          "SELECT id FROM app_user WHERE id = $1",
          [supplier_id],
        );
        if (supplierCheck.length === 0) {
          throw new NotFoundError(
            `Supplier with id ${supplier_id} not found`,
            "Supplier",
            supplier_id,
          );
        }
      }

      if (customer_id !== undefined) {
        const customerCheck = await executeQuery(
          this._db,
          "checkCustomer",
          "SELECT id FROM app_user WHERE id = $1",
          [customer_id],
        );
        if (customerCheck.length === 0) {
          throw new NotFoundError(
            `Customer with id ${customer_id} not found`,
            "Customer",
            customer_id,
          );
        }
      }

      // Проверяем существование складов, если меняем
      if (supplier_warehouse_id !== undefined) {
        const supplierWarehouseCheck = await executeQuery(
          this._db,
          "checkSupplierWarehouse",
          "SELECT id FROM warehouses WHERE id = $1",
          [supplier_warehouse_id],
        );
        if (supplierWarehouseCheck.length === 0) {
          throw new NotFoundError(
            `Supplier warehouse with id ${supplier_warehouse_id} not found`,
            "Warehouse",
            supplier_warehouse_id,
          );
        }
      }

      if (customer_warehouse_id !== undefined) {
        const customerWarehouseCheck = await executeQuery(
          this._db,
          "checkCustomerWarehouse",
          "SELECT id FROM warehouses WHERE id = $1",
          [customer_warehouse_id],
        );
        if (customerWarehouseCheck.length === 0) {
          throw new NotFoundError(
            `Customer warehouse with id ${customer_warehouse_id} not found`,
            "Warehouse",
            customer_warehouse_id,
          );
        }
      }

      // Формируем SQL запрос с динамическими SET полями для agreements
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (supplier_id !== undefined) {
        fields.push(`supplier_id = $${paramIndex}`);
        values.push(supplier_id);
        paramIndex++;
      }

      if (customer_id !== undefined) {
        fields.push(`customer_id = $${paramIndex}`);
        values.push(customer_id);
        paramIndex++;
      }

      if (supplier_warehouse_id !== undefined) {
        fields.push(`supplier_warehouse_id = $${paramIndex}`);
        values.push(supplier_warehouse_id);
        paramIndex++;
      }

      if (customer_warehouse_id !== undefined) {
        fields.push(`customer_warehouse_id = $${paramIndex}`);
        values.push(customer_warehouse_id);
        paramIndex++;
      }

      // Начинаем транзакцию
      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        // Если есть поля для обновления в agreements
        if (fields.length > 0) {
          values.push(id); // Добавляем id в конец для WHERE условия

          const updateAgreementQuery = `
          UPDATE agreements 
          SET ${fields.join(", ")}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

          await client.query(updateAgreementQuery, values);
        }

        // Если переданы материалы, обновляем agreement_material
        if (materials !== undefined) {
          // Удаляем старые материалы
          await client.query(
            "DELETE FROM agreement_material WHERE agreement_id = $1",
            [id],
          );

          // Добавляем новые материалы
          for (const material of materials) {
            // Проверяем существование материала
            const materialCheck = await client.query(
              "SELECT id FROM materials WHERE id = $1",
              [material.material_id],
            );
            if (materialCheck.rows.length === 0) {
              throw new NotFoundError(
                `Material with id ${material.material_id} not found`,
                "Material",
                material.material_id,
              );
            }

            // Проверяем, что amount положительный
            if (material.amount <= 0) {
              throw new ValidationError(
                `Amount for material ${material.material_id} must be positive`,
                "update",
                "amount",
                material.amount,
              );
            }

            await client.query(
              `INSERT INTO agreement_material (agreement_id, material_id, amount) 
             VALUES ($1, $2, $3)`,
              [id, material.material_id, material.amount],
            );
          }
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      // Возвращаем обновленное соглашение с полной информацией
      return await this.findById(id);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to update agreement with id ${id}`,
        "AgreementService",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<Agreement> {
    try {
      const rows = await executeQuery<Agreement>(
        this._db,
        "delete",
        `DELETE FROM agreements WHERE id=$1 RETURNING *`,
        [id],
      );

      if (rows.length === 0) {
        throw new NotFoundError(
          `Agreement with id = ${id} not found`,
          "Agreement",
          id,
        );
      }

      return rows[0];
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to delete agreement with id ${id}`,
        "AgreementService",
        "delete",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async search(input: string): Promise<AgreementWithDetails[]> {
    try {
      const allAgreements = await this.findAll();

      const fuseConfig: IFuseOptions<AgreementWithDetails> = {
        keys: [
          { name: "supplier.name", weight: 0.4 },
          { name: "supplier.organization.name", weight: 0.4 },
          { name: "customer.name", weight: 0.3 },
          { name: "customer.organization.name", weight: 0.3 },
          { name: "supplier_warehouse.name", weight: 0.1 },
          { name: "customer_warehouse.name", weight: 0.1 },
          { name: "materials.material.name", weight: 0.05 },
        ],
        includeScore: true,
        threshold: 0.4,
        minMatchCharLength: 2,
        findAllMatches: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        shouldSort: true,
      };

      const fuse = new Fuse(allAgreements, fuseConfig);
      const searchResult = fuse.search(input);

      return searchResult.map((i) => i.item);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to search agreements",
        "AgreementService",
        "search",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
