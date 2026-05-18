// tests/integration/TokenService.integration.test.ts
import { TokenService } from "../../../src/services/TokenService";
import { UnauthorizedError } from "@shared/service";
import jwt from "jsonwebtoken";

describe("TokenService Integration Tests", () => {
  let tokenService: TokenService;

  beforeAll(() => {
    process.env.JWT_ACCESS_TOKEN_SECRET = "test_access_secret";
    process.env.JWT_REFRESH_TOKEN_SECRET = "test_refresh_secret";
    tokenService = new TokenService();
  });

  test("должен сгенерировать access и refresh токены", () => {
    const userData = {
      id: 1,
      name: "testuser",
      organization_id: 1,
      role: "admin" as const,
    };
    const tokens = tokenService.generateTokens(userData);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  test("должен верифицировать корректный access токен", () => {
    const userData = {
      id: 1,
      name: "testuser",
      organization_id: 1,
      role: "manager" as const,
    };
    const { accessToken } = tokenService.generateTokens(userData);
    const decoded = tokenService.verifyAccessToken(accessToken);
    expect(decoded.id).toBe(1);
    expect(decoded.name).toBe("testuser");
    expect(decoded.role).toBe("manager");
  });

  test("должен добавить роль по умолчанию если её нет в токене", () => {
    const tokenServiceLocal = new TokenService();
    const mockDecode = jest.spyOn(jwt, "verify").mockReturnValueOnce({
      id: 1,
      name: "testuser",
      organization_id: 1,
    } as any);
    const decoded = tokenServiceLocal.verifyAccessToken("fake-token");
    expect(decoded.role).toBe("user");
    mockDecode.mockRestore();
  });

  test("должен выбросить ошибку при просроченном access токене", () => {
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTAwMDAwMDAwLCJleHAiOjE1MDAwMDAwMDB9.signature";
    expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow(
      UnauthorizedError,
    );
  });

  test("должен выбросить ошибку при неверном access токене", () => {
    expect(() => tokenService.verifyAccessToken("invalid-token")).toThrow(
      UnauthorizedError,
    );
  });

  test("должен верифицировать корректный refresh токен", () => {
    const userData = {
      id: 1,
      name: "testuser",
      organization_id: 1,
      role: "user" as const,
    };
    const { refreshToken } = tokenService.generateTokens(userData);
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    expect(decoded.id).toBe(1);
  });

  test("должен выбросить ошибку при неверном refresh токене", () => {
    expect(() => tokenService.verifyRefreshToken("invalid-refresh")).toThrow(
      UnauthorizedError,
    );
  });

  test("должен декодировать токен без верификации", () => {
    const userData = {
      id: 1,
      name: "testuser",
      organization_id: 1,
      role: "admin" as const,
    };
    const { accessToken } = tokenService.generateTokens(userData);
    const decoded = tokenService.decodeToken(accessToken);
    expect(decoded?.id).toBe(1);
    expect(decoded?.name).toBe("testuser");
  });

  test("должен вернуть null при декодировании неверного токена", () => {
    const decoded = tokenService.decodeToken("invalid");
    expect(decoded).toBeNull();
  });

  test("должен валидировать корректный payload токена", () => {
    const validPayload = {
      id: 1,
      name: "test",
      organization_id: 1,
      role: "user" as const,
    };
    expect(tokenService.validateTokenPayload(validPayload)).toBe(true);
  });

  test("должен вернуть false при отсутствии обязательных полей в payload", () => {
    const invalidPayload = {
      id: 1,
      name: "test",
    } as any;
    expect(tokenService.validateTokenPayload(invalidPayload)).toBe(false);
  });
});
