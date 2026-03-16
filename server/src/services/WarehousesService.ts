import { Pool } from "pg";
import Fuse, { IFuseOptions } from "fuse.js";

import {
  Material,
  Organization,
  Warehouse,
  WarehouseWithMaterialsAndOrganization,
  User,
  WarehouseMaterial,
} from "@shared/models";

import { CreateWarehouseDTO, UpdateWarehouseDTO } from "@shared/dto";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service";
import { executeQuery, getSingleResult } from "@src/utils";

export class WarehouseService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<WarehouseWithMaterialsAndOrganization[]> {
    try {
      const query = `
        SELECT 
          row_to_json(w.*) as warehouse,
          COALESCE(json_agg(DISTINCT m.*) FILTER (WHERE m.id IS NOT NULL), '[]'::json) as materials,
          row_to_json(o.*) as organization,
          row_to_json(u.*) as manager
        FROM warehouses w 
        INNER JOIN organizations o ON w.organization_id = o.id
        LEFT JOIN app_users u ON w.manager_id = u.id
        LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
        LEFT JOIN materials m ON wm.material_id = m.id 
        GROUP BY w.id, o.id, u.id
        ORDER BY w.id
      `;

      const rows = await executeQuery<{
        warehouse: Warehouse;
        materials: WarehouseMaterial[] | null;
        organization: Organization;
        manager: User | null;
      }>(this._db, "findAll", query);

      return rows.map((row) => ({
        ...row.warehouse,
        materials: row.materials || [],
        organization: row.organization,
        manager: row.manager,
        materials_count: row.materials?.length || 0,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve warehouses",
        "WarehouseService",
        "findAll",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findById(id: number): Promise<WarehouseWithMaterialsAndOrganization> {
    try {
      const query = `
        SELECT 
          row_to_json(w.*) as warehouse,
          COALESCE(json_agg(DISTINCT m.*) FILTER (WHERE m.id IS NOT NULL), '[]'::json) as materials,
          row_to_json(o.*) as organization,
          row_to_json(u.*) as manager
        FROM warehouses w 
        INNER JOIN organizations o ON w.organization_id = o.id
        LEFT JOIN app_users u ON w.manager_id = u.id
        LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
        LEFT JOIN materials m ON wm.material_id = m.id 
        WHERE w.id = $1
        GROUP BY w.id, o.id, u.id
      `;

      const warehouseData = await getSingleResult<{
        warehouse: Warehouse;
        materials: WarehouseMaterial[] | null;
        organization: Organization;
        manager: User | null;
      }>(this._db, "findById", query, [id], "Warehouse", id);

      return {
        ...warehouseData.warehouse,
        materials: warehouseData.materials || [],
        organization: warehouseData.organization,
        manager: warehouseData.manager,
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find warehouse with id ${id}`,
        "WarehouseService",
        "findById",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async create(
    createData: CreateWarehouseDTO,
  ): Promise<WarehouseWithMaterialsAndOrganization> {
    try {
      // Валидация обязательных полей
      if (!createData.name || createData.name.trim().length === 0) {
        throw new ValidationError(
          "Warehouse name is required",
          "create",
          "name",
          createData.name,
        );
      }

      if (!createData.organization_id) {
        throw new ValidationError(
          "Organization ID is required",
          "create",
          "organization_id",
          createData.organization_id?.toString(),
        );
      }

      // Валидация координат
      if (
        createData.latitude !== undefined &&
        (createData.latitude < -90 || createData.latitude > 90)
      ) {
        throw new ValidationError(
          "Latitude must be between -90 and 90",
          "create",
          "latitude",
          createData.latitude.toString(),
        );
      }

      if (
        createData.longitude !== undefined &&
        (createData.longitude < -180 || createData.longitude > 180)
      ) {
        throw new ValidationError(
          "Longitude must be between -180 and 180",
          "create",
          "longitude",
          createData.longitude.toString(),
        );
      }

      // Проверяем существование организации
      const orgCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkOrganization",
        "SELECT id FROM organizations WHERE id = $1",
        [createData.organization_id],
      );
      if (orgCheck.length === 0) {
        throw new NotFoundError(
          `Organization with id ${createData.organization_id} not found`,
          "Organization",
          "WarehouseService",
          createData.organization_id,
        );
      }

      // Если указан manager_id, проверяем существование пользователя
      if (
        createData.manager_id !== undefined &&
        createData.manager_id !== null
      ) {
        const managerCheck = await executeQuery<{ id: number }>(
          this._db,
          "checkManager",
          "SELECT id FROM app_users WHERE id = $1",
          [createData.manager_id],
        );
        if (managerCheck.length === 0) {
          throw new NotFoundError(
            `Manager with id ${createData.manager_id} not found`,
            "User",
            "WarehouseService",
            createData.manager_id,
          );
        }
      }

      // Строим запрос на создание склада
      const fields = [];
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      // Обязательные поля
      fields.push("name");
      values.push(createData.name.trim());
      placeholders.push(`$${paramIndex}`);
      paramIndex++;

      fields.push("organization_id");
      values.push(createData.organization_id);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;

      fields.push("latitude");
      values.push(createData.latitude || null);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;

      fields.push("longitude");
      values.push(createData.longitude || null);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;

      // Опциональное поле manager_id
      if (
        createData.manager_id !== undefined &&
        createData.manager_id !== null
      ) {
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

      const rows = await executeQuery<Warehouse>(
        this._db,
        "createWarehouse",
        query,
        values,
      );

      if (rows.length === 0) {
        throw new ServiceError(
          "Failed to create warehouse - no data returned",
          "WarehouseService",
          "createWarehouse",
          new Error("No data returned from INSERT query"),
        );
      }

      const createdWarehouse = rows[0];

      // Получаем полную информацию о созданном складе
      return await this.findById(createdWarehouse.id);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to create warehouse",
        "WarehouseService",
        "createWarehouse",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async update(
    id: number,
    updateData: UpdateWarehouseDTO,
  ): Promise<WarehouseWithMaterialsAndOrganization> {
    try {
      // Проверяем существование склада
      await this.findById(id);

      // Валидация входных данных
      if (
        updateData.name !== undefined &&
        (!updateData.name || updateData.name.trim().length === 0)
      ) {
        throw new ValidationError(
          "Warehouse name cannot be empty",
          "update",
          "name",
          updateData.name,
        );
      }

      // Валидация координат
      if (
        updateData.latitude !== undefined &&
        (updateData.latitude < -90 || updateData.latitude > 90)
      ) {
        throw new ValidationError(
          "Latitude must be between -90 and 90",
          "update",
          "latitude",
          updateData.latitude.toString(),
        );
      }

      if (
        updateData.longitude !== undefined &&
        (updateData.longitude < -180 || updateData.longitude > 180)
      ) {
        throw new ValidationError(
          "Longitude must be between -180 and 180",
          "update",
          "longitude",
          updateData.longitude.toString(),
        );
      }

      // Проверяем существование организации, если меняем
      if (updateData.organization_id !== undefined) {
        const orgCheck = await executeQuery<{ id: number }>(
          this._db,
          "checkOrganizationUpdate",
          "SELECT id FROM organizations WHERE id = $1",
          [updateData.organization_id],
        );
        if (orgCheck.length === 0) {
          throw new NotFoundError(
            `Organization with id ${updateData.organization_id} not found`,
            "Organization",
            "WarehouseService",
            updateData.organization_id,
          );
        }
      }

      // Проверяем существование менеджера, если меняем
      if (
        updateData.manager_id !== undefined &&
        updateData.manager_id !== null
      ) {
        const managerCheck = await executeQuery<{ id: number }>(
          this._db,
          "checkManagerUpdate",
          "SELECT id FROM app_users WHERE id = $1",
          [updateData.manager_id],
        );
        if (managerCheck.length === 0) {
          throw new NotFoundError(
            `Manager with id ${updateData.manager_id} not found`,
            "User",
            "WarehouseService",
            updateData.manager_id,
          );
        }
      }

      // Формируем SQL запрос с динамическими SET полями
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (updateData.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(updateData.name.trim());
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

      // Если нет полей для обновления, возвращаем существующий склад
      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);

      const query = `
        UPDATE warehouses 
        SET ${fields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const rows = await executeQuery<Warehouse>(
        this._db,
        "updateWarehouse",
        query,
        values,
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to update warehouse with id ${id} - no data returned`,
          "WarehouseService",
          "updateWarehouse",
          new Error("No data returned from UPDATE query"),
        );
      }

      // Возвращаем обновленный склад с полной информацией
      return await this.findById(id);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to update warehouse with id ${id}`,
        "WarehouseService",
        "updateWarehouse",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<Warehouse> {
    try {
      // Проверяем существование склада
      await this.findById(id);

      // Проверяем, используется ли склад в соглашениях как supplier_warehouse
      const supplierCheck = await executeQuery<{ count: number }>(
        this._db,
        "checkSupplierUsage",
        "SELECT COUNT(*) as count FROM agreements WHERE supplier_warehouse_id = $1",
        [id],
      );

      if (supplierCheck[0].count > 0) {
        throw new ValidationError(
          `Cannot delete warehouse with id ${id} because it is used as supplier warehouse in agreements`,
          "delete",
          "warehouse_id",
          id.toString(),
        );
      }

      // Проверяем, используется ли склад в соглашениях как customer_warehouse
      const customerCheck = await executeQuery<{ count: number }>(
        this._db,
        "checkCustomerUsage",
        "SELECT COUNT(*) as count FROM agreements WHERE customer_warehouse_id = $1",
        [id],
      );

      if (customerCheck[0].count > 0) {
        throw new ValidationError(
          `Cannot delete warehouse with id ${id} because it is used as customer warehouse in agreements`,
          "delete",
          "warehouse_id",
          id.toString(),
        );
      }

      // Проверяем, есть ли материалы на складе
      const materialsCheck = await executeQuery<{ count: number }>(
        this._db,
        "checkMaterials",
        "SELECT COUNT(*) as count FROM warehouse_material WHERE warehouse_id = $1",
        [id],
      );

      if (materialsCheck[0].count > 0) {
        throw new ValidationError(
          `Cannot delete warehouse with id ${id} because it has materials assigned. Remove materials first.`,
          "delete",
          "warehouse_id",
          id.toString(),
        );
      }

      const rows = await executeQuery<Warehouse>(
        this._db,
        "deleteWarehouse",
        "DELETE FROM warehouses WHERE id = $1 RETURNING *",
        [id],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to delete warehouse with id ${id} - no data returned`,
          "WarehouseService",
          "deleteWarehouse",
          new Error("No data returned from DELETE query"),
        );
      }

      return rows[0];
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to delete warehouse with id ${id}`,
        "WarehouseService",
        "deleteWarehouse",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async search(
    input: string,
  ): Promise<WarehouseWithMaterialsAndOrganization[]> {
    try {
      const allWarehouses = await this.findAll();

      const fuseConfig: IFuseOptions<WarehouseWithMaterialsAndOrganization> = {
        keys: [
          { name: "name", weight: 0.9 },
          { name: "organization.name", weight: 0.4 },
          { name: "manager.name", weight: 0.3 },
        ],
        includeScore: true,
        threshold: 0.2,
        minMatchCharLength: 1,
        findAllMatches: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        shouldSort: true,
      };

      const fuse = new Fuse(allWarehouses, fuseConfig);
      const searchResult = fuse.search(input);

      return searchResult.map((i) => i.item);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to search warehouses",
        "WarehouseService",
        "searchWarehouses",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findByManagerId(
    managerId: number,
  ): Promise<WarehouseWithMaterialsAndOrganization[]> {
    try {
      // Проверяем существование менеджера
      const managerCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkManagerExists",
        "SELECT id FROM app_users WHERE id = $1",
        [managerId],
      );

      if (managerCheck.length === 0) {
        throw new NotFoundError(
          `Manager with id ${managerId} not found`,
          "findByManagerId",
          "WarehouseService",
          managerId,
        );
      }

      const query = `
        SELECT 
          row_to_json(w.*) as warehouse,
          COALESCE(json_agg(DISTINCT m.*) FILTER (WHERE m.id IS NOT NULL), '[]'::json) as materials,
          row_to_json(o.*) as organization,
          row_to_json(u.*) as manager
        FROM warehouses w 
        INNER JOIN organizations o ON w.organization_id = o.id
        LEFT JOIN app_users u ON w.manager_id = u.id
        LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
        LEFT JOIN materials m ON wm.material_id = m.id 
        WHERE w.manager_id = $1
        GROUP BY w.id, o.id, u.id
        ORDER BY w.id
      `;

      const rows = await executeQuery<{
        warehouse: Warehouse;
        materials: WarehouseMaterial[] | null;
        organization: Organization;
        manager: User | null;
      }>(this._db, "findByManagerId", query, [managerId]);

      return rows.map((row) => ({
        ...row.warehouse,
        materials: row.materials || [],
        organization: row.organization,
        manager: row.manager,
        materials_count: row.materials?.length || 0,
      }));
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find warehouses for manager with id ${managerId}`,
        "WarehouseService",
        "findByManagerId",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async assignManager(
    warehouseId: number,
    managerId: number | null,
  ): Promise<WarehouseWithMaterialsAndOrganization> {
    try {
      // Проверяем существование склада
      await this.findById(warehouseId);

      // Если передали managerId, проверяем существование пользователя
      if (managerId !== null) {
        const managerCheck = await executeQuery<{ id: number }>(
          this._db,
          "checkManagerAssign",
          "SELECT id FROM app_users WHERE id = $1",
          [managerId],
        );
        if (managerCheck.length === 0) {
          throw new NotFoundError(
            `Manager with id ${managerId} not found`,
            "User",
            "WarehouseService",
            managerId,
          );
        }
      }

      const rows = await executeQuery<Warehouse>(
        this._db,
        "assignManager",
        "UPDATE warehouses SET manager_id = $1 WHERE id = $2 RETURNING *",
        [managerId, warehouseId],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to assign manager to warehouse with id ${warehouseId} - no data returned`,
          "WarehouseService",
          "assignManager",
          new Error("No data returned from UPDATE query"),
        );
      }

      // Возвращаем обновленный склад
      return await this.findById(warehouseId);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to assign manager to warehouse with id ${warehouseId}`,
        "WarehouseService",
        "assignManager",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Добавление материала на склад (или увеличение количества если уже существует)
  async addMaterial(
    warehouseId: number,
    materialId: number,
    amount: number,
  ): Promise<WarehouseMaterial> {
    try {
      // Проверяем существование склада
      await this.findById(warehouseId);

      // Проверяем существование материала
      const materialCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkMaterialExists",
        "SELECT id FROM materials WHERE id = $1",
        [materialId],
      );

      if (materialCheck.length === 0) {
        throw new NotFoundError(
          `Material with id ${materialId} not found`,
          "Material",
          "WarehouseService",
          materialId,
        );
      }

      // Пытаемся обновить количество, если материал уже есть на складе
      const updateResult = await executeQuery<WarehouseMaterial>(
        this._db,
        "updateExistingMaterial",
        `UPDATE warehouse_material 
         SET amount = amount + $1, updated_at = CURRENT_TIMESTAMP
         WHERE warehouse_id = $2 AND material_id = $3
         RETURNING *`,
        [amount, warehouseId, materialId],
      );

      // Если обновление затронуло строки, значит материал уже был - возвращаем обновленную запись
      if (updateResult.length > 0) {
        return updateResult[0];
      }

      // Если материал не найден - добавляем новую запись
      const insertResult = await executeQuery<WarehouseMaterial>(
        this._db,
        "addNewMaterial",
        `INSERT INTO warehouse_material (warehouse_id, material_id, amount)
       VALUES ($1, $2, $3)
       RETURNING *`,
        [warehouseId, materialId, amount],
      );

      if (insertResult.length === 0) {
        throw new ServiceError(
          "Failed to add material to warehouse - no data returned",
          "WarehouseService",
          "addMaterial",
          new Error("No data returned from INSERT query"),
        );
      }

      return insertResult[0];
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to add material to warehouse ${warehouseId}`,
        "WarehouseService",
        "addMaterial",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Обновление количества материала на складе (замена, а не прибавление)
  async updateMaterialAmount(
    warehouseId: number,
    materialId: number,
    amount: number,
  ): Promise<WarehouseMaterial> {
    try {
      // Проверяем существование склада
      await this.findById(warehouseId);

      // Проверяем существование материала
      const materialCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkMaterialExists",
        "SELECT id FROM materials WHERE id = $1",
        [materialId],
      );

      if (materialCheck.length === 0) {
        throw new NotFoundError(
          `Material with id ${materialId} not found`,
          "Material",
          "WarehouseService",
          materialId,
        );
      }

      // Проверяем, что материал есть на складе
      const existingCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkMaterialInWarehouse",
        "SELECT id FROM warehouse_material WHERE warehouse_id = $1 AND material_id = $2",
        [warehouseId, materialId],
      );

      if (existingCheck.length === 0) {
        throw new NotFoundError(
          `Material with id ${materialId} not found in warehouse ${warehouseId}`,
          "WarehouseMaterial",
          "WarehouseService",
          materialId,
        );
      }

      const rows = await executeQuery<WarehouseMaterial>(
        this._db,
        "updateMaterialAmount",
        `UPDATE warehouse_material 
         SET amount = $1, updated_at = CURRENT_TIMESTAMP
         WHERE warehouse_id = $2 AND material_id = $3
         RETURNING *`,
        [amount, warehouseId, materialId],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to update material amount - no data returned`,
          "WarehouseService",
          "updateMaterialAmount",
          new Error("No data returned from UPDATE query"),
        );
      }

      return rows[0];
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to update material amount in warehouse ${warehouseId}`,
        "WarehouseService",
        "updateMaterialAmount",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Удаление материала со склада
  async removeMaterial(
    warehouseId: number,
    materialId: number,
  ): Promise<WarehouseMaterial> {
    try {
      // Проверяем существование склада
      await this.findById(warehouseId);

      // Проверяем, что материал есть на складе
      const existingCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkMaterialInWarehouse",
        "SELECT id FROM warehouse_material WHERE warehouse_id = $1 AND material_id = $2",
        [warehouseId, materialId],
      );

      if (existingCheck.length === 0) {
        throw new NotFoundError(
          `Material with id ${materialId} not found in warehouse ${warehouseId}`,
          "WarehouseMaterial",
          "WarehouseService",
          materialId,
        );
      }

      const rows = await executeQuery<WarehouseMaterial>(
        this._db,
        "removeMaterial",
        `DELETE FROM warehouse_material 
       WHERE warehouse_id = $1 AND material_id = $2
       RETURNING *`,
        [warehouseId, materialId],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to remove material from warehouse - no data returned`,
          "WarehouseService",
          "removeMaterial",
          new Error("No data returned from DELETE query"),
        );
      }

      return rows[0];
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to remove material from warehouse ${warehouseId}`,
        "WarehouseService",
        "removeMaterial",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Получение всех материалов на складе (без поиска)
  async getMaterials(
    warehouseId: number,
  ): Promise<(WarehouseMaterial & { material: Material })[]> {
    try {
      // Проверяем существование склада
      await this.findById(warehouseId);

      const query = `
      SELECT 
        wm.*,
        row_to_json(m.*) as material
      FROM warehouse_material wm
      INNER JOIN materials m ON wm.material_id = m.id
      WHERE wm.warehouse_id = $1
      ORDER BY m.name
    `;

      const rows = await executeQuery<
        WarehouseMaterial & { material: Material }
      >(this._db, "getMaterials", query, [warehouseId]);

      return rows;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to get materials for warehouse ${warehouseId}`,
        "WarehouseService",
        "getMaterials",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Поиск материалов на складе
  async searchMaterials(
    warehouseId: number,
    input: string,
  ): Promise<(WarehouseMaterial & { material: Material })[]> {
    try {
      // Проверяем существование склада
      await this.findById(warehouseId);

      // Получаем все материалы со склада
      const allMaterials = await this.getMaterials(warehouseId);

      const fuseConfig: IFuseOptions<
        WarehouseMaterial & { material: Material }
      > = {
        keys: [
          { name: "material.name", weight: 0.9 },
          { name: "material.description", weight: 0.3 },
          { name: "material.unit", weight: 0.2 },
        ],
        includeScore: true,
        threshold: 0.2,
        minMatchCharLength: 1,
        findAllMatches: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        shouldSort: true,
      };

      const fuse = new Fuse(allMaterials, fuseConfig);
      const searchResult = fuse.search(input);

      return searchResult.map((i) => i.item);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to search materials in warehouse ${warehouseId}`,
        "WarehouseService",
        "searchMaterials",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findByOrganizationId(
    organizationId: number,
  ): Promise<WarehouseWithMaterialsAndOrganization[]> {
    try {
      // Проверяем существование организации
      const orgCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkOrganizationExists",
        "SELECT id FROM organizations WHERE id = $1",
        [organizationId],
      );

      if (orgCheck.length === 0) {
        throw new NotFoundError(
          `Organization with id ${organizationId} not found`,
          "findByOrganizationId",
          "WarehouseService",
          organizationId,
        );
      }

      const query = `
      SELECT 
        row_to_json(w.*) as warehouse,
        COALESCE(json_agg(DISTINCT m.*) FILTER (WHERE m.id IS NOT NULL), '[]'::json) as materials,
        row_to_json(o.*) as organization,
        row_to_json(u.*) as manager
      FROM warehouses w 
      INNER JOIN organizations o ON w.organization_id = o.id
      LEFT JOIN app_users u ON w.manager_id = u.id
      LEFT JOIN warehouse_material wm ON w.id = wm.warehouse_id 
      LEFT JOIN materials m ON wm.material_id = m.id 
      WHERE w.organization_id = $1
      GROUP BY w.id, o.id, u.id
      ORDER BY w.id
    `;

      const rows = await executeQuery<{
        warehouse: Warehouse;
        materials: WarehouseMaterial[] | null;
        organization: Organization;
        manager: User | null;
      }>(this._db, "findByOrganizationId", query, [organizationId]);

      return rows.map((row) => ({
        ...row.warehouse,
        materials: row.materials || [],
        organization: row.organization,
        manager: row.manager,
        materials_count: row.materials?.length || 0,
      }));
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find warehouses for organization with id ${organizationId}`,
        "WarehouseService",
        "findByOrganizationId",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async searchByOrganizationId(
    organizationId: number,
    input: string,
  ): Promise<WarehouseWithMaterialsAndOrganization[]> {
    try {
      // Проверяем существование организации
      const orgCheck = await executeQuery<{ id: number }>(
        this._db,
        "checkOrganizationExists",
        "SELECT id FROM organizations WHERE id = $1",
        [organizationId],
      );

      if (orgCheck.length === 0) {
        throw new NotFoundError(
          `Organization with id ${organizationId} not found`,
          "searchByOrganizationId",
          "WarehouseService",
          organizationId,
        );
      }

      // Получаем все склады организации
      const warehouses = await this.findByOrganizationId(organizationId);

      const fuseConfig: IFuseOptions<WarehouseWithMaterialsAndOrganization> = {
        keys: [
          { name: "name", weight: 0.9 },
          { name: "manager.name", weight: 0.3 },
        ],
        includeScore: true,
        threshold: 0.2,
        minMatchCharLength: 1,
        findAllMatches: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        shouldSort: true,
      };

      const fuse = new Fuse(warehouses, fuseConfig);
      const searchResult = fuse.search(input);

      return searchResult.map((i) => i.item);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to search warehouses for organization with id ${organizationId}`,
        "WarehouseService",
        "searchByOrganizationId",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
