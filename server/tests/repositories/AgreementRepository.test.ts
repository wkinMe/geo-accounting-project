// tests/repositories/AgreementRepository.test.ts
import { AgreementRepository } from "../../src/repositories/AgreementRepository";
import { Agreement } from "../../src/domain/entities/Agreement";
import { Pool } from "pg";
import { DatabaseError, NotFoundError } from "@shared/service";
import { AGREEMENT_STATUS } from "@shared/constants";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("AgreementRepository", () => {
  let repository: AgreementRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AgreementRepository(mockPool);
  });

  describe("findAll", () => {
    test("должен вернуть пустой массив, если договоров нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    test("должен добавить условие 1=0 для роли user", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await repository.findAll({ role: "user" });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("1=0"),
        expect.any(Array),
      );
    });

    test("должен добавить фильтр для админа по организации", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await repository.findAll({ role: "admin", organization_id: 5 });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("supplier_id IN"),
        [5],
      );
    });

    test("должен добавить фильтр для менеджера по user_id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await repository.findAll({ role: "manager", user_id: 10 });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("supplier_id = $1 OR customer_id = $1"),
        [10],
      );
    });
  });

  describe("findById", () => {
    test("должен вернуть null при несуществующем ID", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    test("должен выбросить DatabaseError при неудачном сохранении", async () => {
      const agreement = Agreement.create({
        supplier_id: 1,
        customer_id: 2,
        supplier_warehouse_id: 1,
        customer_warehouse_id: 2,
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(agreement)).rejects.toThrow(DatabaseError);
    });
  });

  describe("update", () => {
    test("должен выбросить NotFoundError при обновлении несуществующего договора", async () => {
      const agreement = Agreement.create({
        supplier_id: 1,
        customer_id: 2,
        supplier_warehouse_id: 1,
        customer_warehouse_id: 2,
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(999, agreement)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("delete", () => {
    test("должен выбросить NotFoundError при удалении несуществующего договора", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("findByIdWithDetails", () => {
    test("должен вернуть null при несуществующем ID", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByIdWithDetails(999);
      expect(result).toBeNull();
    });
  });
});
