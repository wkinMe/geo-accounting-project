// tests/repositories/WarehouseHistoryRepository.test.ts
import { WarehouseHistoryRepository } from "../../src/repositories/WarehouseHistoryRepository";
import { WarehouseHistoryItem } from "../../src/domain/entities/WarehouseHistoryItem";
import { Pool } from "pg";
import { DatabaseError } from "@shared/service";
import { WAREHOUSE_HISTORY_TYPES } from "@shared/constants/warehouseHistoryTypes";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("WarehouseHistoryRepository", () => {
  let repository: WarehouseHistoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new WarehouseHistoryRepository(mockPool);
  });

  describe("findByWarehouseWithDetails", () => {
    test("должен вернуть пустую историю если записей нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      const result = await repository.findByWarehouseWithDetails(1);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("save", () => {
    test("должен выбросить DatabaseError при неудачном сохранении", async () => {
      const history = WarehouseHistoryItem.create({
        warehouse_id: 1,
        material_id: 1,
        operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_ADD,
        old_amount: 0,
        new_amount: 10,
        delta: 10,
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(history)).rejects.toThrow(DatabaseError);
    });
  });

  describe("search", () => {
    test("должен вернуть пустые результаты если ничего не найдено", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      const result = await repository.search(1, "nonexistent");
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
