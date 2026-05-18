// tests/integrations/MaterialService.test.ts
import { MaterialService } from "../../../src/services/MaterialService";
import { MaterialRepository } from "../../../src/repositories/MaterialRepository";
import { MaterialImageRepository } from "../../../src/repositories/MaterialImageRepository";
import { testPool } from "../../../src/db";
import { Material } from "../../../src/domain/entities/Material";

describe("MaterialService Integration Tests", () => {
  let materialService: MaterialService;
  let materialRepo: MaterialRepository;
  let imageRepo: MaterialImageRepository;
  let testMaterialId: number;

  beforeAll(async () => {
    materialRepo = new MaterialRepository(testPool);
    imageRepo = new MaterialImageRepository(testPool);
    materialService = new MaterialService(materialRepo, imageRepo);
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM warehouse_material_history CASCADE");
    await testPool.query("DELETE FROM warehouse_material CASCADE");
    await testPool.query("DELETE FROM materials_images CASCADE");
    await testPool.query("DELETE FROM materials CASCADE");
    await testPool.end();
  });

  test("должен создать материал без изображения", async () => {
    const result = await materialService.create({
      name: "Поисковый тестовый материал",
      unit: "шт",
    });
    testMaterialId = result.id!;
    expect(result.name).toBe("Поисковый тестовый материал");
    expect(result.unit).toBe("шт");
  });

  test("должен найти материалы по поисковому запросу", async () => {
    await materialService.create({
      name: "Тестовый материал для поиска",
      unit: "кг",
    });

    const results = await materialService.search("Поисковый");
    expect(results.data.length).toBeGreaterThan(0);
  });

  test("должен вернуть все материалы при пустом поисковом запросе", async () => {
    const results = await materialService.search("");
    expect(results.total).toBeGreaterThan(0);
  });
});
