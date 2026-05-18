// tests/repositories/MaterialRepository.test.ts
import { MaterialRepository } from "../../src/repositories/MaterialRepository";
import { Material } from "../../src/domain/entities/Material";
import { Pool } from "pg";
import { DatabaseError, NotFoundError } from "@shared/service";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("MaterialRepository", () => {
  let repository: MaterialRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MaterialRepository(mockPool);
  });

  describe("findAll", () => {
    test("должен вернуть пустой массив если материалов нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      const result = await repository.findAll();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("findById", () => {
    test("должен вернуть null при несуществующем ID", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe("findByName", () => {
    test("должен вернуть null при несуществующем имени", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByName("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    test("должен выбросить DatabaseError при неудачном сохранении", async () => {
      const material = Material.create("Тест", "шт");
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(material)).rejects.toThrow(DatabaseError);
    });
  });

  describe("update", () => {
    test("должен выбросить NotFoundError при обновлении несуществующего материала", async () => {
      const material = Material.create("Тест", "шт");
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(999, material)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("delete", () => {
    test("должен выбросить ошибку если материал используется в договорах", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 5 }] });
      await expect(repository.delete(1)).rejects.toThrow(
        "используется в договорах",
      );
    });

    test("должен выбросить NotFoundError при удалении несуществующего материала", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });
});
