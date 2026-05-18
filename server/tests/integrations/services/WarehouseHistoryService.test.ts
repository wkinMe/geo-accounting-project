// tests/integrations/WarehouseHistoryService.test.ts
import { WarehouseHistoryService } from "../../../src/services/WarehouseHistoryService";
import { WarehouseHistoryRepository } from "../../../src/repositories/WarehouseHistoryRepository";
import { WarehouseRepository } from "../../../src/repositories/WarehouseRepository";
import { MaterialRepository } from "../../../src/repositories/MaterialRepository";
import { OrganizationRepository } from "../../../src/repositories/OrganizationRepository";
import { testPool } from "../../../src/db";
import { Warehouse } from "../../../src/domain/entities/Warehouse";
import { Material } from "../../../src/domain/entities/Material";
import { Organization } from "../../../src/domain/entities/Organization";
import { WAREHOUSE_HISTORY_TYPES } from "@shared/constants/warehouseHistoryTypes";

describe("WarehouseHistoryService Integration Tests", () => {
  let historyService: WarehouseHistoryService;
  let historyRepo: WarehouseHistoryRepository;
  let warehouseRepo: WarehouseRepository;
  let materialRepo: MaterialRepository;
  let organizationRepo: OrganizationRepository;
  let testOrganizationId: number;
  let testWarehouseId: number;
  let testMaterialId: number;

  beforeAll(async () => {
    historyRepo = new WarehouseHistoryRepository(testPool);
    warehouseRepo = new WarehouseRepository(testPool);
    materialRepo = new MaterialRepository(testPool);
    organizationRepo = new OrganizationRepository(testPool);
    historyService = new WarehouseHistoryService(
      historyRepo,
      warehouseRepo,
      materialRepo,
    );

    const org = Organization.create(
      "Тестовая организация для истории",
      52.4345,
      30.95,
    );
    const savedOrg = await organizationRepo.save(org);
    testOrganizationId = savedOrg.id!;

    const warehouse = Warehouse.create(
      "history_test_wh",
      testOrganizationId,
      52.0,
      31.0,
    );
    const savedWarehouse = await warehouseRepo.save(warehouse);
    testWarehouseId = savedWarehouse.id!;

    const material = Material.create("history_test_material", "шт");
    const savedMaterial = await materialRepo.save(material);
    testMaterialId = savedMaterial.id!;
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM warehouse_material_history CASCADE");
    await testPool.query("DELETE FROM warehouse_material CASCADE");
    await testPool.query("DELETE FROM materials CASCADE");
    await testPool.query("DELETE FROM warehouses CASCADE");
    await testPool.query("DELETE FROM organizations CASCADE");
    await testPool.end();
  });

  test("должен создать запись в истории", async () => {
    const result = await historyService.createEntry({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_ADD,
      old_amount: 0,
      new_amount: 100,
      delta: 100,
      description: "Тестовое добавление",
    });
    expect(result.id).toBeDefined();
    expect(result.warehouse_id).toBe(testWarehouseId);
  });

  test("должен выбросить ошибку при создании истории для несуществующего склада", async () => {
    await expect(
      historyService.createEntry({
        warehouse_id: 99999,
        material_id: testMaterialId,
        operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_ADD,
        old_amount: 0,
        new_amount: 100,
        delta: 100,
      }),
    ).rejects.toThrow("Склад с ID 99999 не найден");
  });

  test("должен выбросить ошибку при создании истории для несуществующего материала", async () => {
    await expect(
      historyService.createEntry({
        warehouse_id: testWarehouseId,
        material_id: 99999,
        operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_ADD,
        old_amount: 0,
        new_amount: 100,
        delta: 100,
      }),
    ).rejects.toThrow("Материал с ID 99999 не найден");
  });

  test("должен получить историю по складу", async () => {
    const result = await historyService.getHistory(testWarehouseId, 10, 0);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  test("должен вернуть пустую историю для склада без записей", async () => {
    const newOrg = Organization.create(
      "Организация для пустого склада",
      53.0,
      32.0,
    );
    const savedOrg = await organizationRepo.save(newOrg);
    const newWarehouse = Warehouse.create("empty_wh", savedOrg.id!, 53.0, 32.0);
    const saved = await warehouseRepo.save(newWarehouse);
    const result = await historyService.getHistory(saved.id!, 10, 0);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("должен выбросить ошибку при получении истории для несуществующего склада", async () => {
    await expect(historyService.getHistory(99999)).rejects.toThrow(
      "Склад с ID 99999 не найден",
    );
  });

  test("должен найти записи в истории по поисковому запросу", async () => {
    const uniqueText = `Уникальное_описание_${Date.now()}`;
    await historyService.createEntry({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_ADD,
      old_amount: 0,
      new_amount: 50,
      delta: 50,
      description: uniqueText,
    });

    const result = await historyService.search(testWarehouseId, uniqueText);
    expect(result.data.length).toBeGreaterThan(0);
  });

  test("должен вернуть пустые результаты при поиске без совпадений", async () => {
    const result = await historyService.search(
      testWarehouseId,
      "nonexistent_text_xyz_12345",
    );
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("должен создать историю с отрицательной дельтой для списания", async () => {
    const result = await historyService.createEntry({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_REMOVE,
      old_amount: 200,
      new_amount: 150,
      delta: -50,
    });
    expect(result.delta).toBe(-50);
  });
});
