// tests/integrations/InventoryService.test.ts
import { InventoryService } from "../../../src/services/InventoryService";
import { InventoryRepository } from "../../../src/repositories/InventoryRepository";
import { WarehouseRepository } from "../../../src/repositories/WarehouseRepository";
import { MaterialRepository } from "../../../src/repositories/MaterialRepository";
import { WarehouseHistoryRepository } from "../../../src/repositories/WarehouseHistoryRepository";
import { WarehouseHistoryService } from "../../../src/services/WarehouseHistoryService";
import { OrganizationRepository } from "../../../src/repositories/OrganizationRepository";
import { testPool } from "../../../src/db";
import { Warehouse } from "../../../src/domain/entities/Warehouse";
import { Material } from "../../../src/domain/entities/Material";
import { Organization } from "../../../src/domain/entities/Organization";

describe("InventoryService Integration Tests", () => {
  let inventoryService: InventoryService;
  let inventoryRepo: InventoryRepository;
  let warehouseRepo: WarehouseRepository;
  let materialRepo: MaterialRepository;
  let historyRepo: WarehouseHistoryRepository;
  let organizationRepo: OrganizationRepository;
  let testOrganizationId: number;
  let testWarehouseId: number;
  let testMaterialId: number;

  beforeAll(async () => {
    inventoryRepo = new InventoryRepository(testPool);
    warehouseRepo = new WarehouseRepository(testPool);
    materialRepo = new MaterialRepository(testPool);
    historyRepo = new WarehouseHistoryRepository(testPool);
    organizationRepo = new OrganizationRepository(testPool);

    const historyService = new WarehouseHistoryService(
      historyRepo,
      warehouseRepo,
      materialRepo,
    );
    inventoryService = new InventoryService(
      inventoryRepo,
      warehouseRepo,
      materialRepo,
      historyService,
    );

    const org = Organization.create(
      "Тестовая организация для инвентаря",
      52.4345,
      30.95,
    );
    const savedOrg = await organizationRepo.save(org);
    testOrganizationId = savedOrg.id!;

    const warehouse = Warehouse.create(
      "test_warehouse",
      testOrganizationId,
      52.0,
      31.0,
    );
    const savedWarehouse = await warehouseRepo.save(warehouse);
    testWarehouseId = savedWarehouse.id!;

    const material = Material.create("test_material_inv", "шт");
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

  test("getStock возвращает 0 если материал отсутствует на складе", async () => {
    const stock = await inventoryService.getStock(testWarehouseId, 99999);
    expect(stock).toBe(0);
  });

  test("addMaterial добавляет материал на склад", async () => {
    const result = await inventoryService.addMaterial({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      amount: 50,
    });
    expect(result.amount).toBe(50);
  });

  test("addMaterial с отрицательным количеством вызывает ошибку", async () => {
    await expect(
      inventoryService.addMaterial({
        warehouse_id: testWarehouseId,
        material_id: testMaterialId,
        amount: -10,
      }),
    ).rejects.toThrow("Количество должно быть положительным");
  });

  test("addMaterial с несуществующим складом вызывает ошибку", async () => {
    await expect(
      inventoryService.addMaterial({
        warehouse_id: 99999,
        material_id: testMaterialId,
        amount: 10,
      }),
    ).rejects.toThrow("Склад с ID 99999 не найден");
  });

  test("addMaterial с несуществующим материалом вызывает ошибку", async () => {
    await expect(
      inventoryService.addMaterial({
        warehouse_id: testWarehouseId,
        material_id: 99999,
        amount: 10,
      }),
    ).rejects.toThrow("Материал с ID 99999 не найден");
  });

  test("removeMaterial списывает материал со склада", async () => {
    await inventoryService.addMaterial({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      amount: 100,
    });
    await inventoryService.removeMaterial({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      amount: 30,
    });
    const stock = await inventoryService.getStock(
      testWarehouseId,
      testMaterialId,
    );
    expect(stock).toBe(120);
  });

  test("removeMaterial с недостаточным количеством вызывает ошибку", async () => {
    await expect(
      inventoryService.removeMaterial({
        warehouse_id: testWarehouseId,
        material_id: testMaterialId,
        amount: 1000,
      }),
    ).rejects.toThrow("Недостаточно материала");
  });

  test("setAmount устанавливает точное количество материала", async () => {
    await inventoryService.setAmount({
      warehouse_id: testWarehouseId,
      material_id: testMaterialId,
      amount: 200,
    });
    const stock = await inventoryService.getStock(
      testWarehouseId,
      testMaterialId,
    );
    expect(stock).toBe(200);
  });

  test("setAmount с отрицательным количеством вызывает ошибку", async () => {
    await expect(
      inventoryService.setAmount({
        warehouse_id: testWarehouseId,
        material_id: testMaterialId,
        amount: -50,
      }),
    ).rejects.toThrow("Количество не может быть отрицательным");
  });

  test("getMaterialDistribution возвращает распределение материала", async () => {
    const distribution =
      await inventoryService.getMaterialDistribution(testMaterialId);
    expect(distribution.total_amount).toBeGreaterThan(0);
    expect(distribution.warehouses_count).toBeGreaterThan(0);
  });

  test("getMaterialDistribution с несуществующим материалом вызывает ошибку", async () => {
    await expect(
      inventoryService.getMaterialDistribution(99999),
    ).rejects.toThrow("Материал с ID 99999 не найден");
  });

  test("findWarehouseWithMaxMaterial находит склад с максимальным количеством", async () => {
    const result =
      await inventoryService.findWarehouseWithMaxMaterial(testMaterialId);
    expect(result).not.toBeNull();
    expect(result?.warehouse_id).toBe(testWarehouseId);
  });

  test("checkAvailability возвращает true при достаточном количестве", async () => {
    const isAvailable = await inventoryService.checkAvailability(
      testWarehouseId,
      [{ material_id: testMaterialId, required_amount: 50 }],
    );
    expect(isAvailable).toBe(true);
  });

  test("checkAvailability возвращает false при недостаточном количестве", async () => {
    const isAvailable = await inventoryService.checkAvailability(
      testWarehouseId,
      [{ material_id: testMaterialId, required_amount: 10000 }],
    );
    expect(isAvailable).toBe(false);
  });
});
