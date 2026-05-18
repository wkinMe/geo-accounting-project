// tests/repositories/UserRepository.test.ts
import { UserRepository } from "../../src/repositories/UserRepository";
import { User } from "../../src/domain/entities/User";
import { Pool } from "pg";
import { DatabaseError, NotFoundError } from "@shared/service";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("UserRepository", () => {
  let repository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository(mockPool);
    (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
  });

  describe("findAll", () => {
    test("должен вернуть пустой массив если пользователей нет", async () => {
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

  describe("findByOrganizationId", () => {
    test("должен вернуть пустой массив если в организации нет пользователей", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByOrganizationId(999);
      expect(result).toEqual([]);
    });
  });

  describe("findByRole", () => {
    test("должен вернуть пустой массив если нет пользователей с такой ролью", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByRole("admin");
      expect(result).toEqual([]);
    });
  });

  describe("save", () => {
    test("должен выбросить DatabaseError при неудачном сохранении", async () => {
      const user = User.create("test", "password", "user", 1);
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(user)).rejects.toThrow(DatabaseError);
    });
  });

  describe("update", () => {
    test("должен выбросить ошибку если нет полей для обновления", async () => {
      await expect(repository.update(1, {} as User)).rejects.toThrow(
        "Нет полей для обновления",
      );
    });

    test("должен выбросить NotFoundError при обновлении несуществующего пользователя", async () => {
      const user = User.create("test", "password", "user", 1);
      jest.spyOn(user, "name", "get").mockReturnValue("newname");
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(999, user)).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    test("должен выбросить NotFoundError при удалении несуществующего пользователя", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("countSuperAdminsInOrganization", () => {
    test("должен вернуть 0 если суперадминистраторов нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const result = await repository.countSuperAdminsInOrganization(1);
      expect(result).toBe(0);
    });
  });

  describe("checkOrganizationHasSuperAdmin", () => {
    test("должен вернуть false если суперадминистраторов нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ has_super_admin: false }] });
      const result = await repository.checkOrganizationHasSuperAdmin(1);
      expect(result).toBe(false);
    });
  });
});
