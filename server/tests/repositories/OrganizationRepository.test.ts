// tests/repositories/OrganizationRepository.test.ts
import { OrganizationRepository } from "../../src/repositories/OrganizationRepository";
import { Organization } from "../../src/domain/entities/Organization";
import { Pool } from "pg";
import { DatabaseError, NotFoundError } from "@shared/service";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("OrganizationRepository", () => {
  let repository: OrganizationRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new OrganizationRepository(mockPool);
  });

  describe("findAll", () => {
    test("должен вернуть пустой массив если организаций нет", async () => {
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
      const org = Organization.create("Тест");
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(org)).rejects.toThrow(DatabaseError);
    });
  });

  describe("update", () => {
    test("должен выбросить NotFoundError при обновлении несуществующей организации", async () => {
      const org = Organization.create("Тест");
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(999, org)).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    test("должен выбросить NotFoundError при удалении несуществующей организации", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getSuperAdminCount", () => {
    test("должен вернуть 0 если суперадминистраторов нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const result = await repository.getSuperAdminCount(1);
      expect(result).toBe(0);
    });
  });

  describe("hasSuperAdmin", () => {
    test("должен вернуть false если суперадминистраторов нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const result = await repository.hasSuperAdmin(1);
      expect(result).toBe(false);
    });
  });
});
