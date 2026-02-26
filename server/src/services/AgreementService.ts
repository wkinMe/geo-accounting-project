import { Pool } from "pg";
import {
  Agreement,
  AgreementWithDetails,
  Material,
  Organization,
  User,
  Warehouse,
} from "@shared/models";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service";
import { executeQuery, getSingleResult } from "@src/utils";
import Fuse, { IFuseOptions } from "fuse.js";
import { AgreementCreateParams, AgreementUpdateParams } from "@shared/types";
import { ERROR_MESSAGES } from "@shared/constants";

export class AgreementService {
  private _db: Pool;
  private entityName = "agreement";

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
        COALESCE(
          json_agg(
            CASE WHEN m.id IS NOT NULL THEN
              json_build_object(
                'material', m.*,
                'amount', am.amount
              )
            ELSE NULL END
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) as materials
      FROM agreements a
      INNER JOIN app_users s ON a.supplier_id = s.id
      LEFT JOIN organizations os ON s.organization_id = os.id
      INNER JOIN app_users c ON a.customer_id = c.id
      LEFT JOIN organizations oc ON c.organization_id = oc.id
      INNER JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
      INNER JOIN warehouses cw ON a.customer_warehouse_id = cw.id
      LEFT JOIN agreement_material am ON a.id = am.agreement_id
      LEFT JOIN materials m ON am.material_id = m.id
      GROUP BY 
        a.id, 
        s.id, os.id, 
        c.id, oc.id, 
        sw.id, 
        cw.id
      ORDER BY a.id;
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
        materials: row.materials || [],
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
        COALESCE(
          json_agg(
            CASE WHEN m.id IS NOT NULL THEN
              json_build_object(
                'material', m.*,
                'amount', am.amount
              )
            ELSE NULL END
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) as materials
      FROM agreements a
      INNER JOIN app_users s ON a.supplier_id = s.id
      LEFT JOIN organizations os ON s.organization_id = os.id
      INNER JOIN app_users c ON a.customer_id = c.id
      LEFT JOIN organizations oc ON c.organization_id = oc.id
      INNER JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
      INNER JOIN warehouses cw ON a.customer_warehouse_id = cw.id
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

      const result = await getSingleResult<{
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
      }>(this._db, "findById", query, [id], this.entityName, id);

      return {
        ...result.agreement,
        supplier: {
          ...result.supplier,
          organization: result.supplier_organization,
        },
        customer: {
          ...result.customer,
          organization: result.customer_organization,
        },
        supplier_warehouse: result.supplier_warehouse,
        customer_warehouse: result.customer_warehouse,
        materials: result.materials || [],
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
      status,
    } = createData;

    try {
      // Проверка статуса
      if (status !== undefined && status.trim() === "") {
        throw new ValidationError(
          ERROR_MESSAGES.EMPTY_FIELD("Status"),
          "create",
          "status",
          status,
        );
      }

      // Проверка supplier_id
      if (supplier_id === undefined) {
        throw new ValidationError(
          ERROR_MESSAGES.REQUIRED_FIELD("Supplier ID"),
          "create",
          "supplier_id",
          supplier_id,
        );
      }

      if (supplier_id <= 0) {
        throw new ValidationError(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
          "create",
          "supplier_id",
          supplier_id,
        );
      }

      // Проверка существования поставщика
      const supplierCheck = await executeQuery(
        this._db,
        "checkSupplier",
        "SELECT id FROM app_users WHERE id = $1",
        [supplier_id],
      );
      if (supplierCheck.length === 0) {
        throw new NotFoundError(
          ERROR_MESSAGES.NOT_FOUND("Supplier", supplier_id),
          "Supplier",
          supplier_id,
        );
      }

      // Проверка customer_id
      if (customer_id === undefined) {
        throw new ValidationError(
          ERROR_MESSAGES.REQUIRED_FIELD("Customer ID"),
          "create",
          "customer_id",
          customer_id,
        );
      }

      if (customer_id <= 0) {
        throw new ValidationError(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Customer"),
          "create",
          "customer_id",
          customer_id,
        );
      }

      // Проверка существования заказчика
      const customerCheck = await executeQuery(
        this._db,
        "checkCustomer",
        "SELECT id FROM app_users WHERE id = $1",
        [customer_id],
      );
      if (customerCheck.length === 0) {
        throw new NotFoundError(
          ERROR_MESSAGES.NOT_FOUND("Customer", customer_id),
          "Customer",
          customer_id,
        );
      }

      // Проверка supplier_warehouse_id
      if (supplier_warehouse_id === undefined) {
        throw new ValidationError(
          ERROR_MESSAGES.REQUIRED_FIELD("Supplier warehouse ID"),
          "create",
          "supplier_warehouse_id",
          supplier_warehouse_id,
        );
      }

      if (supplier_warehouse_id <= 0) {
        throw new ValidationError(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier warehouse"),
          "create",
          "supplier_warehouse_id",
          supplier_warehouse_id,
        );
      }

      // Проверка существования склада поставщика
      const supplierWarehouseCheck = await executeQuery(
        this._db,
        "checkSupplierWarehouse",
        "SELECT id FROM warehouses WHERE id = $1",
        [supplier_warehouse_id],
      );
      if (supplierWarehouseCheck.length === 0) {
        throw new NotFoundError(
          ERROR_MESSAGES.NOT_FOUND("Supplier warehouse", supplier_warehouse_id),
          "Warehouse",
          supplier_warehouse_id,
        );
      }

      // Проверка customer_warehouse_id
      if (customer_warehouse_id === undefined) {
        throw new ValidationError(
          ERROR_MESSAGES.REQUIRED_FIELD("Customer warehouse ID"),
          "create",
          "customer_warehouse_id",
          customer_warehouse_id,
        );
      }

      if (customer_warehouse_id <= 0) {
        throw new ValidationError(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Customer warehouse"),
          "create",
          "customer_warehouse_id",
          customer_warehouse_id,
        );
      }

      // Проверка существования склада заказчика
      const customerWarehouseCheck = await executeQuery(
        this._db,
        "checkCustomerWarehouse",
        "SELECT id FROM warehouses WHERE id = $1",
        [customer_warehouse_id],
      );
      if (customerWarehouseCheck.length === 0) {
        throw new NotFoundError(
          ERROR_MESSAGES.NOT_FOUND("Customer warehouse", customer_warehouse_id),
          "Warehouse",
          customer_warehouse_id,
        );
      }

      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        const createQuery = `
          INSERT INTO agreements(
            supplier_id, 
            customer_id, 
            supplier_warehouse_id, 
            customer_warehouse_id,
            status
          ) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING id
        `;

        const result = await client.query(createQuery, [
          supplier_id,
          customer_id,
          supplier_warehouse_id,
          customer_warehouse_id,
          status || null,
        ]);

        const agreementId = result.rows[0].id;

        // Добавляем материалы, только если они есть и это массив
        if (materials !== undefined) {
          if (!Array.isArray(materials)) {
            throw new ValidationError(
              "Materials must be an array",
              "create",
              "materials",
              materials,
            );
          }

          // Если массив не пустой, добавляем материалы
          if (materials.length > 0) {
            for (const material of materials) {
              // Проверяем material_id
              if (!material.material_id || material.material_id <= 0) {
                throw new ValidationError(
                  ERROR_MESSAGES.INVALID_ID_FORMAT("Material"),
                  "create",
                  "material_id",
                  material.material_id,
                );
              }

              // Проверяем существование материала
              const materialCheck = await client.query(
                "SELECT id FROM materials WHERE id = $1",
                [material.material_id],
              );
              if (materialCheck.rows.length === 0) {
                throw new NotFoundError(
                  ERROR_MESSAGES.NOT_FOUND("Material", material.material_id),
                  "Material",
                  material.material_id,
                );
              }

              // Проверяем, что amount положительный
              if (!material.amount || material.amount <= 0) {
                throw new ValidationError(
                  "Amount must be positive",
                  "create",
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
          // Если materials = [] - просто не добавляем материалы, это валидно
        }

        await client.query("COMMIT");

        // Возвращаем созданное соглашение
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
      status,
    } = updateData;

    try {
      // Проверяем существование соглашения
      const existingAgreement = await this.findById(id);

      // Проверка статуса, если он передан
      if (status !== undefined && status.trim() === "") {
        throw new ValidationError(
          ERROR_MESSAGES.EMPTY_FIELD("Status"),
          "update",
          "status",
          status,
        );
      }

      // Проверяем supplier_id, если передан
      if (supplier_id !== undefined) {
        if (supplier_id <= 0) {
          throw new ValidationError(
            ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
            "update",
            "supplier_id",
            supplier_id,
          );
        }

        const supplierCheck = await executeQuery(
          this._db,
          "checkSupplier",
          "SELECT id FROM app_users WHERE id = $1",
          [supplier_id],
        );
        if (supplierCheck.length === 0) {
          throw new NotFoundError(
            ERROR_MESSAGES.NOT_FOUND("Supplier", supplier_id),
            "Supplier",
            supplier_id,
          );
        }
      }

      // Проверяем customer_id, если передан
      if (customer_id !== undefined) {
        if (customer_id <= 0) {
          throw new ValidationError(
            ERROR_MESSAGES.INVALID_ID_FORMAT("Customer"),
            "update",
            "customer_id",
            customer_id,
          );
        }

        const customerCheck = await executeQuery(
          this._db,
          "checkCustomer",
          "SELECT id FROM app_users WHERE id = $1",
          [customer_id],
        );
        if (customerCheck.length === 0) {
          throw new NotFoundError(
            ERROR_MESSAGES.NOT_FOUND("Customer", customer_id),
            "Customer",
            customer_id,
          );
        }
      }

      // Проверяем supplier_warehouse_id, если передан
      if (supplier_warehouse_id !== undefined) {
        if (supplier_warehouse_id <= 0) {
          throw new ValidationError(
            ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier warehouse"),
            "update",
            "supplier_warehouse_id",
            supplier_warehouse_id,
          );
        }

        const supplierWarehouseCheck = await executeQuery(
          this._db,
          "checkSupplierWarehouse",
          "SELECT id FROM warehouses WHERE id = $1",
          [supplier_warehouse_id],
        );
        if (supplierWarehouseCheck.length === 0) {
          throw new NotFoundError(
            ERROR_MESSAGES.NOT_FOUND(
              "Supplier warehouse",
              supplier_warehouse_id,
            ),
            "Warehouse",
            supplier_warehouse_id,
          );
        }
      }

      // Проверяем customer_warehouse_id, если передан
      if (customer_warehouse_id !== undefined) {
        if (customer_warehouse_id <= 0) {
          throw new ValidationError(
            ERROR_MESSAGES.INVALID_ID_FORMAT("Customer warehouse"),
            "update",
            "customer_warehouse_id",
            customer_warehouse_id,
          );
        }

        const customerWarehouseCheck = await executeQuery(
          this._db,
          "checkCustomerWarehouse",
          "SELECT id FROM warehouses WHERE id = $1",
          [customer_warehouse_id],
        );
        if (customerWarehouseCheck.length === 0) {
          throw new NotFoundError(
            ERROR_MESSAGES.NOT_FOUND(
              "Customer warehouse",
              customer_warehouse_id,
            ),
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

      if (status !== undefined) {
        fields.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      // Добавляем updated_at
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

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
          if (!Array.isArray(materials)) {
            throw new ValidationError(
              "Materials must be an array",
              "update",
              "materials",
              materials,
            );
          }

          // Удаляем старые материалы
          await client.query(
            "DELETE FROM agreement_material WHERE agreement_id = $1",
            [id],
          );

          // Если массив не пустой, добавляем новые материалы
          if (materials.length > 0) {
            for (const material of materials) {
              // Проверяем material_id
              if (!material.material_id || material.material_id <= 0) {
                throw new ValidationError(
                  ERROR_MESSAGES.INVALID_ID_FORMAT("Material"),
                  "update",
                  "material_id",
                  material.material_id,
                );
              }

              // Проверяем существование материала
              const materialCheck = await client.query(
                "SELECT id FROM materials WHERE id = $1",
                [material.material_id],
              );
              if (materialCheck.rows.length === 0) {
                throw new NotFoundError(
                  ERROR_MESSAGES.NOT_FOUND("Material", material.material_id),
                  "Material",
                  material.material_id,
                );
              }

              // Проверяем, что amount положительный
              if (!material.amount || material.amount <= 0) {
                throw new ValidationError(
                  "Amount must be positive",
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
          // Если materials = [] - просто удаляем все материалы (соглашение без материалов)
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
      // Сначала проверяем существование соглашения
      await this.findById(id);

      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        // Удаляем связанные материалы
        await client.query(
          "DELETE FROM agreement_material WHERE agreement_id = $1",
          [id],
        );

        // Удаляем само соглашение
        const result = await client.query(
          "DELETE FROM agreements WHERE id = $1 RETURNING *",
          [id],
        );

        await client.query("COMMIT");

        if (result.rows.length === 0) {
          throw new NotFoundError(
            ERROR_MESSAGES.NOT_FOUND(this.entityName, id),
            this.entityName,
            id,
          );
        }

        return result.rows[0];
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
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
          { name: "supplier.name", weight: 0.6 },
          { name: "supplier.organization.name", weight: 0.5 },
          { name: "customer.name", weight: 0.4 },
          { name: "customer.organization.name", weight: 0.3 },
          { name: "supplier_warehouse.name", weight: 0.1 },
          { name: "customer_warehouse.name", weight: 0.1 },
          { name: "materials.material.name", weight: 0.05 },
          { name: "status", weight: 0.2 },
        ],
        includeScore: true,
        threshold: 0.2,
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
