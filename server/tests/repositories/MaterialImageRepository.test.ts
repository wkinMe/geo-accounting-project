// tests/repositories/MaterialImageRepository.test.ts
import { MaterialImageRepository } from "../../src/repositories/MaterialImageRepository";
import { Pool } from "pg";
import { NotFoundError } from "@shared/service";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("MaterialImageRepository", () => {
  let repository: MaterialImageRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MaterialImageRepository(mockPool);
  });

  describe("getImage", () => {
    test("должен вернуть null если изображение не найдено", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.getImage(999);
      expect(result).toBeNull();
    });

    test("должен вернуть Buffer изображения если оно существует", async () => {
      const mockBuffer = Buffer.from("test image data");
      mockQuery.mockResolvedValueOnce({ rows: [{ image: mockBuffer }] });
      const result = await repository.getImage(1);
      expect(result).toEqual(mockBuffer);
    });
  });

  describe("upsertImage", () => {
    test("должен выбросить NotFoundError если материал не существует", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(
        repository.upsertImage(999, Buffer.from("test")),
      ).rejects.toThrow(NotFoundError);
    });

    test("должен выполнить вставку при существующем материале", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await repository.upsertImage(1, Buffer.from("test"));
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe("deleteImage", () => {
    test("должен выполнить удаление даже если изображения нет", async () => {
      mockQuery.mockResolvedValueOnce({});
      await repository.deleteImage(999);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("imageExists", () => {
    test("должен вернуть false если изображения нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.imageExists(999);
      expect(result).toBe(false);
    });

    test("должен вернуть true если изображение существует", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ material_id: 1 }] });
      const result = await repository.imageExists(1);
      expect(result).toBe(true);
    });
  });
});
