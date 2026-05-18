// tests/repositories/InventoryRepository.test.ts
import { InventoryRepository } from "../../src/repositories/InventoryRepository";
import { Pool } from "pg";
import { NotFoundError } from "@shared/service";
import { InventoryItem } from "@/src/domain/entities/InventoryItem";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("InventoryRepository", () => {
  let repository: InventoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new InventoryRepository(mockPool);
  });

  describe("findByWarehouseAndMaterial", () => {
    test("должен вернуть null если материал не найден на складе", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByWarehouseAndMaterial(1, 999);
      expect(result).toBeNull();
    });
  });

  describe("findByWarehouse", () => {
    test("должен вернуть пустой массив если на складе нет материалов", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByWarehouse(1);
      expect(result).toEqual([]);
    });
  });

  describe("findByMaterial", () => {
    test("должен вернуть пустой массив если материал нигде не хранится", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByMaterial(999);
      expect(result).toEqual([]);
    });
  });

  describe("getTotalAmount", () => {
    test("должен вернуть 0 если материал нигде не хранится", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: null }] });
      const result = await repository.getTotalAmount(999);
      expect(result).toBe(0);
    });
  });

  describe("findWarehouseWithMaxMaterial", () => {
    test("должен вернуть null если материал нигде не хранится", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findWarehouseWithMaxMaterial(999);
      expect(result).toBeNull();
    });
  });

  describe("findTopWarehousesByMaterial", () => {
    test("должен вернуть пустой массив если материал нигде не хранится", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findTopWarehousesByMaterial(999);
      expect(result).toEqual([]);
    });
  });

  describe("getMaterialDistribution", () => {
    test("должен вернуть нулевые значения если материал нигде не хранится", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.getMaterialDistribution(999);
      expect(result.total_amount).toBe(0);
      expect(result.warehouses_count).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  describe("delete", () => {
    test("должен выбросить NotFoundError при удалении несуществующей записи", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.delete(1, 999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    test("должен выбросить NotFoundError при обновлении несуществующей записи", async () => {
      const item = new InventoryItem(
        undefined,
        1,
        999,
        10,
        new Date(),
        new Date(),
      );
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(item)).rejects.toThrow(NotFoundError);
    });
  });
});
