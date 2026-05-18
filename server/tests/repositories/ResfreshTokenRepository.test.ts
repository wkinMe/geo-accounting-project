// tests/repositories/RefreshTokenRepository.test.ts
import { RefreshTokenRepository } from "../../src/repositories/RefreshTokenRepository";
import { RefreshToken } from "../../src/domain/entities/RefreshToken";
import { Pool } from "pg";

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe("RefreshTokenRepository", () => {
  let repository: RefreshTokenRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new RefreshTokenRepository(mockPool);
  });

  describe("findByToken", () => {
    test("должен вернуть null если токен не найден", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByToken("invalid-token");
      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    test("должен вернуть null если токен для пользователя не найден", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByUserId(999);
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    test("должен создать новый токен если существующего нет", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const token = RefreshToken.create(1, "new-token");
      const result = await repository.save(token);
      expect(result.user_id).toBe(1);
      expect(result.token).toBe("new-token");
    });

    test("должен обновить существующий токен", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, refreshToken: "old-token" }],
      });
      mockQuery.mockResolvedValueOnce({});
      const token = RefreshToken.create(1, "updated-token");
      const result = await repository.save(token);
      expect(result.token).toBe("updated-token");
    });
  });

  describe("delete", () => {
    test("должен выполнить удаление токена", async () => {
      mockQuery.mockResolvedValueOnce({});
      await repository.delete("some-token");
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("deleteByUserId", () => {
    test("должен выполнить удаление токена по ID пользователя", async () => {
      mockQuery.mockResolvedValueOnce({});
      await repository.deleteByUserId(1);
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});
