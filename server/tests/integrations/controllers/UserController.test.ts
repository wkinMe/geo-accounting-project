// tests/integrations/controllers/UserController.test.ts
import { UserController } from "../../../src/controllers/UserController";
import { Response } from "express";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@shared/service";
import { USER_ROLES } from "@shared/constants";

jest.mock("../../../src/services/UserService");
jest.mock("../../../src/repositories/UserRepository");
jest.mock("../../../src/repositories/RefreshTokenRepository");
jest.mock("../../../src/services/OrganizationService");
jest.mock("../../../src/repositories/OrganizationRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

import { UserService } from "../../../src/services/UserService";

interface RequestWithUser {
  params: any;
  query: any;
  body: any;
  cookies?: any;
  user?: {
    id: number;
    name: string;
    organization_id: number;
    role: string;
  };
}

describe("UserController Integration Tests", () => {
  let controller: UserController;
  let mockReq: RequestWithUser;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockCookie: jest.Mock;
  let mockClearCookie: jest.Mock;
  let mockUserService: jest.Mocked<UserService>;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockCookie = jest.fn();
    mockClearCookie = jest.fn();
    mockRes = {
      status: mockStatus,
      json: mockJson,
      cookie: mockCookie,
      clearCookie: mockClearCookie,
    };
    mockReq = {
      params: {},
      query: {},
      body: {},
      cookies: {},
      user: { id: 1, name: "testuser", organization_id: 1, role: "admin" },
    };

    controller = new UserController();
    mockUserService = (controller as any).userService;
  });

  describe("getAll", () => {
    test("должен вернуть список пользователей с пагинацией", async () => {
      const mockResult = {
        data: [{ id: 1, name: "user1", role: USER_ROLES.USER }],
        total: 1,
      };
      mockReq.query = { page: "1", limit: "20" };
      mockUserService.findAll.mockResolvedValue(mockResult as any);

      await controller.getAll(mockReq as any, mockRes as Response);

      expect(mockUserService.findAll).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });

    test("должен использовать фильтр по организации", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.query = { page: "1", limit: "20", organization_id: "5" };
      mockUserService.findAll.mockResolvedValue(mockResult as any);

      await controller.getAll(mockReq as any, mockRes as Response);

      expect(mockUserService.findAll).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
        5,
      );
    });
  });

  describe("getById", () => {
    test("должен вернуть пользователя по ID", async () => {
      const mockUser = { id: 1, name: "testuser", role: USER_ROLES.USER };
      mockReq.params = { id: "1" };
      mockUserService.findById.mockResolvedValue(mockUser as any);

      await controller.getById(mockReq as any, mockRes as Response);

      expect(mockUserService.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test("должен вернуть 404 при несуществующем ID", async () => {
      mockReq.params = { id: "999" };
      mockUserService.findById.mockRejectedValue(
        new NotFoundError(
          "Пользователь с ID 999 не найден",
          "User",
          "findById",
          999,
        ),
      );

      await controller.getById(mockReq as any, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Пользователь с ID 999 не найден",
      });
    });
  });

  describe("register", () => {
    test("должен зарегистрировать пользователя", async () => {
      const mockResult = {
        user: { id: 1, name: "newuser", role: USER_ROLES.USER },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };
      mockReq.body = {
        name: "newuser",
        password: "password123",
        organization_id: 1,
      };
      mockUserService.register.mockResolvedValue(mockResult as any);

      await controller.register(mockReq as any, mockRes as Response);

      expect(mockUserService.register).toHaveBeenCalledWith(
        mockReq.body,
        "admin",
      );
      expect(mockCookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.any(Object),
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: "access-token",
        },
      });
    });
  });

  describe("login", () => {
    test("должен выполнить вход пользователя", async () => {
      const mockResult = {
        user: { id: 1, name: "testuser", role: USER_ROLES.USER },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };
      mockReq.body = { name: "testuser", password: "password123" };
      mockUserService.login.mockResolvedValue(mockResult as any);

      await controller.login(mockReq as any, mockRes as Response);

      expect(mockUserService.login).toHaveBeenCalledWith(
        "testuser",
        "password123",
      );
      expect(mockCookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.any(Object),
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: "access-token",
        },
      });
    });
  });

  describe("refresh", () => {
    test("должен обновить токены", async () => {
      const mockResult = {
        user: { id: 1, name: "testuser", role: USER_ROLES.USER },
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };
      mockReq.cookies = { refreshToken: "old-refresh-token" };
      mockUserService.refreshToken.mockResolvedValue(mockResult as any);

      await controller.refresh(mockReq as any, mockRes as Response);

      expect(mockUserService.refreshToken).toHaveBeenCalledWith(
        "old-refresh-token",
      );
      expect(mockCookie).toHaveBeenCalledWith(
        "refreshToken",
        "new-refresh-token",
        expect.any(Object),
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: "new-access-token",
        },
      });
    });
  });

  describe("logout", () => {
    test("должен выполнить выход пользователя", async () => {
      mockReq.cookies = { refreshToken: "refresh-token" };
      mockUserService.logout.mockResolvedValue(undefined);

      await controller.logout(mockReq as any, mockRes as Response);

      expect(mockUserService.logout).toHaveBeenCalledWith("refresh-token");
      expect(mockClearCookie).toHaveBeenCalledWith("refreshToken");
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Выход выполнен успешно",
      });
    });
  });

  describe("getProfile", () => {
    test("должен вернуть профиль пользователя", async () => {
      const mockUser = { id: 1, name: "testuser", role: USER_ROLES.USER };
      mockReq.user = {
        id: 1,
        name: "testuser",
        organization_id: 1,
        role: "user",
      };
      mockUserService.findById.mockResolvedValue(mockUser as any);

      await controller.getProfile(mockReq as any, mockRes as Response);

      expect(mockUserService.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test("должен вернуть 401 при отсутствии пользователя", async () => {
      mockReq.user = undefined;

      await controller.getProfile(mockReq as any, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Не авторизован",
      });
    });
  });

  describe("update", () => {
    test("должен обновить пользователя", async () => {
      const mockUser = { id: 1, name: "updateduser", role: USER_ROLES.USER };
      mockReq.params = { id: "1" };
      mockReq.body = { id: 1, name: "updateduser" };
      mockUserService.update.mockResolvedValue(mockUser as any);

      await controller.update(mockReq as any, mockRes as Response);

      expect(mockUserService.update).toHaveBeenCalledWith(
        1,
        mockReq.body,
        "admin",
        1,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test("должен вернуть 403 при недостатке прав", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { id: 1, name: "updateduser" };
      mockUserService.update.mockRejectedValue(
        new ForbiddenError("Доступ запрещён", "update"),
      );

      await controller.update(mockReq as any, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Доступ запрещён",
      });
    });
  });

  describe("delete", () => {
    test("должен удалить пользователя", async () => {
      mockReq.params = { id: "1" };
      mockUserService.delete.mockResolvedValue(undefined);

      await controller.delete(mockReq as any, mockRes as Response);

      expect(mockUserService.delete).toHaveBeenCalledWith(1, "admin", 1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Пользователь успешно удалён",
      });
    });

    test("должен вернуть 403 при попытке удалить себя", async () => {
      mockReq.params = { id: "1" };
      mockUserService.delete.mockRejectedValue(
        new ForbiddenError(
          "Нельзя удалить свою собственную учётную запись",
          "delete",
        ),
      );

      await controller.delete(mockReq as any, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Нельзя удалить свою собственную учётную запись",
      });
    });
  });

  describe("search", () => {
    test("должен найти пользователей по запросу", async () => {
      const mockResult = {
        data: [{ id: 1, name: "testuser", role: USER_ROLES.USER }],
        total: 1,
      };
      mockReq.query = { q: "test", page: "1", limit: "20" };
      mockUserService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as any, mockRes as Response);

      expect(mockUserService.search).toHaveBeenCalledWith(
        "test",
        20,
        0,
        undefined,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        query: "test",
      });
    });

    test("должен вернуть 400 при отсутствии поискового запроса", async () => {
      mockReq.query = {};

      await controller.search(mockReq as any, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Параметр поиска 'q' обязателен",
      });
    });
  });

  describe("findByOrganizationId", () => {
    test("должен вернуть пользователей организации", async () => {
      const mockUsers = [
        { id: 1, name: "user1" },
        { id: 2, name: "user2" },
      ];
      mockReq.params = { id: "1" };
      mockUserService.findByOrganizationId.mockResolvedValue(mockUsers as any);

      await controller.findByOrganizationId(
        mockReq as any,
        mockRes as Response,
      );

      expect(mockUserService.findByOrganizationId).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
      });
    });
  });

  describe("getAdmins", () => {
    test("должен вернуть администраторов", async () => {
      const mockAdmins = [{ id: 1, name: "admin1", role: USER_ROLES.ADMIN }];
      mockReq.query = { organization_id: "1" };
      mockUserService.findAdmins.mockResolvedValue(mockAdmins as any);

      await controller.getAdmins(mockReq as any, mockRes as Response);

      expect(mockUserService.findAdmins).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAdmins,
      });
    });
  });

  describe("getSuperAdmins", () => {
    test("должен вернуть главных администраторов", async () => {
      const mockSuperAdmins = [
        { id: 1, name: "superadmin1", role: USER_ROLES.SUPER_ADMIN },
      ];
      mockUserService.findSuperAdmins.mockResolvedValue(mockSuperAdmins as any);

      await controller.getSuperAdmins(mockReq as any, mockRes as Response);

      expect(mockUserService.findSuperAdmins).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSuperAdmins,
      });
    });
  });
});
