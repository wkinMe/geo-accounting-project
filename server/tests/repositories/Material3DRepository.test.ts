// tests/repositories/Material3DRepository.test.ts
import { Material3DRepository } from "../../src/repositories/Material3DRepository";
import { Material3D } from "../../src/domain/entities/Material3D";
import { Pool } from "pg";
import { DatabaseError, NotFoundError } from "@shared/service";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("Material3DRepository", () => {
  let repository: Material3DRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new Material3DRepository(mockPool);
  });

  describe("findByMaterialId", () => {
    test("должен вернуть null если 3D модель не найдена", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByMaterialId(999);
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    test("должен вернуть null если модель с таким ID не найдена", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    test("должен выбросить DatabaseError при неудачном сохранении", async () => {
      const model = Material3D.create(1, "gltf", Buffer.from("test"));
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(model)).rejects.toThrow(DatabaseError);
    });
  });

  describe("update", () => {
    test("должен выбросить NotFoundError при обновлении несуществующей модели", async () => {
      const model = Material3D.create(1, "gltf", Buffer.from("test"));
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(999, model)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("delete", () => {
    test("должен выбросить NotFoundError при удалении несуществующей модели", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });
      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("exists", () => {
    test("должен вернуть false если 3D модель не существует", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.exists(999);
      expect(result).toBe(false);
    });

    test("должен вернуть true если 3D модель существует", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const result = await repository.exists(1);
      expect(result).toBe(true);
    });
  });
});
