// tests/integration/MaterialImageService.integration.test.ts
import { MaterialImageService } from "../../../src/services/MaterialImageService";
import { testPool } from "../../../src/db";
import { Material } from "../../../src/domain/entities/Material";
import { MaterialRepository } from "../../../src/repositories/MaterialRepository";

describe("MaterialImageService Integration Tests", () => {
  let materialImageService: MaterialImageService;
  let materialRepo: MaterialRepository;
  let testMaterialId: number;

  beforeAll(async () => {
    materialImageService = new MaterialImageService(testPool);
    materialRepo = new MaterialRepository(testPool);

    const material = Material.create("image_test_material", "шт");
    const savedMaterial = await materialRepo.save(material);
    testMaterialId = savedMaterial.id!;
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM materials_images CASCADE");
    await testPool.query("DELETE FROM materials CASCADE");
    await testPool.end();
  });

  test("должен вернуть null при запросе изображения для материала без изображения", async () => {
    const result =
      await materialImageService.getImageByMaterialId(testMaterialId);
    expect(result).toBeNull();
  });

  test("должен сохранить изображение для материала", async () => {
    const imageData = Buffer.from("test image binary data");
    await materialImageService.upsertImage(testMaterialId, imageData);
    const saved =
      await materialImageService.getImageByMaterialId(testMaterialId);
    expect(saved).toEqual(imageData);
  });

  test("должен обновить существующее изображение", async () => {
    const newImageData = Buffer.from("updated image data");
    await materialImageService.upsertImage(testMaterialId, newImageData);
    const updated =
      await materialImageService.getImageByMaterialId(testMaterialId);
    expect(updated).toEqual(newImageData);
  });

  test("должен выбросить ошибку при сохранении изображения для несуществующего материала", async () => {
    await expect(
      materialImageService.upsertImage(99999, Buffer.from("test")),
    ).rejects.toThrow("Material with ID 99999 not found");
  });

  test("должен вернуть true при проверке существования изображения", async () => {
    const exists = await materialImageService.imageExists(testMaterialId);
    expect(exists).toBe(true);
  });

  test("должен вернуть false при проверке существования изображения для материала без изображения", async () => {
    const newMaterial = Material.create("no_image_material", "шт");
    const saved = await materialRepo.save(newMaterial);
    const exists = await materialImageService.imageExists(saved.id!);
    expect(exists).toBe(false);
  });

  test("должен удалить изображение материала", async () => {
    await materialImageService.deleteImage(testMaterialId);
    const afterDelete =
      await materialImageService.getImageByMaterialId(testMaterialId);
    expect(afterDelete).toBeNull();
  });

  test("должен корректно обработать удаление несуществующего изображения", async () => {
    await expect(
      materialImageService.deleteImage(99999),
    ).resolves.not.toThrow();
  });
});
