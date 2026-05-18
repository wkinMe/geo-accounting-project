// tests/integration/OrganizationService.integration.test.ts
import { OrganizationService } from "../../../src/services/OrganizationService";
import { OrganizationRepository } from "../../../src/repositories/OrganizationRepository";
import { testPool } from "../../../src/db";
import { UpdateOrganizationDTO } from "@shared/dto";

describe("OrganizationService Integration Tests", () => {
  let organizationService: OrganizationService;
  let organizationRepo: OrganizationRepository;
  let testOrganizationId: number;

  beforeAll(async () => {
    organizationRepo = new OrganizationRepository(testPool);
    organizationService = new OrganizationService(organizationRepo);
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM organizations CASCADE");
    await testPool.end();
  });

  test("должен создать организацию", async () => {
    const result = await organizationService.create({
      name: "Тестовая организация",
      latitude: 52.4345,
      longitude: 30.95,
    });
    testOrganizationId = result.id!;
    expect(result.name).toBe("Тестовая организация");
    expect(result.latitude).toBe(52.4345);
  });

  test("должен выбросить ошибку при создании дубликата по имени", async () => {
    await expect(
      organizationService.create({
        name: "Тестовая организация",
        latitude: 52.0,
        longitude: 31.0,
      }),
    ).rejects.toThrow(
      'Организация с названием "Тестовая организация" уже существует',
    );
  });

  test("должен выбросить ошибку при создании с пустым названием", async () => {
    await expect(
      organizationService.create({
        name: "",
        latitude: 52.0,
        longitude: 31.0,
      }),
    ).rejects.toThrow("Название организации обязательно");
  });

  test("должен выбросить ошибку при неверной широте", async () => {
    await expect(
      organizationService.create({
        name: "Организация с ошибкой",
        latitude: 100,
        longitude: 31.0,
      }),
    ).rejects.toThrow("Широта должна быть в диапазоне от -90 до 90");
  });

  test("должен найти организацию по ID", async () => {
    const found = await organizationService.findById(testOrganizationId);
    expect(found.id).toBe(testOrganizationId);
  });

  test("должен выбросить ошибку при поиске несуществующей организации", async () => {
    await expect(organizationService.findById(99999)).rejects.toThrow(
      "Организация с ID 99999 не найдена",
    );
  });

  test("должен обновить название организации", async () => {
    const updateData: UpdateOrganizationDTO = {
      id: testOrganizationId,
      name: "Обновлённая организация",
    };
    const updated = await organizationService.update(
      testOrganizationId,
      updateData,
    );
    expect(updated.name).toBe("Обновлённая организация");
  });

  test("должен обновить координаты организации", async () => {
    const updateData: UpdateOrganizationDTO = {
      id: testOrganizationId,
      latitude: 53.0,
      longitude: 31.5,
    };
    const updated = await organizationService.update(
      testOrganizationId,
      updateData,
    );
    expect(updated.latitude).toBe(53.0);
    expect(updated.longitude).toBe(31.5);
  });

  test("должен найти организации по поисковому запросу", async () => {
    const results = await organizationService.search("Обновлённая");
    expect(results.data.length).toBeGreaterThan(0);
  });

  test("должен вернуть все организации при пустом поисковом запросе", async () => {
    const results = await organizationService.search("");
    expect(results.total).toBeGreaterThan(0);
  });

  test("должен удалить организацию", async () => {
    await organizationService.delete(testOrganizationId);
    await expect(
      organizationService.findById(testOrganizationId),
    ).rejects.toThrow();
  });
});
