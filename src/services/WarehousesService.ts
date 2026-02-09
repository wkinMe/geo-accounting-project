import { Pool } from "pg";
import {
  Material,
  Organization,
  Warehouse,
  WarehouseWithMaterialsAndOrganization,
  User,
} from "../models";
import Fuse, { IFuseOptions } from "fuse.js";
import { CreateWarehouseDTO, UpdateWarehouseDTO } from "../dto";

export class WarehouseService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async createWarehouse(
    createData: CreateWarehouseDTO,
  ): Promise<WarehouseWithMaterialsAndOrganization> {
    // Проверяем существование организации
    const orgCheck = await this._db.query(
      "SELECT id FROM organizations WHERE id = $1",
      [createData.organization_id],
    );
    if (orgCheck.rows.length === 0) {
      throw new Error(
        `Organization with id ${createData.organization_id} not found`,
      );
    }

    // Если указан manager_id, проверяем существование пользователя
    if (createData.manager_id !== undefined && createData.manager_id !== null) {
      const managerCheck = await this._db.query(
        "SELECT id FROM app_user WHERE id = $1",
        [createData.manager_id],
      );
      if (managerCheck.rows.length === 0) {
        throw new Error(`Manager with id ${createData.manager_id} not found`);
      }
    }

    // Строим запрос на создание склада
    const fields = [];
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    // Обязательные поля
    fields.push("name");
    values.push(createData.name);
    placeholders.push(`$${paramIndex}`);
    paramIndex++;

    fields.push("organization_id");
    values.push(createData.organization_id);
    placeholders.push(`$${paramIndex}`);
    paramIndex++;

    fields.push("latitude");
    values.push(createData.latitude);
    placeholders.push(`$${paramIndex}`);
    paramIndex++;

    fields.push("longitude");
    values.push(createData.longitude);
    placeholders.push(`$${paramIndex}`);
    paramIndex++;

    // Опциональное поле manager_id
    if (createData.manager_id !== undefined && createData.manager_id !== null) {
      fields.push("manager_id");
      values.push(createData.manager_id);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;
    }

    const query = `
      INSERT INTO warehouses (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await this._db.query<Warehouse>(query, values);
    const createdWarehouse = result.rows[0];

    // Получаем полную информацию о созданном складе
    return await this.findById(createdWarehouse.id);
  }

  async findAll(): Promise<WarehouseWithMaterialsAndOrganization[]> {
    const query = `
    SELECT 
      row_to_json(w.*) as warehouse,
      json_agg(m.*) as materials,
      row_to_json(o.*) as organization,
      row_to_json(u.*) as manager
    FROM warehouses w 
    INNER JOIN organizations o ON w.organization_id = o.id
    LEFT JOIN app_user u ON w.manager_id = u.id
    LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
    LEFT JOIN materials m ON wm.material_id = m.id 
    GROUP BY w.id, o.id, u.id
  `;

    const result = await this._db.query<{
      warehouse: Warehouse;
      materials: Material[] | null;
      organization: Organization;
      manager: User | null;
    }>(query);

    return result.rows.map((row) => ({
      ...row.warehouse,
      materials: row.materials,
      organization: row.organization,
      manager: row.manager,
      materials_count: row.materials?.length,
    }));
  }

  async findById(id: number): Promise<WarehouseWithMaterialsAndOrganization> {
    const query = `
    SELECT 
      row_to_json(w.*) as warehouse,
      json_agg(m.*) as materials,
      row_to_json(o.*) as organization,
      row_to_json(u.*) as manager
    FROM warehouses w 
    INNER JOIN organizations o ON w.organization_id = o.id
    LEFT JOIN app_user u ON w.manager_id = u.id
    LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
    LEFT JOIN materials m ON wm.material_id = m.id 
    WHERE w.id = $1
    GROUP BY w.id, o.id, u.id
  `;

    const result = await this._db.query<{
      warehouse: Warehouse;
      materials: Material[] | null;
      organization: Organization;
      manager: User | null;
    }>(query, [id]);

    const warehouseData = result.rows[0];
    if (!warehouseData) {
      throw new Error(`Warehouse with id ${id} not found`);
    }

    return {
      ...warehouseData.warehouse,
      materials: warehouseData.materials,
      organization: warehouseData.organization,
      manager: warehouseData.manager,
    };
  }

  async updateWarehouse(
    id: number,
    updateData: UpdateWarehouseDTO,
  ): Promise<WarehouseWithMaterialsAndOrganization> {
    // Проверяем существование склада
    const existingWarehouse = await this.findById(id);
    if (!existingWarehouse) {
      throw new Error(`Warehouse with id ${id} not found`);
    }

    // Проверяем существование организации, если меняем
    if (updateData.organization_id !== undefined) {
      const orgCheck = await this._db.query(
        "SELECT id FROM organizations WHERE id = $1",
        [updateData.organization_id],
      );
      if (orgCheck.rows.length === 0) {
        throw new Error(
          `Organization with id ${updateData.organization_id} not found`,
        );
      }
    }

    // Проверяем существование менеджера, если меняем
    if (updateData.manager_id !== undefined && updateData.manager_id !== null) {
      const managerCheck = await this._db.query(
        "SELECT id FROM app_user WHERE id = $1",
        [updateData.manager_id],
      );
      if (managerCheck.rows.length === 0) {
        throw new Error(`Manager with id ${updateData.manager_id} not found`);
      }
    }

    // Формируем SQL запрос с динамическими SET полями
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(updateData.name);
      paramIndex++;
    }

    if (updateData.organization_id !== undefined) {
      fields.push(`organization_id = $${paramIndex}`);
      values.push(updateData.organization_id);
      paramIndex++;
    }

    if (updateData.manager_id !== undefined) {
      // Обработка случая, когда хотим установить manager_id в NULL
      if (updateData.manager_id === null) {
        fields.push(`manager_id = NULL`);
      } else {
        fields.push(`manager_id = $${paramIndex}`);
        values.push(updateData.manager_id);
        paramIndex++;
      }
    }

    if (updateData.latitude !== undefined) {
      fields.push(`latitude = $${paramIndex}`);
      values.push(updateData.latitude);
      paramIndex++;
    }

    if (updateData.longitude !== undefined) {
      fields.push(`longitude = $${paramIndex}`);
      values.push(updateData.longitude);
      paramIndex++;
    }

    // Если нет полей для обновления
    if (fields.length === 0) {
      return existingWarehouse;
    }

    values.push(id); // Добавляем id в конец для WHERE условия

    const query = `
    UPDATE warehouses 
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

    await this._db.query(query, values);

    // Возвращаем обновленный склад с полной информацией
    return await this.findById(id);
  }

  async searchWarehouses(input: string) {
    const allWarehouses = await this.findAll();

    const fuseConfig: IFuseOptions<WarehouseWithMaterialsAndOrganization> = {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "organization.name", weight: 0.4 },
        { name: "manager.name", weight: 0.3 },
      ],
      includeScore: true,
      threshold: 0.4,
      minMatchCharLength: 2,
      findAllMatches: true,
      ignoreLocation: true,
      useExtendedSearch: true,
    };

    const fuse = new Fuse(allWarehouses, fuseConfig);
    const searchResult = fuse.search(input);

    return searchResult.map((i) => i.item);
  }

  async deleteWarehouse(id: number): Promise<Warehouse> {
    const deleteResult = await this._db.query<Warehouse>(
      "DELETE FROM warehouses WHERE id = $1 RETURNING *",
      [id],
    );

    if (deleteResult.rowCount === 0) {
      throw new Error("Warehouse not found");
    }

    return deleteResult.rows[0];
  }

  // В классе WarehouseService

  // Метод для получения складов по менеджеру
  async findByManagerId(
    managerId: number,
  ): Promise<WarehouseWithMaterialsAndOrganization[]> {
    const query = `
    SELECT 
      row_to_json(w.*) as warehouse,
      json_agg(m.*) as materials,
      row_to_json(o.*) as organization,
      row_to_json(u.*) as manager
    FROM warehouses w 
    INNER JOIN organizations o ON w.organization_id = o.id
    LEFT JOIN app_user u ON w.manager_id = u.id
    LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
    LEFT JOIN materials m ON wm.material_id = m.id 
    WHERE w.manager_id = $1
    GROUP BY w.id, o.id, u.id
  `;

    const result = await this._db.query<{
      warehouse: Warehouse;
      materials: Material[] | null;
      organization: Organization;
      manager: User | null;
    }>(query, [managerId]);

    return result.rows.map((row) => ({
      ...row.warehouse,
      materials: row.materials,
      organization: row.organization,
      manager: row.manager,
      materials_count: row.materials?.length,
    }));
  }

  // Метод для назначения менеджера складу
  async assignManager(
    warehouseId: number,
    managerId: number | null,
  ): Promise<WarehouseWithMaterialsAndOrganization> {
    // Проверяем существование склада
    const warehouse = await this.findById(warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse with id ${warehouseId} not found`);
    }

    // Если передали managerId, проверяем существование пользователя
    if (managerId !== null) {
      const managerCheck = await this._db.query(
        "SELECT id FROM app_user WHERE id = $1",
        [managerId],
      );
      if (managerCheck.rows.length === 0) {
        throw new Error(`Manager with id ${managerId} not found`);
      }
    }

    const query = `
    UPDATE warehouses 
    SET manager_id = $1
    WHERE id = $2
    RETURNING *
  `;

    await this._db.query(query, [managerId, warehouseId]);

    // Возвращаем обновленный склад
    return await this.findById(warehouseId);
  }
}
