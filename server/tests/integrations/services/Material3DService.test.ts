// tests/integration/Material3DService.integration.test.ts
import { Material3DService } from "../../../src/services/Material3DService";
import { Material3DRepository } from "../../../src/repositories/Material3DRepository";
import { MaterialRepository } from "../../../src/repositories/MaterialRepository";
import { testPool } from "../../../src/db";
import { Material } from "../../../src/domain/entities/Material";

describe("Material3DService Integration Tests", () => {
  let material3DService: Material3DService;
  let material3DRepo: Material3DRepository;
  let materialRepo: MaterialRepository;
  let testMaterialId: number;

  beforeAll(async () => {
    material3DRepo = new Material3DRepository(testPool);
    materialRepo = new MaterialRepository(testPool);
    material3DService = new Material3DService(material3DRepo, materialRepo);

    const material = Material.create("test_3d_material", "шт");
    const savedMaterial = await materialRepo.save(material);
    testMaterialId = savedMaterial.id!;
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM materials_3d CASCADE");
    await testPool.query("DELETE FROM materials CASCADE");
    await testPool.end();
  });

  test("должен создать 3D модель для материала", async () => {
    const modelData = Buffer.from("test gltf data");
    const result = await material3DService.create({
      materialId: testMaterialId,
      format: "gltf",
      modelData: modelData,
    });
    expect(result.materialId).toBe(testMaterialId);
    expect(result.format).toBe("gltf");
  });

  test("должен выбросить ошибку при создании дубликата 3D модели", async () => {
    const modelData = Buffer.from("another data");
    await expect(
      material3DService.create({
        materialId: testMaterialId,
        format: "gltf",
        modelData: modelData,
      }),
    ).rejects.toThrow("3D object already exists");
  });

  test("должен выбросить ошибку при создании для несуществующего материала", async () => {
    const modelData = Buffer.from("test data");
    await expect(
      material3DService.create({
        materialId: 99999,
        format: "gltf",
        modelData: modelData,
      }),
    ).rejects.toThrow("Material with id 99999 not found");
  });

  test("должен найти 3D модель по ID материала", async () => {
    const result = await material3DService.findByMaterialId(testMaterialId);
    expect(result).not.toBeNull();
    expect(result?.materialId).toBe(testMaterialId);
  });

  test("должен вернуть null при поиске 3D модели для материала без модели", async () => {
    const newMaterial = Material.create("no_3d_material", "шт");
    const saved = await materialRepo.save(newMaterial);
    const result = await material3DService.findByMaterialId(saved.id!);
    expect(result).toBeNull();
  });

  test("должен обновить формат 3D модели", async () => {
    const result = await material3DService.update(testMaterialId, {
      format: "obj",
    });
    expect(result.format).toBe("obj");
  });

  test("должен обновить данные 3D модели", async () => {
    const newData = Buffer.from("updated model data");
    const result = await material3DService.update(testMaterialId, {
      modelData: newData,
    });
    const fetched = await material3DService.findByMaterialId(testMaterialId);
    expect(fetched?.modelData).toEqual(newData);
  });

  test("должен выбросить ошибку при обновлении несуществующей модели", async () => {
    const newMaterial = Material.create("temp_material", "шт");
    const saved = await materialRepo.save(newMaterial);
    await expect(
      material3DService.update(saved.id!, { format: "gltf" }),
    ).rejects.toThrow(`3D object for material ${saved.id} not found`);
  });

  test("должен выбросить ошибку при создании с недопустимым форматом", async () => {
    const newMaterial = Material.create("invalid_format", "шт");
    const saved = await materialRepo.save(newMaterial);
    const modelData = Buffer.from("test");
    await expect(
      material3DService.create({
        materialId: saved.id!,
        format: "invalid",
        modelData: modelData,
      }),
    ).rejects.toThrow("Format must be one of: gltf, glb, obj, fbx, stl");
  });

  test("должен удалить 3D модель", async () => {
    await material3DService.delete(testMaterialId);
    const result = await material3DService.findByMaterialId(testMaterialId);
    expect(result).toBeNull();
  });

  test("должен выбросить ошибку при удалении несуществующей модели", async () => {
    await expect(material3DService.delete(99999)).rejects.toThrow(
      "Material with id 99999 not found",
    );
  });
});
