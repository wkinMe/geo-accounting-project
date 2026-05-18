// tests/integration/WarehouseService.integration.test.ts
import { WarehouseRepository } from "../../../src/repositories/WarehouseRepository";
import { OrganizationRepository } from "../../../src/repositories/OrganizationRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { testPool } from "../../../src/db";
import { Organization } from "../../../src/domain/entities/Organization";
import { User } from "../../../src/domain/entities/User";
import { WarehouseService } from "@/src/services";
import { UpdateWarehouseDTO } from "@shared/dto";

describe("WarehouseService Integration Tests", () => {
  let warehouseService: WarehouseService;
  let warehouseRepo: WarehouseRepository;
  let organizationRepo: OrganizationRepository;
  let userRepo: UserRepository;
  let testOrganizationId: number;
  let testManagerId: number;
  let testWarehouseId: number;

  beforeAll(async () => {
    warehouseRepo = new WarehouseRepository(testPool);
    organizationRepo = new OrganizationRepository(testPool);
    userRepo = new UserRepository(testPool);
    warehouseService = new WarehouseService(
      warehouseRepo,
      organizationRepo,
      userRepo,
    );

    const org = Organization.create(
      "Тестовая организация для склада",
      52.0,
      31.0,
    );
    const savedOrg = await organizationRepo.save(org);
    testOrganizationId = savedOrg.id!;

    const manager = User.create(
      "test_manager",
      "hashed",
      "manager",
      testOrganizationId,
    );
    const savedManager = await userRepo.save(manager);
    testManagerId = savedManager.id!;
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM warehouses CASCADE");
    await testPool.query("DELETE FROM app_users CASCADE");
    await testPool.query("DELETE FROM organizations CASCADE");
    await testPool.end();
  });

  test("должен создать склад", async () => {
    const result = await warehouseService.create({
      name: "Тестовый склад",
      organization_id: testOrganizationId,
      manager_id: testManagerId,
      latitude: 52.4345,
      longitude: 30.95,
    });
    testWarehouseId = result.id!;
    expect(result.name).toBe("Тестовый склад");
    expect(result.organization_id).toBe(testOrganizationId);
  });

  test("должен выбросить ошибку при создании дубликата по имени в одной организации", async () => {
    await expect(
      warehouseService.create({
        name: "Тестовый склад",
        organization_id: testOrganizationId,
        latitude: 52.0,
        longitude: 31.0,
      }),
    ).rejects.toThrow(
      'Склад с названием "Тестовый склад" уже существует в этой организации',
    );
  });

  test("должен выбросить ошибку при создании с пустым названием", async () => {
    await expect(
      warehouseService.create({
        name: "",
        organization_id: testOrganizationId,
        latitude: 52.0,
        longitude: 31.0,
      }),
    ).rejects.toThrow("Название склада обязательно");
  });

  test("должен выбросить ошибку при создании с неверной широтой", async () => {
    await expect(
      warehouseService.create({
        name: "Склад с ошибкой",
        organization_id: testOrganizationId,
        latitude: 100,
        longitude: 31.0,
      }),
    ).rejects.toThrow("Широта должна быть в диапазоне от -90 до 90");
  });

  test("должен найти склад по ID", async () => {
    const found = await warehouseService.findById(testWarehouseId);
    expect(found.id).toBe(testWarehouseId);
  });

  test("должен выбросить ошибку при поиске несуществующего склада", async () => {
    await expect(warehouseService.findById(99999)).rejects.toThrow(
      "Склад с ID 99999 не найден",
    );
  });

  test("должен обновить название склада", async () => {
    const updateData: UpdateWarehouseDTO = {
      latitude: 52.4345,
      longitude: 30.95,
      name: "Обновлённый склад",
    };
    const updated = await warehouseService.update(testWarehouseId, updateData);
    expect(updated.name).toBe("Обновлённый склад");
  });

  test("должен назначить менеджера на склад", async () => {
    const updated = await warehouseService.assignManager(
      testWarehouseId,
      testManagerId,
    );
    expect(updated.manager_id).toBe(testManagerId);
  });

  test("должен снять менеджера со склада", async () => {
    const updated = await warehouseService.assignManager(testWarehouseId, null);
    expect(updated.manager_id).toBeNull();
  });

  test("должен найти склады по менеджеру", async () => {
    await warehouseService.assignManager(testWarehouseId, testManagerId);
    const warehouses = await warehouseService.findByManagerId(testManagerId);
    expect(warehouses.length).toBeGreaterThan(0);
  });

  test("должен найти склады по поисковому запросу", async () => {
    const results = await warehouseService.search("Обновлённый");
    expect(results.data.length).toBeGreaterThan(0);
  });

  test("должен вернуть все склады при пустом поисковом запросе", async () => {
    const results = await warehouseService.search("");
    expect(results.total).toBeGreaterThan(0);
  });

  test("должен удалить склад", async () => {
    const newWarehouse = await warehouseService.create({
      name: "Склад для удаления",
      organization_id: testOrganizationId,
      latitude: 52.5,
      longitude: 31.5,
    });
    await warehouseService.delete(newWarehouse.id!);
    await expect(warehouseService.findById(newWarehouse.id!)).rejects.toThrow();
  });
});
